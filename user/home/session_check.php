<?php
// Simple script to verify the fix is working
session_start();

echo "<!DOCTYPE html><html><head><title>API Test</title></head><body>";
echo "<h2>Session Status Check</h2>";

if (isset($_SESSION['user_id'])) {
    echo "<p style='color: green;'>✅ User is logged in with ID: " . $_SESSION['user_id'] . "</p>";
    echo "<p>Username: " . ($_SESSION['username'] ?? 'Not set') . "</p>";
    echo "<p>Email: " . ($_SESSION['email'] ?? 'Not set') . "</p>";
    echo "<p>The conversations API should now work properly!</p>";
    echo "<a href='index.php'>Go to Chat</a>";
} else {
    echo "<p style='color: red;'>❌ User is not logged in</p>";
    echo "<p>You need to log in first for the chat to work.</p>";
    echo "<a href='../../auth/login.php'>Go to Login</a>";
}

echo "</body></html>";
?>
