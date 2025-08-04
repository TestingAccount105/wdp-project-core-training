<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$user_id = validate_session();

switch ($method) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'conversations':
                    get_conversations($user_id);
                    break;
                case 'messages':
                    get_messages($user_id, $_GET['room_id'] ?? 0);
                    break;
                case 'active_users':
                    get_active_users($user_id);
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
                case 'create_dm':
                    create_direct_message($user_id, $data['user_ids'], $data['group_name'] ?? null);
                    break;
                case 'send_message':
                    send_message($user_id, $data['room_id'], $data['content'], $data['reply_to'] ?? null);
                    break;
                case 'edit_message':
                    edit_message($user_id, $data['message_id'], $data['content']);
                    break;
                case 'delete_message':
                    delete_message($user_id, $data['message_id']);
                    break;
                case 'react_message':
                    react_to_message($user_id, $data['message_id'], $data['emoji']);
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

function get_conversations($user_id) {
    global $mysqli;
    
    $query = "SELECT cr.ID, cr.Type, cr.Name, cr.ImageUrl,
                     (SELECT m.Content FROM ChatRoomMessage crm 
                      INNER JOIN Message m ON crm.MessageID = m.ID 
                      WHERE crm.RoomID = cr.ID 
                      ORDER BY m.SentAt DESC LIMIT 1) as last_message,
                     (SELECT m.SentAt FROM ChatRoomMessage crm 
                      INNER JOIN Message m ON crm.MessageID = m.ID 
                      WHERE crm.RoomID = cr.ID 
                      ORDER BY m.SentAt DESC LIMIT 1) as last_message_time,
                     (SELECT COUNT(*) FROM ChatRoomMessage crm 
                      INNER JOIN Message m ON crm.MessageID = m.ID 
                      WHERE crm.RoomID = cr.ID AND m.SentAt > COALESCE(
                          (SELECT last_seen FROM UserLastSeen WHERE user_id = ? AND room_id = cr.ID), 
                          '1970-01-01'
                      )) as unread_count
              FROM ChatRoom cr
              INNER JOIN ChatParticipants cp ON cr.ID = cp.ChatRoomID
              WHERE cp.UserID = ?
              ORDER BY last_message_time DESC";
    
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("ii", $user_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $conversations = [];
    while ($row = $result->fetch_assoc()) {
        // Get participants for each conversation
        $participants_query = "SELECT u.ID, u.Username, u.ProfilePictureUrl, u.Status, u.DisplayName, u.Discriminator
                               FROM Users u
                               INNER JOIN ChatParticipants cp ON u.ID = cp.UserID
                               WHERE cp.ChatRoomID = ? AND u.ID != ?";
        $participants_stmt = $mysqli->prepare($participants_query);
        $participants_stmt->bind_param("ii", $row['ID'], $user_id);
        $participants_stmt->execute();
        $participants_result = $participants_stmt->get_result();
        
        $participants = [];
        while ($participant = $participants_result->fetch_assoc()) {
            $participants[] = [
                'id' => $participant['ID'],
                'username' => $participant['Username'],
                'discriminator' => $participant['Discriminator'],
                'display_name' => $participant['DisplayName'] ?: $participant['Username'],
                'avatar' => $participant['ProfilePictureUrl'],
                'status' => $participant['Status']
            ];
        }
        
        // Determine display name and avatar for the conversation
        $display_name = $row['Name'];
        $avatar = $row['ImageUrl'];
        
        if ($row['Type'] === 'direct' && count($participants) === 1) {
            $display_name = $participants[0]['display_name'];
            $avatar = $participants[0]['avatar'];
        }
        
        $conversations[] = [
            'id' => $row['ID'],
            'type' => $row['Type'],
            'name' => $display_name,
            'avatar' => $avatar,
            'participants' => $participants,
            'last_message' => $row['last_message'],
            'last_message_time' => $row['last_message_time'],
            'unread_count' => (int)$row['unread_count']
        ];
    }
    
    send_response(['conversations' => $conversations]);
}

function get_messages($user_id, $room_id) {
    global $mysqli;
    
    // Verify user is participant in this room
    $access_query = "SELECT 1 FROM ChatParticipants WHERE ChatRoomID = ? AND UserID = ?";
    $stmt = $mysqli->prepare($access_query);
    $stmt->bind_param("ii", $room_id, $user_id);
    $stmt->execute();
    if (!$stmt->get_result()->fetch_assoc()) {
        send_response(['error' => 'Access denied'], 403);
    }
    
    $query = "SELECT m.ID, m.UserID, m.Content, m.SentAt, m.EditedAt, m.MessageType, m.AttachmentURL, m.ReplyMessageID,
                     u.Username, u.ProfilePictureUrl, u.DisplayName, u.Discriminator,
                     rm.Content as reply_content, ru.Username as reply_username
              FROM ChatRoomMessage crm
              INNER JOIN Message m ON crm.MessageID = m.ID
              INNER JOIN Users u ON m.UserID = u.ID
              LEFT JOIN Message rm ON m.ReplyMessageID = rm.ID
              LEFT JOIN Users ru ON rm.UserID = ru.ID
              WHERE crm.RoomID = ?
              ORDER BY m.SentAt ASC
              LIMIT 100";
    
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("i", $room_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $messages = [];
    while ($row = $result->fetch_assoc()) {
        // Get reactions for this message
        $reactions_query = "SELECT Emoji, COUNT(*) as count, 
                           GROUP_CONCAT(u.Username) as users,
                           GROUP_CONCAT(mr.UserID) as user_ids
                           FROM MessageReaction mr
                           INNER JOIN Users u ON mr.UserID = u.ID
                           WHERE mr.MessageID = ?
                           GROUP BY Emoji";
        $reactions_stmt = $mysqli->prepare($reactions_query);
        $reactions_stmt->bind_param("i", $row['ID']);
        $reactions_stmt->execute();
        $reactions_result = $reactions_stmt->get_result();
        
        $reactions = [];
        while ($reaction = $reactions_result->fetch_assoc()) {
            $user_ids = explode(',', $reaction['user_ids']);
            $reactions[] = [
                'emoji' => $reaction['Emoji'],
                'count' => (int)$reaction['count'],
                'users' => explode(',', $reaction['users']),
                'user_reacted' => in_array($user_id, $user_ids)
            ];
        }
        
        $reply_data = null;
        if ($row['ReplyMessageID']) {
            $reply_data = [
                'id' => $row['ReplyMessageID'],
                'content' => $row['reply_content'],
                'username' => $row['reply_username']
            ];
        }
        
        $messages[] = [
            'id' => $row['ID'],
            'user_id' => $row['UserID'],
            'username' => $row['Username'],
            'discriminator' => $row['Discriminator'],
            'display_name' => $row['DisplayName'] ?: $row['Username'],
            'avatar' => $row['ProfilePictureUrl'],
            'content' => $row['Content'],
            'sent_at' => $row['SentAt'],
            'edited_at' => $row['EditedAt'],
            'message_type' => $row['MessageType'],
            'attachment_url' => $row['AttachmentURL'],
            'reply_to' => $reply_data,
            'reactions' => $reactions
        ];
    }
    
    // Update last seen for this user in this room
    $update_seen_query = "INSERT INTO UserLastSeen (user_id, room_id, last_seen) 
                          VALUES (?, ?, NOW()) 
                          ON DUPLICATE KEY UPDATE last_seen = NOW()";
    $stmt = $mysqli->prepare($update_seen_query);
    $stmt->bind_param("ii", $user_id, $room_id);
    $stmt->execute();
    
    send_response(['messages' => $messages]);
}

function get_active_users($user_id) {
    global $mysqli;
    
    $query = "SELECT u.ID, u.Username, u.ProfilePictureUrl, u.Status, u.DisplayName, u.Discriminator
              FROM Users u
              INNER JOIN FriendsList f ON (f.UserID1 = ? AND f.UserID2 = u.ID) OR (f.UserID2 = ? AND f.UserID1 = u.ID)
              WHERE f.Status = 'accepted' AND u.Status IN ('online', 'away') AND u.ID != ?
              ORDER BY u.Status ASC, u.DisplayName ASC
              LIMIT 20";
    
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("iii", $user_id, $user_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $active_users = [];
    while ($row = $result->fetch_assoc()) {
        $active_users[] = [
            'id' => $row['ID'],
            'username' => $row['Username'],
            'discriminator' => $row['Discriminator'],
            'display_name' => $row['DisplayName'] ?: $row['Username'],
            'avatar' => $row['ProfilePictureUrl'],
            'status' => $row['Status']
        ];
    }
    
    send_response(['active_users' => $active_users]);
}

function create_direct_message($user_id, $user_ids, $group_name = null) {
    global $mysqli;
    
    if (!is_array($user_ids) || empty($user_ids)) {
        send_response(['error' => 'User IDs required'], 400);
    }
    
    // Add the current user to the list
    $all_user_ids = array_unique(array_merge([$user_id], $user_ids));
    
    // Determine chat type
    $chat_type = count($all_user_ids) > 2 ? 'group' : 'direct';
    
    // For direct messages, check if conversation already exists
    if ($chat_type === 'direct') {
        $other_user_id = $user_ids[0];
        $existing_query = "SELECT cr.ID FROM ChatRoom cr
                           INNER JOIN ChatParticipants cp1 ON cr.ID = cp1.ChatRoomID
                           INNER JOIN ChatParticipants cp2 ON cr.ID = cp2.ChatRoomID
                           WHERE cr.Type = 'direct' 
                           AND cp1.UserID = ? AND cp2.UserID = ?
                           AND (SELECT COUNT(*) FROM ChatParticipants WHERE ChatRoomID = cr.ID) = 2";
        $stmt = $mysqli->prepare($existing_query);
        $stmt->bind_param("ii", $user_id, $other_user_id);
        $stmt->execute();
        $existing = $stmt->get_result()->fetch_assoc();
        
        if ($existing) {
            send_response(['room_id' => $existing['ID'], 'existing' => true]);
        }
    }
    
    // Verify all users are friends with the current user
    foreach ($user_ids as $target_user_id) {
        $friend_query = "SELECT 1 FROM FriendsList WHERE 
                         ((UserID1 = ? AND UserID2 = ?) OR (UserID1 = ? AND UserID2 = ?)) 
                         AND Status = 'accepted'";
        $stmt = $mysqli->prepare($friend_query);
        $stmt->bind_param("iiii", $user_id, $target_user_id, $target_user_id, $user_id);
        $stmt->execute();
        if (!$stmt->get_result()->fetch_assoc()) {
            send_response(['error' => 'Can only create DM with friends'], 400);
        }
    }
    
    $mysqli->begin_transaction();
    
    try {
        // Create chat room
        $insert_room_query = "INSERT INTO ChatRoom (Type, Name, ImageUrl) VALUES (?, ?, NULL)";
        $stmt = $mysqli->prepare($insert_room_query);
        $stmt->bind_param("ss", $chat_type, $group_name);
        $stmt->execute();
        $room_id = $mysqli->insert_id;
        
        // Add participants
        $insert_participant_query = "INSERT INTO ChatParticipants (ChatRoomID, UserID) VALUES (?, ?)";
        $stmt = $mysqli->prepare($insert_participant_query);
        
        foreach ($all_user_ids as $participant_id) {
            $stmt->bind_param("ii", $room_id, $participant_id);
            $stmt->execute();
        }
        
        $mysqli->commit();
        send_response(['room_id' => $room_id, 'existing' => false]);
        
    } catch (Exception $e) {
        $mysqli->rollback();
        send_response(['error' => 'Failed to create chat'], 500);
    }
}

function send_message($user_id, $room_id, $content, $reply_to = null) {
    global $mysqli;
    
    // Verify user is participant in this room
    $access_query = "SELECT 1 FROM ChatParticipants WHERE ChatRoomID = ? AND UserID = ?";
    $stmt = $mysqli->prepare($access_query);
    $stmt->bind_param("ii", $room_id, $user_id);
    $stmt->execute();
    if (!$stmt->get_result()->fetch_assoc()) {
        send_response(['error' => 'Access denied'], 403);
    }
    
    if (empty(trim($content))) {
        send_response(['error' => 'Message content required'], 400);
    }
    
    $mysqli->begin_transaction();
    
    try {
        // Create message
        $insert_message_query = "INSERT INTO Message (UserID, Content, SentAt, MessageType, ReplyMessageID) 
                                VALUES (?, ?, NOW(), 'text', ?)";
        $stmt = $mysqli->prepare($insert_message_query);
        $stmt->bind_param("isi", $user_id, $content, $reply_to);
        $stmt->execute();
        $message_id = $mysqli->insert_id;
        
        // Link message to chat room
        $insert_room_message_query = "INSERT INTO ChatRoomMessage (RoomID, MessageID) VALUES (?, ?)";
        $stmt = $mysqli->prepare($insert_room_message_query);
        $stmt->bind_param("ii", $room_id, $message_id);
        $stmt->execute();
        
        $mysqli->commit();
        
        // Get the complete message data to return
        $message_query = "SELECT m.ID, m.UserID, m.Content, m.SentAt, m.EditedAt, m.MessageType, m.AttachmentURL, m.ReplyMessageID,
                                 u.Username, u.ProfilePictureUrl, u.DisplayName, u.Discriminator
                          FROM Message m
                          INNER JOIN Users u ON m.UserID = u.ID
                          WHERE m.ID = ?";
        $stmt = $mysqli->prepare($message_query);
        $stmt->bind_param("i", $message_id);
        $stmt->execute();
        $message_data = $stmt->get_result()->fetch_assoc();
        
        send_response([
            'success' => true,
            'message' => [
                'id' => $message_data['ID'],
                'user_id' => $message_data['UserID'],
                'username' => $message_data['Username'],
                'discriminator' => $message_data['Discriminator'],
                'display_name' => $message_data['DisplayName'] ?: $message_data['Username'],
                'avatar' => $message_data['ProfilePictureUrl'],
                'content' => $message_data['Content'],
                'sent_at' => $message_data['SentAt'],
                'edited_at' => $message_data['EditedAt'],
                'message_type' => $message_data['MessageType'],
                'reply_to' => $reply_to,
                'reactions' => []
            ]
        ]);
        
    } catch (Exception $e) {
        $mysqli->rollback();
        send_response(['error' => 'Failed to send message'], 500);
    }
}

function edit_message($user_id, $message_id, $content) {
    global $mysqli;
    
    if (empty(trim($content))) {
        send_response(['error' => 'Message content required'], 400);
    }
    
    // Verify user owns this message
    $verify_query = "SELECT UserID FROM Message WHERE ID = ?";
    $stmt = $mysqli->prepare($verify_query);
    $stmt->bind_param("i", $message_id);
    $stmt->execute();
    $message = $stmt->get_result()->fetch_assoc();
    
    if (!$message || $message['UserID'] != $user_id) {
        send_response(['error' => 'Message not found or access denied'], 403);
    }
    
    // Update message
    $update_query = "UPDATE Message SET Content = ?, EditedAt = NOW() WHERE ID = ?";
    $stmt = $mysqli->prepare($update_query);
    $stmt->bind_param("si", $content, $message_id);
    
    if ($stmt->execute()) {
        send_response(['success' => 'Message updated']);
    } else {
        send_response(['error' => 'Failed to update message'], 500);
    }
}

function delete_message($user_id, $message_id) {
    global $mysqli;
    
    // Verify user owns this message
    $verify_query = "SELECT UserID FROM Message WHERE ID = ?";
    $stmt = $mysqli->prepare($verify_query);
    $stmt->bind_param("i", $message_id);
    $stmt->execute();
    $message = $stmt->get_result()->fetch_assoc();
    
    if (!$message || $message['UserID'] != $user_id) {
        send_response(['error' => 'Message not found or access denied'], 403);
    }
    
    $mysqli->begin_transaction();
    
    try {
        // Delete reactions first
        $delete_reactions_query = "DELETE FROM MessageReaction WHERE MessageID = ?";
        $stmt = $mysqli->prepare($delete_reactions_query);
        $stmt->bind_param("i", $message_id);
        $stmt->execute();
        
        // Delete chat room message links
        $delete_room_message_query = "DELETE FROM ChatRoomMessage WHERE MessageID = ?";
        $stmt = $mysqli->prepare($delete_room_message_query);
        $stmt->bind_param("i", $message_id);
        $stmt->execute();
        
        // Delete the message
        $delete_message_query = "DELETE FROM Message WHERE ID = ?";
        $stmt = $mysqli->prepare($delete_message_query);
        $stmt->bind_param("i", $message_id);
        $stmt->execute();
        
        $mysqli->commit();
        send_response(['success' => 'Message deleted']);
        
    } catch (Exception $e) {
        $mysqli->rollback();
        send_response(['error' => 'Failed to delete message'], 500);
    }
}

function react_to_message($user_id, $message_id, $emoji) {
    global $mysqli;
    
    if (empty($emoji)) {
        send_response(['error' => 'Emoji required'], 400);
    }
    
    // Check if user already reacted with this emoji
    $existing_query = "SELECT ID FROM MessageReaction WHERE MessageID = ? AND UserID = ? AND Emoji = ?";
    $stmt = $mysqli->prepare($existing_query);
    $stmt->bind_param("iis", $message_id, $user_id, $emoji);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    
    if ($existing) {
        // Remove reaction
        $delete_query = "DELETE FROM MessageReaction WHERE ID = ?";
        $stmt = $mysqli->prepare($delete_query);
        $stmt->bind_param("i", $existing['ID']);
        $stmt->execute();
        send_response(['success' => 'Reaction removed', 'action' => 'removed']);
    } else {
        // Add reaction
        $insert_query = "INSERT INTO MessageReaction (MessageID, UserID, Emoji) VALUES (?, ?, ?)";
        $stmt = $mysqli->prepare($insert_query);
        $stmt->bind_param("iis", $message_id, $user_id, $emoji);
        $stmt->execute();
        send_response(['success' => 'Reaction added', 'action' => 'added']);
    }
}

// Create UserLastSeen table if it doesn't exist
$create_table_query = "CREATE TABLE IF NOT EXISTS UserLastSeen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    last_seen DATETIME NOT NULL,
    UNIQUE KEY unique_user_room (user_id, room_id),
    FOREIGN KEY (user_id) REFERENCES Users(ID) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES ChatRoom(ID) ON DELETE CASCADE
)";
$mysqli->query($create_table_query);
?>