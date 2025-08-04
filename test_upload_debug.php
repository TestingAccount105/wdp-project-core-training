<?php
// Test the upload endpoint with a simulated file upload
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Simulate session
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'test_user';

// Simulate file upload data
$_SERVER['REQUEST_METHOD'] = 'POST';
$_FILES['files'] = [
    'name' => 'test.txt',
    'type' => 'text/plain',
    'tmp_name' => __FILE__, // Use this file as test upload
    'error' => UPLOAD_ERR_OK,
    'size' => filesize(__FILE__)
];

// Capture output
ob_start();
include 'user/home/api/upload.php';
$output = ob_get_clean();

echo "Raw output:\n";
var_dump($output);

echo "\nOutput analysis:\n";
if (json_decode($output) !== null) {
    echo "✓ Valid JSON\n";
} else {
    echo "✗ Invalid JSON\n";
    echo "First 200 chars: " . substr($output, 0, 200) . "\n";
}
?>
