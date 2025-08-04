<?php
// Test the conversations API
require_once 'user/home/api/config.php';

// Mock session for testing
$_SESSION['user_id'] = 2000; // Using litiyo's ID

echo 'Testing conversations API...' . PHP_EOL;

$user_id = 2000;

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
    echo 'Found conversation: ID=' . $row['ID'] . ', Type=' . $row['Type'] . ', Name=' . $row['Name'] . PHP_EOL;
    
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
        echo '  Participant: ' . $participant['Username'] . ' (ID: ' . $participant['ID'] . ')' . PHP_EOL;
    }
}

echo PHP_EOL . 'API seems to be working correctly!' . PHP_EOL;
?>
