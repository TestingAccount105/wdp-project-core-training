<?php
session_start();

// Simulate a logged-in user for testing
$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'testuser';
$_SESSION['email'] = 'test@example.com';

echo "Session set. You can now test the conversations API.<br>";
echo "User ID: " . $_SESSION['user_id'] . "<br>";
echo "Username: " . $_SESSION['username'] . "<br>";

// Now let's test if the chat API works
echo "<br>Testing conversations API...<br>";

$_GET['action'] = 'conversations';
$_SERVER['REQUEST_METHOD'] = 'GET';

try {
    ob_start();
    include 'chat.php';
    $output = ob_get_clean();
    echo "API Response: " . $output;
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
