<?php
// Simple test for simplified upload
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'test_user';

// Create a simple test text file
$test_content = "Hello world! This is a test file.";
$temp_file = tempnam(sys_get_temp_dir(), 'simple_test_');
file_put_contents($temp_file, $test_content);

// Simulate file upload
$_SERVER['REQUEST_METHOD'] = 'POST';
$_FILES['files'] = [
    'name' => 'test.txt',
    'type' => 'text/plain',
    'tmp_name' => $temp_file,
    'error' => UPLOAD_ERR_OK,
    'size' => strlen($test_content)
];

echo "Testing simplified upload...\n";

// Test upload
ob_start();
include 'user/home/api/upload.php';
$output = ob_get_clean();

echo "Upload response:\n";
echo $output . "\n";

// Parse JSON
$data = json_decode($output, true);
if ($data && isset($data['uploaded_files'][0])) {
    $fileUrl = $data['uploaded_files'][0]['url'];
    echo "\n✓ File uploaded successfully!\n";
    echo "File URL: $fileUrl\n";
    
    // Test if file actually exists
    $actualPath = 'user/home' . substr($fileUrl, 10); // Remove '/user/home' prefix
    echo "Checking if file exists at: $actualPath\n";
    echo "File exists: " . (file_exists($actualPath) ? 'YES' : 'NO') . "\n";
} else {
    echo "\n✗ Upload failed\n";
    print_r($data);
}

// Cleanup
if (file_exists($temp_file)) {
    unlink($temp_file);
}
?>
