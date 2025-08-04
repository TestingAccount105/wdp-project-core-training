<?php
require_once 'user/home/api/config.php';

$create_table_query = "CREATE TABLE IF NOT EXISTS UserLastSeen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    last_seen DATETIME NOT NULL,
    UNIQUE KEY unique_user_room (user_id, room_id),
    FOREIGN KEY (user_id) REFERENCES Users(ID) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES ChatRoom(ID) ON DELETE CASCADE
)";

if ($mysqli->query($create_table_query)) {
    echo 'UserLastSeen table created successfully!' . PHP_EOL;
} else {
    echo 'Error creating table: ' . $mysqli->error . PHP_EOL;
}
?>
