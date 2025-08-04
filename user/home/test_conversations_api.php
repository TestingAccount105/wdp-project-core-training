<?php
// Test the conversations API with a proper session
session_start();

// Set up test session
$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'TestUser';

// Simulate the API request
$_GET['action'] = 'conversations';
$_SERVER['REQUEST_METHOD'] = 'GET';

// Include the chat API
include 'api/chat.php';
?>
