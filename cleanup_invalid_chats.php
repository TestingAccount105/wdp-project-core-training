<?php
require_once 'user/home/api/config.php';

echo "Cleaning up conversations with non-friends..." . PHP_EOL;

// Find all direct message conversations where participants are not friends
$cleanup_query = "
    SELECT DISTINCT cr.ID as room_id, cp1.UserID as user1, cp2.UserID as user2
    FROM ChatRoom cr
    INNER JOIN ChatParticipants cp1 ON cr.ID = cp1.ChatRoomID
    INNER JOIN ChatParticipants cp2 ON cr.ID = cp2.ChatRoomID
    WHERE cr.Type = 'direct'
    AND cp1.UserID != cp2.UserID
    AND NOT EXISTS (
        SELECT 1 FROM FriendsList f
        WHERE ((f.UserID1 = cp1.UserID AND f.UserID2 = cp2.UserID)
               OR (f.UserID1 = cp2.UserID AND f.UserID2 = cp1.UserID))
        AND f.Status = 'accepted'
    )
";

$result = $mysqli->query($cleanup_query);
$rooms_to_delete = [];

while ($row = $result->fetch_assoc()) {
    $rooms_to_delete[] = $row['room_id'];
    echo "Found invalid conversation: Room {$row['room_id']} between users {$row['user1']} and {$row['user2']} (not friends)" . PHP_EOL;
}

if (empty($rooms_to_delete)) {
    echo "No invalid conversations found!" . PHP_EOL;
} else {
    echo "Deleting " . count($rooms_to_delete) . " invalid conversations..." . PHP_EOL;
    
    foreach ($rooms_to_delete as $room_id) {
        $mysqli->begin_transaction();
        
        try {
            // Delete messages and related data
            $mysqli->query("DELETE FROM MessageReaction WHERE MessageID IN (SELECT MessageID FROM ChatRoomMessage WHERE RoomID = $room_id)");
            $mysqli->query("DELETE FROM ChatRoomMessage WHERE RoomID = $room_id");
            $mysqli->query("DELETE FROM Message WHERE ID NOT IN (SELECT MessageID FROM ChatRoomMessage)");
            $mysqli->query("DELETE FROM ChatParticipants WHERE ChatRoomID = $room_id");
            $mysqli->query("DELETE FROM UserLastSeen WHERE room_id = $room_id");
            $mysqli->query("DELETE FROM ChatRoom WHERE ID = $room_id");
            
            $mysqli->commit();
            echo "Deleted room $room_id" . PHP_EOL;
        } catch (Exception $e) {
            $mysqli->rollback();
            echo "Error deleting room $room_id: " . $e->getMessage() . PHP_EOL;
        }
    }
    
    echo "Cleanup completed!" . PHP_EOL;
}
?>
