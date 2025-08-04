<?php
require_once 'auth/database.php';

echo "Checking Emoji column collation...\n";

$database = new Database();
$mysqli = $database->getConnection();

$result = $mysqli->query("SHOW FULL COLUMNS FROM MessageReaction WHERE Field = 'Emoji'");
if ($result) {
    $row = $result->fetch_assoc();
    echo "Emoji column info:\n";
    print_r($row);
} else {
    echo "Error: " . $mysqli->error . "\n";
}

// Also check the default collation of the database
$result = $mysqli->query("SELECT DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = DATABASE()");
if ($result) {
    $row = $result->fetch_assoc();
    echo "\nDatabase default collation: " . $row['DEFAULT_COLLATION_NAME'] . "\n";
}

// Check the connection charset
echo "Connection charset: " . $mysqli->character_set_name() . "\n";
?>
