<?php
session_start();

// Set a test session for debugging
if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 1;
    $_SESSION['username'] = 'TestUser';
    $_SESSION['email'] = 'test@example.com';
}

header('Content-Type: application/json');

echo json_encode([
    'session_status' => 'Test session created',
    'user_id' => $_SESSION['user_id'],
    'username' => $_SESSION['username'],
    'email' => $_SESSION['email']
]);
?>
