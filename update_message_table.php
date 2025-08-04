<?php
require_once 'auth/database.php';

$database = new Database();
$mysqli = $database->getConnection();

$queries = [
    'ALTER TABLE Message MODIFY COLUMN SentAt DATETIME DEFAULT CURRENT_TIMESTAMP',
    'ALTER TABLE Message MODIFY COLUMN EditedAt DATETIME NULL'
];

foreach ($queries as $query) {
    if ($mysqli->query($query)) {
        echo "Successfully executed: $query\n";
    } else {
        echo "Error: " . $mysqli->error . "\n";
    }
}

echo "Database update completed.\n";
?>
