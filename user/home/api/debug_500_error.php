<?php
// Debug script to test API step by step
header('Content-Type: application/json');

echo "=== DEBUGGING CONVERSATIONS API ===\n";

try {
    // Step 1: Test basic PHP
    echo "1. PHP is working\n";
    
    // Step 2: Start session
    session_start();
    echo "2. Session started\n";
    
    // Step 3: Check if session has user_id
    if (!isset($_SESSION['user_id'])) {
        // Set a test user ID
        $_SESSION['user_id'] = 1;
        $_SESSION['username'] = 'TestUser';
        echo "3. Test session created with user_id = 1\n";
    } else {
        echo "3. Existing session found with user_id = " . $_SESSION['user_id'] . "\n";
    }
    
    // Step 4: Include config
    require_once 'config.php';
    echo "4. Config loaded successfully\n";
    
    // Step 5: Test database connection
    if ($mysqli->ping()) {
        echo "5. Database connection is working\n";
    } else {
        echo "5. ERROR: Database connection failed\n";
        exit;
    }
    
    // Step 6: Test basic query
    $result = $mysqli->query("SELECT COUNT(*) as user_count FROM Users");
    if ($result) {
        $row = $result->fetch_assoc();
        echo "6. Basic query works - Users table has {$row['user_count']} users\n";
    } else {
        echo "6. ERROR: Basic query failed - " . $mysqli->error . "\n";
        exit;
    }
    
    // Step 7: Test the exact query from get_conversations
    $user_id = $_SESSION['user_id'];
    echo "7. Testing conversations query for user_id = $user_id\n";
    
    $test_query = "SELECT COUNT(*) as room_count 
                   FROM ChatRoom cr
                   INNER JOIN ChatParticipants cp ON cr.ID = cp.ChatRoomID
                   WHERE cp.UserID = ?";
    
    $stmt = $mysqli->prepare($test_query);
    if (!$stmt) {
        echo "7. ERROR: Prepare failed - " . $mysqli->error . "\n";
        exit;
    }
    
    $stmt->bind_param("i", $user_id);
    if (!$stmt->execute()) {
        echo "7. ERROR: Execute failed - " . $stmt->error . "\n";
        exit;
    }
    
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    echo "7. Conversations query works - User has {$row['room_count']} rooms\n";
    
    // Step 8: Try to call the actual get_conversations function
    echo "8. Testing actual get_conversations function...\n";
    
    // Simulate the API call
    $_GET['action'] = 'conversations';
    $_SERVER['REQUEST_METHOD'] = 'GET';
    
    // Capture the output
    ob_start();
    include 'chat.php';
    $output = ob_get_clean();
    
    echo "8. get_conversations output:\n";
    echo $output . "\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>
