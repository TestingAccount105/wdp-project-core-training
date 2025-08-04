<?php
// Start session first
session_start();

// Set a valid test session - you can use this to test the chat
$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'TestUser';
$_SESSION['email'] = 'test@example.com';

header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'message' => 'Test session created successfully! You can now use the chat.',
    'user_id' => $_SESSION['user_id'],
    'username' => $_SESSION['username'],
    'instructions' => 'Go to /user/home/ to use the chat application'
]);
?>
