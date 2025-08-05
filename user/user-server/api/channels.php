<?php
require_once 'config.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$user_id = validate_session();

switch ($action) {
    case 'getChannels':
        getChannels($user_id);
        break;
    case 'getChannel':
        getChannel($user_id);
        break;
    case 'createChannel':
        createChannel($user_id);
        break;
    case 'updateChannel':
        updateChannel($user_id);
        break;
    case 'deleteChannel':
        deleteChannel($user_id);
        break;
    case 'getMessages':
        getMessages($user_id);
        break;
    case 'sendMessage':
        sendMessage($user_id);
        break;
    case 'editMessage':
        editMessage($user_id);
        break;
    case 'deleteMessage':
        deleteMessage($user_id);
        break;
    case 'addReaction':
        addReaction($user_id);
        break;
    case 'removeReaction':
        removeReaction($user_id);
        break;
    default:
        send_response(['error' => 'Invalid action'], 400);
}

function getChannels($user_id) {
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
            SELECT * FROM Channel 
            WHERE ServerID = ? 
            ORDER BY Type ASC, Name ASC
        ");
        $stmt->bind_param("i", $server_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $channels = [];
        while ($row = $result->fetch_assoc()) {
            $channels[] = $row;
        }
        
        send_response(['success' => true, 'channels' => $channels]);
    } catch (Exception $e) {
        error_log("Error getting channels: " . $e->getMessage());
        send_response(['error' => 'Failed to load channels'], 500);
    }
}

