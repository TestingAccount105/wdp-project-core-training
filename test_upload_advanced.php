<?php
// Advanced upload test with real file creation
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'test_user';

// Create upload directory structure
$upload_dir = 'user/home/uploads/';
$user_upload_dir = $upload_dir . '1/';

if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}
if (!file_exists($user_upload_dir)) {
    mkdir($user_upload_dir, 0755, true);
}

// Create a test file in proper temp location
$test_content = "This is a test file for upload validation.";
$temp_file = tempnam(sys_get_temp_dir(), 'upload_test_');
file_put_contents($temp_file, $test_content);

echo "Created test file: $temp_file\n";
echo "Upload dir: $upload_dir\n";
echo "User upload dir: $user_upload_dir\n";

// Simulate proper $_FILES
$_SERVER['REQUEST_METHOD'] = 'POST';
$_FILES['files'] = [
    'name' => 'test_document.txt',
    'type' => 'text/plain',
    'tmp_name' => $temp_file,
    'error' => UPLOAD_ERR_OK,
    'size' => filesize($temp_file)
];

echo "\nCalling upload.php...\n";

// Test the upload
ob_start();
include 'user/home/api/upload.php';
$output = ob_get_clean();

echo "Upload response:\n";
echo $output . "\n";

// Cleanup
if (file_exists($temp_file)) {
    unlink($temp_file);
}

// Check what files were created
echo "\nFiles in user upload directory:\n";
if (is_dir($user_upload_dir)) {
    $files = scandir($user_upload_dir);
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..') {
            echo "- $file\n";
        }
    }
} else {
    echo "Directory does not exist\n";
}
?>
