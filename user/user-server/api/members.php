<?php
require_once 'config.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$user_id = validate_session();

switch ($action) {
    case 'getMembers':
        getMembers($user_id);
        break;
    case 'updateMemberRole':
        updateMemberRole($user_id);
        break;
    case 'kickMember':
        kickMember($user_id);
        break;
    case 'banMember':
        banMember($user_id);
        break;
    case 'unbanMember':
        unbanMember($user_id);
        break;
    case 'getBannedMembers':
        getBannedMembers($user_id);
        break;
    case 'getMemberProfile':
        getMemberProfile($user_id);
        break;
    default:
        send_response(['error' => 'Invalid action'], 400);
}

function getMembers($user_id) {
    global $mysqli;
    
    $server_id = $_GET['serverId'] ?? '';
    if (empty($server_id)) {
        send_response(['error' => 'Server ID is required'], 400);
    }
    
    // Check if user is member of server
    if (!is_server_member($user_id, $server_id)) {
        send_response(['error' => 'Access denied'], 403);
    }
    
    try {
        $stmt = $mysqli->prepare("
            SELECT u.ID, u.Username, u.DisplayName, u.ProfilePictureUrl, u.Discriminator,
                   usm.Role, usm.JoinedAt, uls.Status, uls.LastSeenAt
            FROM UserServerMemberships usm
            JOIN Users u ON usm.UserID = u.ID
            LEFT JOIN UserLastSeen uls ON u.ID = uls.UserID
            WHERE usm.ServerID = ?
            ORDER BY 
                CASE usm.Role 
                    WHEN 'Owner' THEN 1 
                    WHEN 'Admin' THEN 2 
                    WHEN 'Bot' THEN 3 
                    WHEN 'Member' THEN 4 
                    ELSE 5 
                END,
                u.Username ASC
        ");
        $stmt->bind_param("i", $server_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $members = [];
        while ($row = $result->fetch_assoc()) {
            // Determine online status
            if ($row['Status'] && $row['LastSeenAt']) {
                $last_seen = new DateTime($row['LastSeenAt']);
                $now = new DateTime();
                $diff = $now->diff($last_seen);
                
                // Consider offline if last seen more than 5 minutes ago
                if ($diff->i > 5 || $diff->h > 0 || $diff->days > 0) {
                    $row['Status'] = 'offline';
                }
            } else {
                $row['Status'] = 'offline';
            }
            
            $members[] = $row;
        }
        
        send_response(['success' => true, 'members' => $members]);
    } catch (Exception $e) {
        error_log("Error getting members: " . $e->getMessage());
        send_response(['error' => 'Failed to load members'], 500);
    }
}

function updateMemberRole($user_id) {
    global $mysqli;
    
    $server_id = $_POST['serverId'] ?? '';
    $member_id = $_POST['memberId'] ?? '';
    $new_role = sanitize_input($_POST['newRole'] ?? '');
    
    if (empty($server_id) || empty($member_id) || empty($new_role)) {
        send_response(['error' => 'Server ID, member ID, and new role are required'], 400);
    }
    
    // Check if user is owner
    if (!is_server_owner($user_id, $server_id)) {
        send_response(['error' => 'Only server owner can change member roles'], 403);
    }
    
    // Validate role
    $valid_roles = ['Member', 'Admin'];
    if (!in_array($new_role, $valid_roles)) {
        send_response(['error' => 'Invalid role'], 400);
    }
    
    // Prevent changing own role
    if ($member_id == $user_id) {
        send_response(['error' => 'Cannot change your own role'], 400);
    }
    
    try {
        // Check if member exists in server
        $stmt = $mysqli->prepare("
            SELECT Role FROM UserServerMemberships 
            WHERE UserID = ? AND ServerID = ?
        ");
        $stmt->bind_param("ii", $member_id, $server_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$member = $result->fetch_assoc()) {
            send_response(['error' => 'Member not found in server'], 404);
        }
        
        // Prevent changing owner role
        if ($member['Role'] === 'Owner') {
            send_response(['error' => 'Cannot change owner role'], 400);
        }
        
        // Update role
        $stmt = $mysqli->prepare("
            UPDATE UserServerMemberships 
            SET Role = ? 
            WHERE UserID = ? AND ServerID = ?
        ");
        $stmt->bind_param("sii", $new_role, $member_id, $server_id);
        $stmt->execute();
        
        if ($stmt->affected_rows > 0) {
            send_response(['success' => true, 'message' => 'Member role updated successfully']);
        } else {
            send_response(['error' => 'No changes made'], 400);
        }
    } catch (Exception $e) {
        error_log("Error updating member role: " . $e->getMessage());
        send_response(['error' => 'Failed to update member role'], 500);
    }
}

function kickMember($user_id) {
    global $mysqli;
    
    $server_id = $_POST['serverId'] ?? '';
    $member_id = $_POST['memberId'] ?? '';
    $reason = sanitize_input($_POST['reason'] ?? '');
    
    if (empty($server_id) || empty($member_id)) {
        send_response(['error' => 'Server ID and member ID are required'], 400);
    }
    
    // Check if user is admin or owner
    if (!is_server_admin($user_id, $server_id)) {
        send_response(['error' => 'Access denied'], 403);
    }
    
    // Prevent kicking self
    if ($member_id == $user_id) {
        send_response(['error' => 'Cannot kick yourself'], 400);
    }
    
    try {
        // Get member info
        $stmt = $mysqli->prepare("
            SELECT usm.Role, u.Username 
            FROM UserServerMemberships usm
            JOIN Users u ON usm.UserID = u.ID
            WHERE usm.UserID = ? AND usm.ServerID = ?
        ");
        $stmt->bind_param("ii", $member_id, $server_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$member = $result->fetch_assoc()) {
            send_response(['error' => 'Member not found in server'], 404);
        }
        
        // Prevent kicking owner
        if ($member['Role'] === 'Owner') {
            send_response(['error' => 'Cannot kick server owner'], 400);
        }
        
        // Admins can only kick members, not other admins (unless they're owner)
        if ($member['Role'] === 'Admin' && !is_server_owner($user_id, $server_id)) {
            send_response(['error' => 'Cannot kick other admins'], 403);
        }
        
        // Remove member from server
        $stmt = $mysqli->prepare("
            DELETE FROM UserServerMemberships 
            WHERE UserID = ? AND ServerID = ?
        ");
        $stmt->bind_param("ii", $member_id, $server_id);
        $stmt->execute();
        
        if ($stmt->affected_rows > 0) {
            send_response([
                'success' => true, 
                'message' => "Successfully kicked {$member['Username']} from the server"
            ]);
        } else {
            send_response(['error' => 'Failed to kick member'], 500);
        }
    } catch (Exception $e) {
        error_log("Error kicking member: " . $e->getMessage());
        send_response(['error' => 'Failed to kick member'], 500);
    }
}

function banMember($user_id) {
    global $mysqli;
    
    $server_id = $_POST['serverId'] ?? '';
    $member_id = $_POST['memberId'] ?? '';
    $reason = sanitize_input($_POST['reason'] ?? '');
    $duration = intval($_POST['duration'] ?? 0); // 0 = permanent
    
    if (empty($server_id) || empty($member_id)) {
        send_response(['error' => 'Server ID and member ID are required'], 400);
    }
    
    // Check if user is admin or owner
    if (!is_server_admin($user_id, $server_id)) {
        send_response(['error' => 'Access denied'], 403);
    }
    
    // Prevent banning self
    if ($member_id == $user_id) {
        send_response(['error' => 'Cannot ban yourself'], 400);
    }
    
    try {
        // Get member info
        $stmt = $mysqli->prepare("
            SELECT usm.Role, u.Username 
            FROM UserServerMemberships usm
            JOIN Users u ON usm.UserID = u.ID
            WHERE usm.UserID = ? AND usm.ServerID = ?
        ");
        $stmt->bind_param("ii", $member_id, $server_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$member = $result->fetch_assoc()) {
            send_response(['error' => 'Member not found in server'], 404);
        }
        
        // Prevent banning owner
        if ($member['Role'] === 'Owner') {
            send_response(['error' => 'Cannot ban server owner'], 400);
        }
        
        // Admins can only ban members, not other admins (unless they're owner)
        if ($member['Role'] === 'Admin' && !is_server_owner($user_id, $server_id)) {
            send_response(['error' => 'Cannot ban other admins'], 403);
        }
        
        $mysqli->begin_transaction();
        
        // Remove member from server
        $stmt = $mysqli->prepare("
            DELETE FROM UserServerMemberships 
            WHERE UserID = ? AND ServerID = ?
        ");
        $stmt->bind_param("ii", $member_id, $server_id);
        $stmt->execute();
        
        // Add to ban list (create table if needed)
        $expires_at = null;
        if ($duration > 0) {
            $expires_at = date('Y-m-d H:i:s', time() + ($duration * 3600)); // duration in hours
        }
        
        // Create ServerBans table if it doesn't exist
        $mysqli->query("
            CREATE TABLE IF NOT EXISTS ServerBans (
                ID INTEGER(10) PRIMARY KEY AUTO_INCREMENT,
                ServerID INTEGER(10) NOT NULL,
                UserID INTEGER(10) NOT NULL,
                BannedBy INTEGER(10) NOT NULL,
                Reason TEXT,
                BannedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ExpiresAt TIMESTAMP NULL,
                FOREIGN KEY (ServerID) REFERENCES Server(ID) ON DELETE CASCADE,
                FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE,
                FOREIGN KEY (BannedBy) REFERENCES Users(ID) ON DELETE CASCADE,
                UNIQUE KEY unique_server_user (ServerID, UserID)
            )
        ");
        
        $stmt = $mysqli->prepare("
            INSERT INTO ServerBans (ServerID, UserID, BannedBy, Reason, ExpiresAt) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("iiiss", $server_id, $member_id, $user_id, $reason, $expires_at);
        $stmt->execute();
        
        $mysqli->commit();
        
        $ban_type = $duration > 0 ? "temporarily banned" : "permanently banned";
        send_response([
            'success' => true, 
            'message' => "Successfully {$ban_type} {$member['Username']} from the server"
        ]);
    } catch (Exception $e) {
        $mysqli->rollback();
        error_log("Error banning member: " . $e->getMessage());
        send_response(['error' => 'Failed to ban member'], 500);
    }
}

function unbanMember($user_id) {
    global $mysqli;
    
    $server_id = $_POST['serverId'] ?? '';
    $member_id = $_POST['memberId'] ?? '';
    
    if (empty($server_id) || empty($member_id)) {
        send_response(['error' => 'Server ID and member ID are required'], 400);
    }
    
    // Check if user is admin or owner
    if (!is_server_admin($user_id, $server_id)) {
        send_response(['error' => 'Access denied'], 403);
    }
    
    try {
        $stmt = $mysqli->prepare("
            DELETE FROM ServerBans 
            WHERE ServerID = ? AND UserID = ?
        ");
        $stmt->bind_param("ii", $server_id, $member_id);
        $stmt->execute();
        
        if ($stmt->affected_rows > 0) {
            send_response(['success' => true, 'message' => 'Member unbanned successfully']);
        } else {
            send_response(['error' => 'Ban not found'], 404);
        }
    } catch (Exception $e) {
        error_log("Error unbanning member: " . $e->getMessage());
        send_response(['error' => 'Failed to unban member'], 500);
    }
}

function getBannedMembers($user_id) {
    global $mysqli;
    
    $server_id = $_GET['serverId'] ?? '';
    if (empty($server_id)) {
        send_response(['error' => 'Server ID is required'], 400);
    }
    
    // Check if user is admin or owner
    if (!is_server_admin($user_id, $server_id)) {
        send_response(['error' => 'Access denied'], 403);
    }
    
    try {
        $stmt = $mysqli->prepare("
            SELECT sb.*, u.Username, u.DisplayName, u.ProfilePictureUrl, u.Discriminator,
                   bu.Username as BannedByUsername
            FROM ServerBans sb
            JOIN Users u ON sb.UserID = u.ID
            JOIN Users bu ON sb.BannedBy = bu.ID
            WHERE sb.ServerID = ? AND (sb.ExpiresAt IS NULL OR sb.ExpiresAt > NOW())
            ORDER BY sb.BannedAt DESC
        ");
        $stmt->bind_param("i", $server_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $banned_members = [];
        while ($row = $result->fetch_assoc()) {
            $banned_members[] = $row;
        }
        
        send_response(['success' => true, 'bannedMembers' => $banned_members]);
    } catch (Exception $e) {
        error_log("Error getting banned members: " . $e->getMessage());
        send_response(['error' => 'Failed to load banned members'], 500);
    }
}

function getMemberProfile($user_id) {
    global $mysqli;
    
    $server_id = $_GET['serverId'] ?? '';
    $member_id = $_GET['memberId'] ?? '';
    
    if (empty($server_id) || empty($member_id)) {
        send_response(['error' => 'Server ID and member ID are required'], 400);
    }
    
    // Check if user is member of server
    if (!is_server_member($user_id, $server_id)) {
        send_response(['error' => 'Access denied'], 403);
    }
    
    try {
        $stmt = $mysqli->prepare("
            SELECT u.ID, u.Username, u.DisplayName, u.ProfilePictureUrl, u.BannerProfile,
                   u.Bio, u.Discriminator, usm.Role, usm.JoinedAt, uls.Status, uls.LastSeenAt
            FROM UserServerMemberships usm
            JOIN Users u ON usm.UserID = u.ID
            LEFT JOIN UserLastSeen uls ON u.ID = uls.UserID
            WHERE usm.UserID = ? AND usm.ServerID = ?
        ");
        $stmt->bind_param("ii", $member_id, $server_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($member = $result->fetch_assoc()) {
            // Get message count in server
            $stmt = $mysqli->prepare("
                SELECT COUNT(*) as message_count
                FROM Message m
                JOIN ChannelMessage cm ON m.ID = cm.MessageID
                JOIN Channel c ON cm.ChannelID = c.ID
                WHERE m.UserID = ? AND c.ServerID = ?
            ");
            $stmt->bind_param("ii", $member_id, $server_id);
            $stmt->execute();
            $message_count = $stmt->get_result()->fetch_assoc()['message_count'];
            
            $member['message_count'] = $message_count;
            
            send_response(['success' => true, 'member' => $member]);
        } else {
            send_response(['error' => 'Member not found in server'], 404);
        }
    } catch (Exception $e) {
        error_log("Error getting member profile: " . $e->getMessage());
        send_response(['error' => 'Failed to load member profile'], 500);
    }
}
?>