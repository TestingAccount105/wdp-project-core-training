<?php
// Test image upload
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'test_user';

// Create a simple 1x1 pixel PNG image for testing
$img = imagecreate(1, 1);
$white = imagecolorallocate($img, 255, 255, 255);
$temp_img_path = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'test_image.png';
imagepng($img, $temp_img_path);
imagedestroy($img);

echo "Created test image: $temp_img_path\n";
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
}

// Cleanup
if (file_exists($temp_img_path)) {
    unlink($temp_img_path);
}
?>
