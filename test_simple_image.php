<?php
// Test image upload without using GD
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'test_user';

// Create a simple fake image file
$fake_png_content = "\x89\x50\x4E\x47\x0D\x0A\x1A\x0A"; // PNG header
$temp_img_path = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'fake_image.png';
file_put_contents($temp_img_path, $fake_png_content);

echo "Created fake image: $temp_img_path\n";
echo "File size: " . filesize($temp_img_path) . " bytes\n";

// Simulate image upload
$_SERVER['REQUEST_METHOD'] = 'POST';
$_FILES['files'] = [
    'name' => 'test_image.png',
    'type' => 'image/png',
    'tmp_name' => $temp_img_path,
    'error' => UPLOAD_ERR_OK,
    'size' => filesize($temp_img_path)
];

echo "\nTesting image upload...\n";

// Capture output
ob_start();
include 'user/home/api/upload.php';
$output = ob_get_clean();

echo "Upload response:\n";
echo $output . "\n";

// Check if it's valid JSON
$json = json_decode($output, true);
if ($json !== null) {
    echo "\n✓ Valid JSON response\n";
    print_r($json);
} else {
    echo "\n✗ Invalid JSON\n";
    echo "JSON Error: " . json_last_error_msg() . "\n";
    echo "First 500 chars of output:\n";
    echo substr($output, 0, 500) . "\n";
}

// Cleanup
if (file_exists($temp_img_path)) {
    unlink($temp_img_path);
}
?>
