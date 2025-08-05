<?php
// Test upload endpoint with actual file simulation
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'test_user';

// Create a simple test file
$test_file_content = "Test file content for upload";
$test_file_path = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'test_upload.txt';
file_put_contents($test_file_path, $test_file_content);

// Simulate $_FILES array
$_SERVER['REQUEST_METHOD'] = 'POST';
$_FILES['files'] = [
    'name' => 'test.txt',
    'type' => 'text/plain',
    'tmp_name' => $test_file_path,
    'error' => UPLOAD_ERR_OK,
    'size' => strlen($test_file_content)
];

echo "Testing upload with simulated file...\n";

// Capture output
ob_start();
include 'user/home/api/upload.php';
$output = ob_get_clean();

echo "Output:\n";
echo $output . "\n";

// Check if valid JSON
$json = json_decode($output, true);
if ($json !== null) {
    echo "\n✓ Valid JSON response\n";
    print_r($json);
} else {
    echo "\n✗ Invalid JSON\n";
    echo "JSON Error: " . json_last_error_msg() . "\n";
}

// Clean up
if (file_exists($test_file_path)) {
    unlink($test_file_path);
}
?>
