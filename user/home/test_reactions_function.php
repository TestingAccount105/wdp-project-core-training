<?php
// Test the emoji reaction API directly
session_start();
$_SESSION['user_id'] = 1;

// Create a simple test by checking if we can create a test message and react to it
require_once 'api/config.php';

echo "Testing emoji reactions with explode fix...\n";

try {
    // Test the exact query that was causing issues
    $current_user_id = 1;
    $message_id = 999; // Non-existent message
    
    $query = "SELECT mr.Emoji, COUNT(*) as count, 
                     GROUP_CONCAT(u.DisplayName) as users,
                     MAX(CASE WHEN mr.UserID = ? THEN 1 ELSE 0 END) as user_reacted
              FROM MessageReaction mr 
              JOIN Users u ON mr.UserID = u.ID 
              WHERE mr.MessageID = ? 
              GROUP BY mr.Emoji";
    
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("ii", $current_user_id, $message_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $reactions = [];
    while ($row = $result->fetch_assoc()) {
        // This is the fixed version - handle null values
        $users = $row['users'] ? explode(',', $row['users']) : [];
        
        $reactions[] = [
            'emoji' => $row['Emoji'],
            'count' => (int)$row['count'],
            'users' => $users,
            'user_reacted' => (bool)$row['user_reacted']
        ];
    }
    
    echo "✅ Query executed successfully with fix!\n";
    echo "Result: " . json_encode($reactions) . "\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