function getChannel($user_id) {
    global $mysqli;
    
    $channel_id = $_GET['id'] ?? '';
    if (empty($channel_id)) {
        send_response(['error' => 'Channel ID is required'], 400);
    }
    
    try {
        $stmt = $mysqli->prepare("
            SELECT c.*, s.ID as ServerID 
            FROM Channel c 
            JOIN Server s ON c.ServerID = s.ID 
            WHERE c.ID = ?
        ");
        $stmt->bind_param("i", $channel_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($channel = $result->fetch_assoc()) {
            // Check if user is member of server
            if (!is_server_member($user_id, $channel['ServerID'])) {
                send_response(['error' => 'Access denied'], 403);
            }
            
            send_response(['success' => true, 'channel' => $channel]);
        } else {
            send_response(['error' => 'Channel not found'], 404);
        }
    } catch (Exception $e) {
        error_log("Error getting channel: " . $e->getMessage());
        send_response(['error' => 'Failed to load channel'], 500);
    }
}

function createChannel($user_id) {
    global $mysqli;
    
    $server_id = $_POST['serverId'] ?? '';
    $name = sanitize_input($_POST['name'] ?? '');
    $type = sanitize_input($_POST['type'] ?? 'Text');
    
    if (empty($server_id) || empty($name)) {
        send_response(['error' => 'Server ID and channel name are required'], 400);
    }
    
    // Check if user is admin or owner
    if (!is_server_admin($user_id, $server_id)) {
        send_response(['error' => 'Access denied'], 403);
    }
    
    // Validate channel type
    if (!in_array($type, ['Text', 'Voice'])) {
        send_response(['error' => 'Invalid channel type'], 400);
    }
    
    // Clean channel name (replace spaces with hyphens, lowercase)
    $name = strtolower(str_replace(' ', '-', $name));
    $name = preg_replace('/[^a-z0-9\-_]/', '', $name);
    
    if (empty($name)) {
        send_response(['error' => 'Invalid channel name'], 400);
    }
    
    try {
        // Check if channel name already exists in server
        $stmt = $mysqli->prepare("
            SELECT ID FROM Channel 
            WHERE ServerID = ? AND Name = ?
        ");
        $stmt->bind_param("is", $server_id, $name);
        $stmt->execute();
        
        if ($stmt->get_result()->num_rows > 0) {
            send_response(['error' => 'Channel name already exists'], 400);
        }
        
        // Create channel
        $stmt = $mysqli->prepare("
            INSERT INTO Channel (ServerID, Name, Type) 
            VALUES (?, ?, ?)
        ");
        $stmt->bind_param("iss", $server_id, $name, $type);
        $stmt->execute();
        
        $channel_id = $mysqli->insert_id;
        
        send_response([
            'success' => true, 
            'message' => 'Channel created successfully',
            'channelId' => $channel_id
        ]);
    } catch (Exception $e) {
        error_log("Error creating channel: " . $e->getMessage());
        send_response(['error' => 'Failed to create channel'], 500);
    }
}

function updateChannel($user_id) {
    global $mysqli;
    
    $channel_id = $_POST['channelId'] ?? '';
    $name = sanitize_input($_POST['name'] ?? '');
    
    if (empty($channel_id) || empty($name)) {
        send_response(['error' => 'Channel ID and name are required'], 400);
    }
    
    try {
        // Get channel and server info
        $stmt = $mysqli->prepare("
            SELECT c.*, s.ID as ServerID 
            FROM Channel c 
            JOIN Server s ON c.ServerID = s.ID 
            WHERE c.ID = ?
        ");
        $stmt->bind_param("i", $channel_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$channel = $result->fetch_assoc()) {
            send_response(['error' => 'Channel not found'], 404);
        }
        
        // Check if user is admin or owner
        if (!is_server_admin($user_id, $channel['ServerID'])) {
            send_response(['error' => 'Access denied'], 403);
        }
        
        // Clean channel name
        $name = strtolower(str_replace(' ', '-', $name));
        $name = preg_replace('/[^a-z0-9\-_]/', '', $name);
        
        if (empty($name)) {
            send_response(['error' => 'Invalid channel name'], 400);
        }
        
        // Check if new name already exists (excluding current channel)
        $stmt = $mysqli->prepare("
            SELECT ID FROM Channel 
            WHERE ServerID = ? AND Name = ? AND ID != ?
        ");
        $stmt->bind_param("isi", $channel['ServerID'], $name, $channel_id);
        $stmt->execute();
        
        if ($stmt->get_result()->num_rows > 0) {
            send_response(['error' => 'Channel name already exists'], 400);
        }
        
        // Update channel
        $stmt = $mysqli->prepare("UPDATE Channel SET Name = ? WHERE ID = ?");
        $stmt->bind_param("si", $name, $channel_id);
        $stmt->execute();
        
        send_response(['success' => true, 'message' => 'Channel updated successfully']);
    } catch (Exception $e) {
        error_log("Error updating channel: " . $e->getMessage());
        send_response(['error' => 'Failed to update channel'], 500);
    }
}

function deleteChannel($user_id) {
    global $mysqli;
    
    $channel_id = $_POST['channelId'] ?? '';
    
    if (empty($channel_id)) {
        send_response(['error' => 'Channel ID is required'], 400);
    }
    
    try {
        // Get channel and server info
        $stmt = $mysqli->prepare("
            SELECT c.*, s.ID as ServerID 
            FROM Channel c 
            JOIN Server s ON c.ServerID = s.ID 
            WHERE c.ID = ?
        ");
        $stmt->bind_param("i", $channel_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$channel = $result->fetch_assoc()) {
            send_response(['error' => 'Channel not found'], 404);
        }
        
        // Check if user is admin or owner
        if (!is_server_admin($user_id, $channel['ServerID'])) {
            send_response(['error' => 'Access denied'], 403);
        }
        
        // Prevent deletion of 'general' channel
        if (strtolower($channel['Name']) === 'general') {
            send_response(['error' => 'Cannot delete the general channel'], 400);
        }
        
        // Delete channel (cascading deletes will handle messages)
        $stmt = $mysqli->prepare("DELETE FROM Channel WHERE ID = ?");
        $stmt->bind_param("i", $channel_id);
        $stmt->execute();
        
        send_response(['success' => true, 'message' => 'Channel deleted successfully']);
    } catch (Exception $e) {
        error_log("Error deleting channel: " . $e->getMessage());
        send_response(['error' => 'Failed to delete channel'], 500);
    }
}

function getMessages($user_id) {
    global $mysqli;
    
    $channel_id = $_GET['channelId'] ?? '';
    $limit = min(50, max(1, intval($_GET['limit'] ?? 50)));
    $before = $_GET['before'] ?? null;
    
    if (empty($channel_id)) {
        send_response(['error' => 'Channel ID is required'], 400);
    }
    
    try {
        // Get channel and verify access
        $stmt = $mysqli->prepare("
            SELECT c.*, s.ID as ServerID 
            FROM Channel c 
            JOIN Server s ON c.ServerID = s.ID 
            WHERE c.ID = ?
        ");
        $stmt->bind_param("i", $channel_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$channel = $result->fetch_assoc()) {
            send_response(['error' => 'Channel not found'], 404);
        }
        
        if (!is_server_member($user_id, $channel['ServerID'])) {
            send_response(['error' => 'Access denied'], 403);
        }
        
        // Build query conditions
        $where_condition = "cm.ChannelID = ?";
        $params = [$channel_id];
        $types = "i";
        
        if ($before) {
            $where_condition .= " AND m.SentAt < ?";
            $params[] = $before;
            $types .= "s";
        }
        
        // Get messages with user info
        $stmt = $mysqli->prepare("
            SELECT m.*, u.Username, u.DisplayName, u.ProfilePictureUrl, u.Discriminator,
                   rm.Content as ReplyContent, ru.Username as ReplyUsername
            FROM ChannelMessage cm
            JOIN Message m ON cm.MessageID = m.ID
            JOIN Users u ON m.UserID = u.ID
            LEFT JOIN Message rm ON m.ReplyMessageID = rm.ID
            LEFT JOIN Users ru ON rm.UserID = ru.ID
            WHERE $where_condition
            ORDER BY m.SentAt DESC
            LIMIT ?
        ");
        
        $params[] = $limit;
        $types .= "i";
        
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $messages = [];
        while ($row = $result->fetch_assoc()) {
            // Get reactions for this message
            $reactions_stmt = $mysqli->prepare("
                SELECT mr.Emoji, COUNT(*) as count, 
                       GROUP_CONCAT(u.Username) as users
                FROM MessageReaction mr
                JOIN Users u ON mr.UserID = u.ID
                WHERE mr.MessageID = ?
                GROUP BY mr.Emoji
            ");
            $reactions_stmt->bind_param("i", $row['ID']);
            $reactions_stmt->execute();
            $reactions_result = $reactions_stmt->get_result();
            
            $reactions = [];
            while ($reaction = $reactions_result->fetch_assoc()) {
                $reactions[] = [
                    'emoji' => $reaction['Emoji'],
                    'count' => $reaction['count'],
                    'users' => explode(',', $reaction['users'])
                ];
            }
            
            $row['reactions'] = $reactions;
            $messages[] = $row;
        }
        
        // Reverse to get chronological order
        $messages = array_reverse($messages);
        
        send_response(['success' => true, 'messages' => $messages]);
    } catch (Exception $e) {
        error_log("Error getting messages: " . $e->getMessage());
        send_response(['error' => 'Failed to load messages'], 500);
    }
}

function sendMessage($user_id) {
    global $mysqli;
    
    $channel_id = $_POST['channelId'] ?? '';
    $content = trim($_POST['content'] ?? '');
    $reply_to = $_POST['replyTo'] ?? null;
    $message_type = sanitize_input($_POST['messageType'] ?? 'text');
    $attachment_url = $_POST['attachmentUrl'] ?? null;
    
    if (empty($channel_id)) {
        send_response(['error' => 'Channel ID is required'], 400);
    }
    
    if (empty($content) && empty($attachment_url)) {
        send_response(['error' => 'Message content or attachment is required'], 400);
    }
    
    try {
        // Get channel and verify access
        $stmt = $mysqli->prepare("
            SELECT c.*, s.ID as ServerID 
            FROM Channel c 
            JOIN Server s ON c.ServerID = s.ID 
            WHERE c.ID = ?
        ");
        $stmt->bind_param("i", $channel_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$channel = $result->fetch_assoc()) {
            send_response(['error' => 'Channel not found'], 404);
        }
        
        if (!is_server_member($user_id, $channel['ServerID'])) {
            send_response(['error' => 'Access denied'], 403);
        }
        
        // Only allow text messages in text channels
        if ($channel['Type'] !== 'Text') {
            send_response(['error' => 'Cannot send messages in voice channels'], 400);
        }
        
        $mysqli->begin_transaction();
        
        // Create message
        $stmt = $mysqli->prepare("
            INSERT INTO Message (UserID, ReplyMessageID, Content, MessageType, AttachmentURL) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("iisss", $user_id, $reply_to, $content, $message_type, $attachment_url);
        $stmt->execute();
        
        $message_id = $mysqli->insert_id;
        
        // Link message to channel
        $stmt = $mysqli->prepare("
            INSERT INTO ChannelMessage (ChannelID, MessageID) 
            VALUES (?, ?)
        ");
        $stmt->bind_param("ii", $channel_id, $message_id);
        $stmt->execute();
        
        $mysqli->commit();
        
        // Get the complete message data to return
        $stmt = $mysqli->prepare("
            SELECT m.*, u.Username, u.DisplayName, u.ProfilePictureUrl, u.Discriminator
            FROM Message m
            JOIN Users u ON m.UserID = u.ID
            WHERE m.ID = ?
        ");
        $stmt->bind_param("i", $message_id);
        $stmt->execute();
        $message_data = $stmt->get_result()->fetch_assoc();
        
        send_response([
            'success' => true, 
            'message' => 'Message sent successfully',
            'messageData' => $message_data
        ]);
    } catch (Exception $e) {
        $mysqli->rollback();
        error_log("Error sending message: " . $e->getMessage());
        send_response(['error' => 'Failed to send message'], 500);
    }
}

function editMessage($user_id) {
    global $mysqli;
    
    $message_id = $_POST['messageId'] ?? '';
    $content = trim($_POST['content'] ?? '');
    
    if (empty($message_id) || empty($content)) {
        send_response(['error' => 'Message ID and content are required'], 400);
    }
    
    try {
        // Get message and verify ownership
        $stmt = $mysqli->prepare("SELECT * FROM Message WHERE ID = ? AND UserID = ?");
        $stmt->bind_param("ii", $message_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$message = $result->fetch_assoc()) {
            send_response(['error' => 'Message not found or access denied'], 404);
        }
        
        // Store old content for history
        $stmt = $mysqli->prepare("
            INSERT INTO ChangeMessage (ChannelID, MessageID, OldContent, NewContent) 
            SELECT cm.ChannelID, ?, ?, ?
            FROM ChannelMessage cm 
            WHERE cm.MessageID = ?
        ");
        $stmt->bind_param("issi", $message_id, $message['Content'], $content, $message_id);
        $stmt->execute();
        
        // Update message
        $stmt = $mysqli->prepare("
            UPDATE Message 
            SET Content = ?, EditedAt = CURRENT_TIMESTAMP 
            WHERE ID = ?
        ");
        $stmt->bind_param("si", $content, $message_id);
        $stmt->execute();
        
        send_response(['success' => true, 'message' => 'Message updated successfully']);
    } catch (Exception $e) {
        error_log("Error editing message: " . $e->getMessage());
        send_response(['error' => 'Failed to edit message'], 500);
    }
}

function deleteMessage($user_id) {
    global $mysqli;
    
    $message_id = $_POST['messageId'] ?? '';
    
    if (empty($message_id)) {
        send_response(['error' => 'Message ID is required'], 400);
    }
    
    try {
        // Get message and channel info
        $stmt = $mysqli->prepare("
            SELECT m.*, cm.ChannelID, c.ServerID
            FROM Message m
            JOIN ChannelMessage cm ON m.ID = cm.MessageID
            JOIN Channel c ON cm.ChannelID = c.ID
            WHERE m.ID = ?
        ");
        $stmt->bind_param("i", $message_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$message = $result->fetch_assoc()) {
            send_response(['error' => 'Message not found'], 404);
        }
        
        // Check if user can delete (owner of message or server admin)
        $can_delete = ($message['UserID'] == $user_id) || is_server_admin($user_id, $message['ServerID']);
        
        if (!$can_delete) {
            send_response(['error' => 'Access denied'], 403);
        }
        
        // Delete message
        $stmt = $mysqli->prepare("DELETE FROM Message WHERE ID = ?");
        $stmt->bind_param("i", $message_id);
        $stmt->execute();
        
        send_response(['success' => true, 'message' => 'Message deleted successfully']);
    } catch (Exception $e) {
        error_log("Error deleting message: " . $e->getMessage());
        send_response(['error' => 'Failed to delete message'], 500);
    }
}

function addReaction($user_id) {
    global $mysqli;
    
    $message_id = $_POST['messageId'] ?? '';
    $emoji = sanitize_input($_POST['emoji'] ?? '');
    
    if (empty($message_id) || empty($emoji)) {
        send_response(['error' => 'Message ID and emoji are required'], 400);
    }
    
    try {
        // Check if reaction already exists
        $stmt = $mysqli->prepare("
            SELECT ID FROM MessageReaction 
            WHERE MessageID = ? AND UserID = ? AND Emoji = ?
        ");
        $stmt->bind_param("iis", $message_id, $user_id, $emoji);
        $stmt->execute();
        
        if ($stmt->get_result()->num_rows > 0) {
            send_response(['error' => 'Reaction already exists'], 400);
        }
        
        // Add reaction
        $stmt = $mysqli->prepare("
            INSERT INTO MessageReaction (MessageID, UserID, Emoji) 
            VALUES (?, ?, ?)
        ");
        $stmt->bind_param("iis", $message_id, $user_id, $emoji);
        $stmt->execute();
        
        send_response(['success' => true, 'message' => 'Reaction added successfully']);
    } catch (Exception $e) {
        error_log("Error adding reaction: " . $e->getMessage());
        send_response(['error' => 'Failed to add reaction'], 500);
    }
}

function removeReaction($user_id) {
    global $mysqli;
    
    $message_id = $_POST['messageId'] ?? '';
    $emoji = sanitize_input($_POST['emoji'] ?? '');
    
    if (empty($message_id) || empty($emoji)) {
        send_response(['error' => 'Message ID and emoji are required'], 400);
    }
    
    try {
        $stmt = $mysqli->prepare("
            DELETE FROM MessageReaction 
            WHERE MessageID = ? AND UserID = ? AND Emoji = ?
        ");
        $stmt->bind_param("iis", $message_id, $user_id, $emoji);
        $stmt->execute();
        
        if ($stmt->affected_rows > 0) {
            send_response(['success' => true, 'message' => 'Reaction removed successfully']);
        } else {
            send_response(['error' => 'Reaction not found'], 404);
        }
    } catch (Exception $e) {
        error_log("Error removing reaction: " . $e->getMessage());
        send_response(['error' => 'Failed to remove reaction'], 500);
    }
}
?>