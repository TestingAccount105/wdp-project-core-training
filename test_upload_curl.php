<?php
// Test real upload scenario
session_start();

// Check if user is logged in (simulate for test)
if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 1;
    $_SESSION['username'] = 'test_user';
}

echo "Testing upload endpoint...\n";
echo "Session status: " . session_status() . "\n";
echo "User ID: " . (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'Not set') . "\n";

// Test with curl
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost/user/home/api/upload.php');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, []);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "\nHTTP Status: " . $http_code . "\n";
echo "Response:\n" . $response . "\n";
?>
