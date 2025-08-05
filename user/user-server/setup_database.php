<?php
require_once 'api/config.php';

// Add Category column to Server table if it doesn't exist
$add_category_query = "ALTER TABLE Server ADD COLUMN IF NOT EXISTS Category VARCHAR(255) DEFAULT 'Other'";
try {
    $mysqli->query($add_category_query);
    echo "Added Category column to Server table\n";
} catch (Exception $e) {
    echo "Category column might already exist: " . $e->getMessage() . "\n";
}

// Add CreatedAt column to Server table if it doesn't exist
$add_created_at_query = "ALTER TABLE Server ADD COLUMN IF NOT EXISTS CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP";
try {
    $mysqli->query($add_created_at_query);
    echo "Added CreatedAt column to Server table\n";
} catch (Exception $e) {
    echo "CreatedAt column might already exist: " . $e->getMessage() . "\n";
}

// Add JoinedAt column to UserServerMemberships table if it doesn't exist
$add_joined_at_query = "ALTER TABLE UserServerMemberships ADD COLUMN IF NOT EXISTS JoinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP";
try {
    $mysqli->query($add_joined_at_query);
    echo "Added JoinedAt column to UserServerMemberships table\n";
} catch (Exception $e) {
    echo "JoinedAt column might already exist: " . $e->getMessage() . "\n";
}

// Update Message table to use TIMESTAMP instead of DATE for better precision
$update_message_sent_at = "ALTER TABLE Message MODIFY SentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP";
try {
    $mysqli->query($update_message_sent_at);
    echo "Updated SentAt column in Message table to TIMESTAMP\n";
} catch (Exception $e) {
    echo "SentAt column update error: " . $e->getMessage() . "\n";
}

$update_message_edited_at = "ALTER TABLE Message MODIFY EditedAt TIMESTAMP NULL";
try {
    $mysqli->query($update_message_edited_at);
    echo "Updated EditedAt column in Message table to TIMESTAMP\n";
} catch (Exception $e) {
    echo "EditedAt column update error: " . $e->getMessage() . "\n";
}

// Create VoiceChannelParticipants table for tracking voice channel users
$voice_participants_table = "
CREATE TABLE IF NOT EXISTS VoiceChannelParticipants (
    ID INTEGER(10) PRIMARY KEY AUTO_INCREMENT,
    ChannelID INTEGER(10) NOT NULL,
    UserID INTEGER(10) NOT NULL,
    JoinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    IsMuted TINYINT(1) DEFAULT 0,
    IsDeafened TINYINT(1) DEFAULT 0,
    IsVideoEnabled TINYINT(1) DEFAULT 0,
    IsScreenSharing TINYINT(1) DEFAULT 0,
    FOREIGN KEY (ChannelID) REFERENCES Channel(ID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE,
    UNIQUE KEY unique_channel_user (ChannelID, UserID)
)";

try {
    $mysqli->query($voice_participants_table);
    echo "Created VoiceChannelParticipants table\n";
} catch (Exception $e) {
    echo "VoiceChannelParticipants table creation error: " . $e->getMessage() . "\n";
}

// Create ServerCategories table for predefined categories
$server_categories_table = "
CREATE TABLE IF NOT EXISTS ServerCategories (
    ID INTEGER(10) PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(255) NOT NULL UNIQUE,
    Icon VARCHAR(255),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

try {
    $mysqli->query($server_categories_table);
    echo "Created ServerCategories table\n";
} catch (Exception $e) {
    echo "ServerCategories table creation error: " . $e->getMessage() . "\n";
}

// Insert default categories
$default_categories = [
    'Gaming', 'Music', 'Education', 'Science & Tech', 'Entertainment', 
    'Art', 'Fashion & Beauty', 'Fitness & Health', 'Travel & Places',
    'Food & Cooking', 'Animals & Nature', 'Anime & Manga', 'Movies & TV',
    'Books & Literature', 'Sports', 'Business', 'Cryptocurrency', 'Other'
];

foreach ($default_categories as $category) {
    $insert_category = "INSERT IGNORE INTO ServerCategories (Name) VALUES (?)";
    $stmt = $mysqli->prepare($insert_category);
    $stmt->bind_param("s", $category);
    try {
        $stmt->execute();
    } catch (Exception $e) {
        echo "Error inserting category $category: " . $e->getMessage() . "\n";
    }
}
echo "Inserted default server categories\n";

// Create UserLastSeen table if it doesn't exist
$user_last_seen_table = "
CREATE TABLE IF NOT EXISTS UserLastSeen (
    ID INTEGER(10) PRIMARY KEY AUTO_INCREMENT,
    UserID INTEGER(10) NOT NULL,
    LastSeenAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Status ENUM('online', 'away', 'busy', 'invisible', 'offline') DEFAULT 'offline',
    FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE,
    UNIQUE KEY unique_user (UserID)
)";

try {
    $mysqli->query($user_last_seen_table);
    echo "Created UserLastSeen table\n";
} catch (Exception $e) {
    echo "UserLastSeen table creation error: " . $e->getMessage() . "\n";
}

// Create ChangeMessage table for message edit history
$change_message_table = "
CREATE TABLE IF NOT EXISTS ChangeMessage (
    ID INTEGER(10) PRIMARY KEY AUTO_INCREMENT,
    ChannelID INTEGER(10) NOT NULL,
    MessageID INTEGER(10) NOT NULL,
    OldContent TEXT,
    NewContent TEXT,
    EditedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ChannelID) REFERENCES Channel(ID) ON DELETE CASCADE,
    FOREIGN KEY (MessageID) REFERENCES Message(ID) ON DELETE CASCADE
)";

try {
    $mysqli->query($change_message_table);
    echo "Created ChangeMessage table\n";
} catch (Exception $e) {
    echo "ChangeMessage table creation error: " . $e->getMessage() . "\n";
}

// Update Server table to add auto increment if not present
$update_server_id = "ALTER TABLE Server MODIFY ID INTEGER(10) AUTO_INCREMENT";
try {
    $mysqli->query($update_server_id);
    echo "Updated Server table ID to AUTO_INCREMENT\n";
} catch (Exception $e) {
    echo "Server ID update error: " . $e->getMessage() . "\n";
}

// Update Channel table to add auto increment if not present
$update_channel_id = "ALTER TABLE Channel MODIFY ID INTEGER(10) AUTO_INCREMENT";
try {
    $mysqli->query($update_channel_id);
    echo "Updated Channel table ID to AUTO_INCREMENT\n";
} catch (Exception $e) {
    echo "Channel ID update error: " . $e->getMessage() . "\n";
}

echo "Database setup completed!\n";
?>