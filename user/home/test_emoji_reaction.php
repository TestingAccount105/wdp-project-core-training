<?php
// Test emoji reaction functionality
session_start();

// Set up test session
$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'TestUser';

// Simulate the API request for adding a reaction
$_SERVER['REQUEST_METHOD'] = 'POST';

// Create test data
$test_data = [
    'action' => 'react_message',
    'message_id' => 1,  // Assuming message ID 1 exists
    'emoji' => '👍'
];

// Simulate POST input
$GLOBALS['HTTP_RAW_POST_DATA'] = json_encode($test_data);

// Mock file_get_contents for php://input
function mock_file_get_contents($filename) {
    if ($filename === 'php://input') {
        return json_encode($GLOBALS['test_data']);
    }
    return file_get_contents($filename);
}

// Override the global
$GLOBALS['test_data'] = $test_data;

echo "Testing emoji reaction...\n";

// Include the chat API
include 'api/chat.php';
?>
