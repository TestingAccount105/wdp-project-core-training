<?php
require_once 'config.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$user_id = validate_session();

switch ($action) {
    case 'createInvite':
        createInvite($user_id);
        break;
    case 'getInvites':
        getInvites($user_id);
        break;
    case 'getInviteInfo':
        getInviteInfo();
        break;
    case 'deleteInvite':
        deleteInvite($user_id);
        break;
    case 'inviteTitibot':
        inviteTitibot($user_id);
        break;
    default:
        send_response(['error' => 'Invalid action'], 400);
}

function createInvite($user_id) {
    global $mysqli;
    
    $server_id = $_POST['serverId'] ?? '';
    $expires_in = intval($_POST['expiresIn'] ?? 0); // 0 = never expires
    $max_uses = intval($_POST['maxUses'] ?? 0); // 0 = unlimited
    
    if (empty($server_id)) {
        send_response(['error' => 'Server ID is required'], 400);
    }
    
    // Check if user is member of server
    if (!is_server_member($user_id, $server_id)) {
        send_response(['error' => 'Access denied'], 403);
    }
    
    try {
        $invite_code = generate_invite_code();
        $expires_at = null;
        
        if ($expires_in > 0) {
            $expires_at = date('Y-m-d H:i:s', time() + ($expires_in * 3600)); // hours to seconds
        }
        
        $stmt = $mysqli->prepare("
            INSERT INTO ServerInvite (ServerID, InviterUserID, InviteLink, ExpiresAt) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->bind_param("iiss", $server_id, $user_id, $invite_code, $expires_at);
        $stmt->execute();
        
        $invite_id = $mysqli->insert_id;
        
        // Get the created invite with server info
        $stmt = $mysqli->prepare("
            SELECT si.*, s.Name as ServerName, s.IconServer, u.Username as CreatedByUsername
            FROM ServerInvite si
            JOIN Server s ON si.ServerID = s.ID
            JOIN Users u ON si.InviterUserID = u.ID
            WHERE si.ID = ?
        ");
        $stmt->bind_param("i", $invite_id);
        $stmt->execute();
        $invite_data = $stmt->get_result()->fetch_assoc();
        
        send_response([
            'success' => true, 
            'message' => 'Invite created successfully',
            'invite' => $invite_data
        ]);
    } catch (Exception $e) {
        error_log("Error creating invite: " . $e->getMessage());
        send_response(['error' => 'Failed to create invite'], 500);
    }
}

function getInvites($user_id) {
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
            SELECT si.*, u.Username as CreatedByUsername, u.ProfilePictureUrl as CreatedByAvatar
            FROM ServerInvite si
            JOIN Users u ON si.InviterUserID = u.ID
            WHERE si.ServerID = ? AND (si.ExpiresAt IS NULL OR si.ExpiresAt > NOW())
            ORDER BY si.ID DESC
        ");
        $stmt->bind_param("i", $server_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $invites = [];
        while ($row = $result->fetch_assoc()) {
            $invites[] = $row;
        }
        
        send_response(['success' => true, 'invites' => $invites]);
    } catch (Exception $e) {
        error_log("Error getting invites: " . $e->getMessage());
        send_response(['error' => 'Failed to load invites'], 500);
    }
}

function getInviteInfo() {
    global $mysqli;
    
    $invite_code = $_GET['code'] ?? '';
    if (empty($invite_code)) {
        send_response(['error' => 'Invite code is required'], 400);
    }
    
    try {
        $stmt = $mysqli->prepare("
            SELECT si.*, s.Name as ServerName, s.Description, s.IconServer, s.BannerServer,
                   COUNT(usm.UserID) as MemberCount
            FROM ServerInvite si
            JOIN Server s ON si.ServerID = s.ID
            LEFT JOIN UserServerMemberships usm ON s.ID = usm.ServerID
            WHERE si.InviteLink = ? AND (si.ExpiresAt IS NULL OR si.ExpiresAt > NOW())
            GROUP BY si.ID
        ");
        $stmt->bind_param("s", $invite_code);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($invite = $result->fetch_assoc()) {
            // Invite is valid if we reach here
            
            send_response(['success' => true, 'invite' => $invite]);
        } else {
            send_response(['error' => 'Invalid or expired invite'], 400);
        }
    } catch (Exception $e) {
        error_log("Error getting invite info: " . $e->getMessage());
        send_response(['error' => 'Failed to load invite information'], 500);
    }
}

function deleteInvite($user_id) {
    global $mysqli;
    
    $invite_id = $_POST['inviteId'] ?? '';
    
    if (empty($invite_id)) {
        send_response(['error' => 'Invite ID is required'], 400);
    }
    
    try {
        // Get invite info to check permissions
        $stmt = $mysqli->prepare("
            SELECT si.*, s.ID as ServerID 
            FROM ServerInvite si
            JOIN Server s ON si.ServerID = s.ID
            WHERE si.ID = ?
        ");
        $stmt->bind_param("i", $invite_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$invite = $result->fetch_assoc()) {
            send_response(['error' => 'Invite not found'], 404);
        }
        
        // Check if user can delete (creator of invite or server admin)
        $can_delete = ($invite['InviterUserID'] == $user_id) || is_server_admin($user_id, $invite['ServerID']);
        
        if (!$can_delete) {
            send_response(['error' => 'Access denied'], 403);
        }
        
        $stmt = $mysqli->prepare("DELETE FROM ServerInvite WHERE ID = ?");
        $stmt->bind_param("i", $invite_id);
        $stmt->execute();
        
        if ($stmt->affected_rows > 0) {
            send_response(['success' => true, 'message' => 'Invite deleted successfully']);
        } else {
            send_response(['error' => 'Failed to delete invite'], 500);
        }
    } catch (Exception $e) {
        error_log("Error deleting invite: " . $e->getMessage());
        send_response(['error' => 'Failed to delete invite'], 500);
    }
}

function inviteTitibot($user_id) {
    global $mysqli;
    
    $server_id = $_POST['serverId'] ?? '';
    
    if (empty($server_id)) {
        send_response(['error' => 'Server ID is required'], 400);
    }
    
    // Check if user is admin or owner
    if (!is_server_admin($user_id, $server_id)) {
        send_response(['error' => 'Access denied'], 403);
    }
    
    try {
        // Check if Titibot already exists in the system
        $stmt = $mysqli->prepare("SELECT ID FROM Users WHERE Username = 'Titibot'");
        $stmt->execute();
        $result = $stmt->get_result();
        
        $titibot_id = null;
        if ($bot = $result->fetch_assoc()) {
            $titibot_id = $bot['ID'];
        } else {
            // Create Titibot user
            $stmt = $mysqli->prepare("
                INSERT INTO Users (Username, DisplayName, Email, Password, ProfilePictureUrl, Bio) 
                VALUES ('Titibot', 'Titibot', 'titibot@system.local', '', '/user/user-server/assets/images/titibot-avatar.png', 'I am Titibot, your friendly server assistant!')
            ");
            $stmt->execute();
            $titibot_id = $mysqli->insert_id;
        }
        
        // Check if Titibot is already in the server
        $stmt = $mysqli->prepare("
            SELECT ID FROM UserServerMemberships 
            WHERE UserID = ? AND ServerID = ?
        ");
        $stmt->bind_param("ii", $titibot_id, $server_id);
        $stmt->execute();
        
        if ($stmt->get_result()->num_rows > 0) {
            send_response(['error' => 'Titibot is already in this server'], 400);
        }
        
        // Add Titibot to server
        $stmt = $mysqli->prepare("
            INSERT INTO UserServerMemberships (UserID, ServerID, Role) 
            VALUES (?, ?, 'Member')
        ");
        $stmt->bind_param("ii", $titibot_id, $server_id);
        $stmt->execute();
        
        send_response(['success' => true, 'message' => 'Titibot has been invited to the server']);
    } catch (Exception $e) {
        error_log("Error inviting Titibot: " . $e->getMessage());
        send_response(['error' => 'Failed to invite Titibot'], 500);
    }
}
?>