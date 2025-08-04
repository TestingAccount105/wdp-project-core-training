<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$user_id = validate_session();

switch ($method) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'online':
                    get_online_friends($user_id);
                    break;
                case 'all':
                    get_all_friends($user_id);
                    break;
                case 'pending':
                    get_pending_requests($user_id);
                    break;
                case 'search':
                    search_friends($user_id, $_GET['query'] ?? '');
                    break;
                default:
                    send_response(['error' => 'Invalid action'], 400);
            }
        } else {
            send_response(['error' => 'Action required'], 400);
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['action'])) {
            switch ($data['action']) {
                case 'send_request':
                    send_friend_request($user_id, $data['username']);
                    break;
                case 'accept_request':
                    accept_friend_request($user_id, $data['request_id']);
                    break;
                case 'decline_request':
                    decline_friend_request($user_id, $data['request_id']);
                    break;
                case 'cancel_request':
                    cancel_friend_request($user_id, $data['request_id']);
                    break;
                default:
                    send_response(['error' => 'Invalid action'], 400);
            }
        } else {
            send_response(['error' => 'Action required'], 400);
        }
        break;
        
    default:
        send_response(['error' => 'Method not allowed'], 405);
}

function get_online_friends($user_id) {
    global $mysqli;
    
    $query = "SELECT u.ID, u.Username, u.ProfilePictureUrl, u.Status, u.DisplayName, u.Discriminator 
              FROM Users u 
              INNER JOIN FriendsList f ON (f.UserID1 = ? AND f.UserID2 = u.ID) OR (f.UserID2 = ? AND f.UserID1 = u.ID) 
              WHERE f.Status = 'accepted' AND u.Status IN ('online', 'away') AND u.ID != ?
              ORDER BY u.Status ASC, u.DisplayName ASC";
    
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("iii", $user_id, $user_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $friends = [];
    while ($row = $result->fetch_assoc()) {
        $friends[] = [
            'id' => $row['ID'],
            'username' => $row['Username'],
            'discriminator' => $row['Discriminator'],
            'display_name' => $row['DisplayName'] ?: $row['Username'],
            'avatar' => $row['ProfilePictureUrl'],
            'status' => $row['Status']
        ];
    }
    
    send_response(['friends' => $friends]);
}

function get_all_friends($user_id) {
    global $mysqli;
    
    $query = "SELECT u.ID, u.Username, u.ProfilePictureUrl, u.Status, u.DisplayName, u.Discriminator 
              FROM Users u 
              INNER JOIN FriendsList f ON (f.UserID1 = ? AND f.UserID2 = u.ID) OR (f.UserID2 = ? AND f.UserID1 = u.ID) 
              WHERE f.Status = 'accepted' AND u.ID != ?
              ORDER BY u.Status ASC, u.DisplayName ASC";
    
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("iii", $user_id, $user_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $friends = [];
    while ($row = $result->fetch_assoc()) {
        $friends[] = [
            'id' => $row['ID'],
            'username' => $row['Username'],
            'discriminator' => $row['Discriminator'],
            'display_name' => $row['DisplayName'] ?: $row['Username'],
            'avatar' => $row['ProfilePictureUrl'],
            'status' => $row['Status']
        ];
    }
    
    send_response(['friends' => $friends]);
}

function get_pending_requests($user_id) {
    global $mysqli;
    
    // Get incoming requests
    $incoming_query = "SELECT f.ID as request_id, u.ID, u.Username, u.ProfilePictureUrl, u.Status, u.DisplayName, u.Discriminator 
                       FROM FriendsList f 
                       INNER JOIN Users u ON f.UserID1 = u.ID 
                       WHERE f.UserID2 = ? AND f.Status = 'pending'
                       ORDER BY u.DisplayName ASC";
    
    $stmt = $mysqli->prepare($incoming_query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $incoming_result = $stmt->get_result();
    
    $incoming_requests = [];
    while ($row = $incoming_result->fetch_assoc()) {
        $incoming_requests[] = [
            'request_id' => $row['request_id'],
            'id' => $row['ID'],
            'username' => $row['Username'],
            'discriminator' => $row['Discriminator'],
            'display_name' => $row['DisplayName'] ?: $row['Username'],
            'avatar' => $row['ProfilePictureUrl'],
            'status' => $row['Status']
        ];
    }
    
    // Get outgoing requests
    $outgoing_query = "SELECT f.ID as request_id, u.ID, u.Username, u.ProfilePictureUrl, u.Status, u.DisplayName, u.Discriminator 
                       FROM FriendsList f 
                       INNER JOIN Users u ON f.UserID2 = u.ID 
                       WHERE f.UserID1 = ? AND f.Status = 'pending'
                       ORDER BY u.DisplayName ASC";
    
    $stmt = $mysqli->prepare($outgoing_query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $outgoing_result = $stmt->get_result();
    
    $outgoing_requests = [];
    while ($row = $outgoing_result->fetch_assoc()) {
        $outgoing_requests[] = [
            'request_id' => $row['request_id'],
            'id' => $row['ID'],
            'username' => $row['Username'],
            'discriminator' => $row['Discriminator'],
            'display_name' => $row['DisplayName'] ?: $row['Username'],
            'avatar' => $row['ProfilePictureUrl'],
            'status' => $row['Status']
        ];
    }
    
    send_response([
        'incoming' => $incoming_requests,
        'outgoing' => $outgoing_requests
    ]);
}

function search_friends($user_id, $query) {
    global $mysqli;
    
    $search_term = '%' . $query . '%';
    
    $search_query = "SELECT u.ID, u.Username, u.ProfilePictureUrl, u.Status, u.DisplayName, u.Discriminator 
                     FROM Users u 
                     INNER JOIN FriendsList f ON (f.UserID1 = ? AND f.UserID2 = u.ID) OR (f.UserID2 = ? AND f.UserID1 = u.ID) 
                     WHERE f.Status = 'accepted' AND u.ID != ? AND (
                         u.Username LIKE ? OR 
                         u.DisplayName LIKE ? OR 
                         CONCAT(u.Username, '#', u.Discriminator) LIKE ?
                     )
                     ORDER BY u.DisplayName ASC";
    
    $stmt = $mysqli->prepare($search_query);
    $stmt->bind_param("iiisss", $user_id, $user_id, $user_id, $search_term, $search_term, $search_term);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $friends = [];
    while ($row = $result->fetch_assoc()) {
        $friends[] = [
            'id' => $row['ID'],
            'username' => $row['Username'],
            'discriminator' => $row['Discriminator'],
            'display_name' => $row['DisplayName'] ?: $row['Username'],
            'avatar' => $row['ProfilePictureUrl'],
            'status' => $row['Status']
        ];
    }
    
    send_response(['friends' => $friends]);
}

function send_friend_request($user_id, $username) {
    global $mysqli;
    
    // Parse username and discriminator
    if (strpos($username, '#') !== false) {
        list($username_part, $discriminator) = explode('#', $username, 2);
    } else {
        $username_part = $username;
        $discriminator = null;
    }
    
    // Find target user
    if ($discriminator) {
        $query = "SELECT ID FROM Users WHERE Username = ? AND Discriminator = ?";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("ss", $username_part, $discriminator);
    } else {
        $query = "SELECT ID FROM Users WHERE Username = ?";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("s", $username_part);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $target_user = $result->fetch_assoc();
    
    if (!$target_user) {
        send_response(['error' => 'User not found'], 404);
    }
    
    $target_user_id = $target_user['ID'];
    
    if ($target_user_id == $user_id) {
        send_response(['error' => 'Cannot send friend request to yourself'], 400);
    }
    
    // Check if friendship already exists
    $check_query = "SELECT * FROM FriendsList WHERE 
                    (UserID1 = ? AND UserID2 = ?) OR (UserID1 = ? AND UserID2 = ?)";
    $stmt = $mysqli->prepare($check_query);
    $stmt->bind_param("iiii", $user_id, $target_user_id, $target_user_id, $user_id);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    
    if ($existing) {
        if ($existing['Status'] == 'accepted') {
            send_response(['error' => 'Already friends'], 400);
        } else {
            send_response(['error' => 'Friend request already exists'], 400);
        }
    }
    
    // Create friend request
    $insert_query = "INSERT INTO FriendsList (UserID1, UserID2, Status) VALUES (?, ?, 'pending')";
    $stmt = $mysqli->prepare($insert_query);
    $stmt->bind_param("ii", $user_id, $target_user_id);
    
    if ($stmt->execute()) {
        send_response(['success' => 'Friend request sent']);
    } else {
        send_response(['error' => 'Failed to send friend request'], 500);
    }
}

function accept_friend_request($user_id, $request_id) {
    global $mysqli;
    
    // Verify the request exists and is for this user
    $query = "SELECT * FROM FriendsList WHERE ID = ? AND UserID2 = ? AND Status = 'pending'";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("ii", $request_id, $user_id);
    $stmt->execute();
    $request = $stmt->get_result()->fetch_assoc();
    
    if (!$request) {
        send_response(['error' => 'Friend request not found'], 404);
    }
    
    // Update request status
    $update_query = "UPDATE FriendsList SET Status = 'accepted' WHERE ID = ?";
    $stmt = $mysqli->prepare($update_query);
    $stmt->bind_param("i", $request_id);
    
    if ($stmt->execute()) {
        send_response(['success' => 'Friend request accepted']);
    } else {
        send_response(['error' => 'Failed to accept friend request'], 500);
    }
}

function decline_friend_request($user_id, $request_id) {
    global $mysqli;
    
    // Verify the request exists and is for this user
    $query = "SELECT * FROM FriendsList WHERE ID = ? AND UserID2 = ? AND Status = 'pending'";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("ii", $request_id, $user_id);
    $stmt->execute();
    $request = $stmt->get_result()->fetch_assoc();
    
    if (!$request) {
        send_response(['error' => 'Friend request not found'], 404);
    }
    
    // Delete the request
    $delete_query = "DELETE FROM FriendsList WHERE ID = ?";
    $stmt = $mysqli->prepare($delete_query);
    $stmt->bind_param("i", $request_id);
    
    if ($stmt->execute()) {
        send_response(['success' => 'Friend request declined']);
    } else {
        send_response(['error' => 'Failed to decline friend request'], 500);
    }
}

function cancel_friend_request($user_id, $request_id) {
    global $mysqli;
    
    // Verify the request exists and is from this user
    $query = "SELECT * FROM FriendsList WHERE ID = ? AND UserID1 = ? AND Status = 'pending'";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("ii", $request_id, $user_id);
    $stmt->execute();
    $request = $stmt->get_result()->fetch_assoc();
    
    if (!$request) {
        send_response(['error' => 'Friend request not found'], 404);
    }
    
    // Delete the request
    $delete_query = "DELETE FROM FriendsList WHERE ID = ?";
    $stmt = $mysqli->prepare($delete_query);
    $stmt->bind_param("i", $request_id);
    
    if ($stmt->execute()) {
        send_response(['success' => 'Friend request cancelled']);
    } else {
        send_response(['error' => 'Failed to cancel friend request'], 500);
    }
}
?>