<?php
// Test the upload API
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'TestUser';

echo "Testing upload API...\n";

// Create a simple test file to upload
$test_file_content = "This is a test file for upload functionality.";
$test_file_path = sys_get_temp_dir() . '/test_upload.txt';
file_put_contents($test_file_path, $test_file_content);

// Simulate file upload
$_FILES['files'] = [
    'name' => 'test_upload.txt',
    'type' => 'text/plain',
    'tmp_name' => $test_file_path,
    'error' => UPLOAD_ERR_OK,
    'size' => strlen($test_file_content)
];

$_SERVER['REQUEST_METHOD'] = 'POST';

try {
    // Capture any output
    ob_start();
    include 'api/upload.php';
    $output = ob_get_clean();
    
    echo "Upload API output:\n";
    echo $output . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
} finally {
    // Clean up
    if (file_exists($test_file_path)) {
        unlink($test_file_path);
    }
}
?>
