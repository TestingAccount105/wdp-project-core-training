<?php
// Test file upload endpoint to ensure it returns JSON
session_start();

// Simulate a basic session (minimal)
$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'test_user';

// Simulate a POST request to upload endpoint
$_POST = [];
$_FILES = [];

// Capture output
ob_start();
include 'user/home/api/upload.php';
$output = ob_get_clean();

echo "Upload endpoint output:\n";
echo $output . "\n";

// Check if it's valid JSON
$decoded = json_decode($output, true);
if ($decoded !== null) {
    echo "\n✓ Valid JSON response\n";
    echo "Response structure: " . print_r($decoded, true);
} else {
    echo "\n✗ Invalid JSON response\n";
    echo "JSON error: " . json_last_error_msg() . "\n";
}
?>
