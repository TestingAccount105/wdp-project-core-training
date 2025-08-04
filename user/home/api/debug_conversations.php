<?php
header('Content-Type: application/json');

try {
    require_once 'config.php';
    
    // Simulate what happens in chat.php
    $_GET['action'] = 'conversations';
    $_SERVER['REQUEST_METHOD'] = 'GET';
    
    // Test session validation
    echo json_encode(['step' => 1, 'message' => 'Starting session test']);
    
    // Start session like validate_session does
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    echo json_encode(['step' => 2, 'message' => 'Session started', 'session_id' => session_id()]);
    
    // Check if user_id is in session
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['step' => 3, 'message' => 'No user_id in session - this would cause 401']);
        // Simulate a user_id for testing
        $_SESSION['user_id'] = 1;
    } else {
        echo json_encode(['step' => 3, 'message' => 'User ID found: ' . $_SESSION['user_id']]);
    }
    
    $user_id = $_SESSION['user_id'];
    
    // Test a simple query that get_conversations would run
    $test_query = "SELECT COUNT(*) as room_count FROM ChatRoom cr INNER JOIN ChatParticipants cp ON cr.ID = cp.ChatRoomID WHERE cp.UserID = ?";
    $stmt = $mysqli->prepare($test_query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    echo json_encode(['step' => 4, 'message' => 'Query test successful', 'rooms_for_user' => $row['room_count']]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
}
?>
