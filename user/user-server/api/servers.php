<?php
require_once 'config.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$user_id = validate_session();

switch ($action) {
    case 'getUserServers':
        getUserServers($user_id);
        break;
    case 'getServer':
        getServer($user_id);
        break;
    case 'createServer':
        createServer($user_id);
        break;
    case 'updateServer':
        updateServer($user_id);
        break;
    case 'deleteServer':
        deleteServer($user_id);
        break;
    case 'joinServer':
        joinServer($user_id);
        break;
    case 'leaveServer':
        leaveServer($user_id);
        break;
    case 'transferOwnership':
        transferOwnership($user_id);
        break;
    case 'getPublicServers':
        getPublicServers();
        break;
    default:
        send_response(['error' => 'Invalid action'], 400);
}

function getUserServers($user_id) {
    global $mysqli;
    
    try {
        $stmt = $mysqli->prepare("
            SELECT s.*, usm.Role, usm.JoinedAt 
            FROM Server s 
            JOIN UserServerMemberships usm ON s.ID = usm.ServerID 
            WHERE usm.UserID = ? 
            ORDER BY usm.JoinedAt DESC
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $servers = [];
        while ($row = $result->fetch_assoc()) {
            $servers[] = $row;
        }
        
        send_response(['success' => true, 'servers' => $servers]);
    } catch (Exception $e) {
        error_log("Error getting user servers: " . $e->getMessage());
        send_response(['error' => 'Failed to load servers'], 500);
    }
}

function getServer($user_id) {
    global $mysqli;
    
    $server_id = $_GET['id'] ?? '';
    if (empty($server_id)) {
        send_response(['error' => 'Server ID is required'], 400);
    }
    
    try {
        // Check if user is member of server
        if (!is_server_member($user_id, $server_id)) {
            send_response(['error' => 'Access denied'], 403);
        }
        
        $stmt = $mysqli->prepare("
            SELECT s.*, usm.Role as userRole 
            FROM Server s 
            JOIN UserServerMemberships usm ON s.ID = usm.ServerID 
            WHERE s.ID = ? AND usm.UserID = ?
        ");
        $stmt->bind_param("ii", $server_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($server = $result->fetch_assoc()) {
            send_response(['success' => true, 'server' => $server]);
        } else {
            send_response(['error' => 'Server not found'], 404);
        }
    } catch (Exception $e) {
        error_log("Error getting server: " . $e->getMessage());
        send_response(['error' => 'Failed to load server'], 500);
    }
}

function createServer($user_id) {
    global $mysqli, $server_categories;
    
    $name = sanitize_input($_POST['name'] ?? '');
    $description = sanitize_input($_POST['description'] ?? '');
    $category = sanitize_input($_POST['category'] ?? 'Other');
    $is_public = isset($_POST['isPublic']) ? (bool)$_POST['isPublic'] : false;
    $icon_server = $_POST['iconServer'] ?? null;
    $banner_server = $_POST['bannerServer'] ?? null;
    
    if (empty($name)) {
        send_response(['error' => 'Server name is required'], 400);
    }
    
    if (!in_array($category, $server_categories)) {
        $category = 'Other';
    }
    
    $mysqli->begin_transaction();
    
    try {
        // Create server
        $stmt = $mysqli->prepare("
            INSERT INTO Server (Name, Description, Category, IconServer, BannerServer, IsPrivate) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $is_private = $is_public ? 0 : 1;
        $stmt->bind_param("sssssi", $name, $description, $category, $icon_server, $banner_server, $is_private);
        $stmt->execute();
        
        $server_id = $mysqli->insert_id;
        
        // Add creator as owner
        $stmt = $mysqli->prepare("
            INSERT INTO UserServerMemberships (UserID, ServerID, Role) 
            VALUES (?, ?, 'Owner')
        ");
        $stmt->bind_param("ii", $user_id, $server_id);
        $stmt->execute();
        
        // Create default channels
        $channels = [
            ['general', 'Text'],
            ['General', 'Voice']
        ];
        
        foreach ($channels as $channel) {
            $stmt = $mysqli->prepare("
                INSERT INTO Channel (ServerID, Name, Type) 
                VALUES (?, ?, ?)
            ");
            $stmt->bind_param("iss", $server_id, $channel[0], $channel[1]);
            $stmt->execute();
        }
        
        $mysqli->commit();
        
        send_response([
            'success' => true, 
            'message' => 'Server created successfully',
            'serverId' => $server_id
        ]);
    } catch (Exception $e) {
        $mysqli->rollback();
        error_log("Error creating server: " . $e->getMessage());
        send_response(['error' => 'Failed to create server'], 500);
    }
}

function updateServer($user_id) {
    global $mysqli, $server_categories;
    
    $server_id = $_POST['serverId'] ?? '';
    $field = $_POST['field'] ?? '';
    $value = sanitize_input($_POST['value'] ?? '');
    
    if (empty($server_id) || empty($field)) {
        send_response(['error' => 'Server ID and field are required'], 400);
    }
    
    // Check if user is owner or admin
    if (!is_server_admin($user_id, $server_id)) {
        send_response(['error' => 'Access denied'], 403);
    }
    
    $allowed_fields = ['Name', 'Description', 'Category', 'IsPrivate', 'IconServer', 'BannerServer'];
    if (!in_array($field, $allowed_fields)) {
        send_response(['error' => 'Invalid field'], 400);
    }
    
    try {
        if ($field === 'Category' && !in_array($value, $server_categories)) {
            send_response(['error' => 'Invalid category'], 400);
        }
        
        if ($field === 'IsPrivate') {
            $value = $value ? 1 : 0;
        }
        
        $stmt = $mysqli->prepare("UPDATE Server SET $field = ? WHERE ID = ?");
        $stmt->bind_param("si", $value, $server_id);
        $stmt->execute();
        
        if ($stmt->affected_rows > 0) {
            send_response(['success' => true, 'message' => 'Server updated successfully']);
        } else {
            send_response(['error' => 'No changes made'], 400);
        }
    } catch (Exception $e) {
        error_log("Error updating server: " . $e->getMessage());
        send_response(['error' => 'Failed to update server'], 500);
    }
}

function deleteServer($user_id) {
    global $mysqli;
    
    $server_id = $_POST['serverId'] ?? '';
    $confirmation = sanitize_input($_POST['confirmation'] ?? '');
    
    if (empty($server_id)) {
        send_response(['error' => 'Server ID is required'], 400);
    }
    
    // Check if user is owner
    if (!is_server_owner($user_id, $server_id)) {
        send_response(['error' => 'Only server owner can delete the server'], 403);
    }
    
    try {
        // Get server name for confirmation
        $stmt = $mysqli->prepare("SELECT Name FROM Server WHERE ID = ?");
        $stmt->bind_param("i", $server_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$server = $result->fetch_assoc()) {
            send_response(['error' => 'Server not found'], 404);
        }
        
        if ($confirmation !== $server['Name']) {
            send_response(['error' => 'Server name confirmation does not match'], 400);
        }
        
        $mysqli->begin_transaction();
        
        // Delete server (cascading deletes will handle related records)
        $stmt = $mysqli->prepare("DELETE FROM Server WHERE ID = ?");
        $stmt->bind_param("i", $server_id);
        $stmt->execute();
        
        $mysqli->commit();
        
        send_response(['success' => true, 'message' => 'Server deleted successfully']);
    } catch (Exception $e) {
        $mysqli->rollback();
        error_log("Error deleting server: " . $e->getMessage());
        send_response(['error' => 'Failed to delete server'], 500);
    }
}

function joinServer($user_id) {
    global $mysqli;
    
    $invite_code = sanitize_input($_POST['inviteCode'] ?? '');
    
    if (empty($invite_code)) {
        send_response(['error' => 'Invite code is required'], 400);
    }
    
    try {
        // Find valid invite
        $stmt = $mysqli->prepare("
            SELECT si.ServerID, s.Name 
            FROM ServerInvite si 
            JOIN Server s ON si.ServerID = s.ID 
            WHERE si.InviteLink = ? AND (si.ExpiresAt IS NULL OR si.ExpiresAt > NOW())
        ");
        $stmt->bind_param("s", $invite_code);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$invite = $result->fetch_assoc()) {
            send_response(['error' => 'Invalid or expired invite'], 400);
        }
        
        $server_id = $invite['ServerID'];
        
        // Check if already member
        if (is_server_member($user_id, $server_id)) {
            send_response(['error' => 'You are already a member of this server'], 400);
        }
        
        // Add user to server
        $stmt = $mysqli->prepare("
            INSERT INTO UserServerMemberships (UserID, ServerID, Role) 
            VALUES (?, ?, 'Member')
        ");
        $stmt->bind_param("ii", $user_id, $server_id);
        $stmt->execute();
        
        send_response([
            'success' => true, 
            'message' => "Successfully joined {$invite['Name']}",
            'serverId' => $server_id
        ]);
    } catch (Exception $e) {
        error_log("Error joining server: " . $e->getMessage());
        send_response(['error' => 'Failed to join server'], 500);
    }
}

function leaveServer($user_id) {
    global $mysqli;
    
    $server_id = $_POST['serverId'] ?? '';
    
    if (empty($server_id)) {
        send_response(['error' => 'Server ID is required'], 400);
    }
    
    try {
        // Check if user is member
        if (!is_server_member($user_id, $server_id)) {
            send_response(['error' => 'You are not a member of this server'], 400);
        }
        
        // Check if user is owner
        if (is_server_owner($user_id, $server_id)) {
            // Count other members
            $stmt = $mysqli->prepare("
                SELECT COUNT(*) as member_count 
                FROM UserServerMemberships 
                WHERE ServerID = ? AND UserID != ?
            ");
            $stmt->bind_param("ii", $server_id, $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $count = $result->fetch_assoc()['member_count'];
            
            if ($count > 0) {
                send_response(['error' => 'You must transfer ownership before leaving the server'], 400);
            } else {
                // Delete server if owner is last member
                $stmt = $mysqli->prepare("DELETE FROM Server WHERE ID = ?");
                $stmt->bind_param("i", $server_id);
                $stmt->execute();
                
                send_response(['success' => true, 'message' => 'Server deleted successfully']);
                return;
            }
        }
        
        // Remove user from server
        $stmt = $mysqli->prepare("
            DELETE FROM UserServerMemberships 
            WHERE UserID = ? AND ServerID = ?
        ");
        $stmt->bind_param("ii", $user_id, $server_id);
        $stmt->execute();
        
        send_response(['success' => true, 'message' => 'Successfully left the server']);
    } catch (Exception $e) {
        error_log("Error leaving server: " . $e->getMessage());
        send_response(['error' => 'Failed to leave server'], 500);
    }
}

function transferOwnership($user_id) {
    global $mysqli;
    
    $server_id = $_POST['serverId'] ?? '';
    $new_owner_id = $_POST['newOwnerId'] ?? '';
    $confirmation = sanitize_input($_POST['confirmation'] ?? '');
    
    if (empty($server_id) || empty($new_owner_id)) {
        send_response(['error' => 'Server ID and new owner ID are required'], 400);
    }
    
    if ($confirmation !== 'transfer ownership') {
        send_response(['error' => 'Confirmation text is incorrect'], 400);
    }
    
    // Check if user is owner
    if (!is_server_owner($user_id, $server_id)) {
        send_response(['error' => 'Only server owner can transfer ownership'], 403);
    }
    
    // Check if new owner is admin
    if (!is_server_admin($new_owner_id, $server_id)) {
        send_response(['error' => 'New owner must be an admin'], 400);
    }
    
    $mysqli->begin_transaction();
    
    try {
        // Update current owner to admin
        $stmt = $mysqli->prepare("
            UPDATE UserServerMemberships 
            SET Role = 'Admin' 
            WHERE UserID = ? AND ServerID = ?
        ");
        $stmt->bind_param("ii", $user_id, $server_id);
        $stmt->execute();
        
        // Update new owner
        $stmt = $mysqli->prepare("
            UPDATE UserServerMemberships 
            SET Role = 'Owner' 
            WHERE UserID = ? AND ServerID = ?
        ");
        $stmt->bind_param("ii", $new_owner_id, $server_id);
        $stmt->execute();
        
        $mysqli->commit();
        
        send_response(['success' => true, 'message' => 'Ownership transferred successfully']);
    } catch (Exception $e) {
        $mysqli->rollback();
        error_log("Error transferring ownership: " . $e->getMessage());
        send_response(['error' => 'Failed to transfer ownership'], 500);
    }
}

function getPublicServers() {
    global $mysqli;
    
    $category = $_GET['category'] ?? '';
    $search = sanitize_input($_GET['search'] ?? '');
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = 20;
    $offset = ($page - 1) * $limit;
    
    try {
        $where_conditions = ["s.IsPrivate = 0"];
        $params = [];
        $types = "";
        
        if (!empty($category) && $category !== 'all') {
            $where_conditions[] = "s.Category = ?";
            $params[] = $category;
            $types .= "s";
        }
        
        if (!empty($search)) {
            $where_conditions[] = "(s.Name LIKE ? OR s.Description LIKE ?)";
            $search_param = "%$search%";
            $params[] = $search_param;
            $params[] = $search_param;
            $types .= "ss";
        }
        
        $where_clause = implode(" AND ", $where_conditions);
        
        // Get servers with member count
        $stmt = $mysqli->prepare("
            SELECT s.*, COUNT(usm.UserID) as MemberCount
            FROM Server s 
            LEFT JOIN UserServerMemberships usm ON s.ID = usm.ServerID 
            WHERE $where_clause
            GROUP BY s.ID 
            ORDER BY MemberCount DESC, s.CreatedAt DESC 
            LIMIT ? OFFSET ?
        ");
        
        $params[] = $limit;
        $params[] = $offset;
        $types .= "ii";
        
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $servers = [];
        while ($row = $result->fetch_assoc()) {
            $servers[] = $row;
        }
        
        // Get total count for pagination
        $count_stmt = $mysqli->prepare("
            SELECT COUNT(*) as total 
            FROM Server s 
            WHERE $where_clause
        ");
        
        if (!empty($where_conditions) && count($params) > 2) {
            $count_params = array_slice($params, 0, -2); // Remove limit and offset
            $count_types = substr($types, 0, -2); // Remove ii from types
            if (!empty($count_params)) {
                $count_stmt->bind_param($count_types, ...$count_params);
            }
        }
        
        $count_stmt->execute();
        $total = $count_stmt->get_result()->fetch_assoc()['total'];
        
        send_response([
            'success' => true,
            'servers' => $servers,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    } catch (Exception $e) {
        error_log("Error getting public servers: " . $e->getMessage());
        send_response(['error' => 'Failed to load public servers'], 500);
    }
}
?>