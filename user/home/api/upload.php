<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$user_id = validate_session();

// Check if files were uploaded
if ($method !== 'POST' || !isset($_FILES['files'])) {
    send_response(['error' => 'No files uploaded'], 400);
}

// Configuration
$upload_dir = '../uploads/';
$max_file_size = 50 * 1024 * 1024; // 50MB
$allowed_types = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg',
    'audio/mp3', 'audio/wav', 'audio/ogg',
    'application/pdf', 'text/plain',
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Create upload directory if it doesn't exist
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

// Create user-specific directory
$user_upload_dir = $upload_dir . $user_id . '/';
if (!file_exists($user_upload_dir)) {
    mkdir($user_upload_dir, 0755, true);
}

$uploaded_files = [];
$errors = [];

// Handle multiple files
$files = $_FILES['files'];
$file_count = is_array($files['name']) ? count($files['name']) : 1;

for ($i = 0; $i < $file_count; $i++) {
    // Get file information
    if (is_array($files['name'])) {
        $file_name = $files['name'][$i];
        $file_tmp = $files['tmp_name'][$i];
        $file_size = $files['size'][$i];
        $file_type = $files['type'][$i];
        $file_error = $files['error'][$i];
    } else {
        $file_name = $files['name'];
        $file_tmp = $files['tmp_name'];
        $file_size = $files['size'];
        $file_type = $files['type'];
        $file_error = $files['error'];
    }

    // Skip if there's an upload error
    if ($file_error !== UPLOAD_ERR_OK) {
        $errors[] = "Upload error for {$file_name}: " . get_upload_error_message($file_error);
        continue;
    }

    // Validate file size
    if ($file_size > $max_file_size) {
        $errors[] = "File {$file_name} is too large. Maximum size is " . format_bytes($max_file_size);
        continue;
    }

    // Validate file type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $detected_type = finfo_file($finfo, $file_tmp);
    finfo_close($finfo);

    if (!in_array($detected_type, $allowed_types)) {
        $errors[] = "File type not allowed for {$file_name}. Detected type: {$detected_type}";
        continue;
    }

    // Generate unique filename
    $file_extension = pathinfo($file_name, PATHINFO_EXTENSION);
    $unique_name = generateUniqueFileName($file_name, $file_extension);
    $file_path = $user_upload_dir . $unique_name;

    // Move uploaded file
    if (move_uploaded_file($file_tmp, $file_path)) {
        // Store file info in database
        $file_url = '/user/home/uploads/' . $user_id . '/' . $unique_name;
        $file_id = storeFileInfo($user_id, $file_name, $unique_name, $file_url, $file_size, $detected_type);
        
        if ($file_id) {
            $uploaded_files[] = [
                'id' => $file_id,
                'name' => $file_name,
                'url' => $file_url,
                'size' => $file_size,
                'type' => $detected_type,
                'thumbnail' => generateThumbnail($file_path, $detected_type, $user_id)
            ];
        } else {
            $errors[] = "Failed to store file info for {$file_name}";
            unlink($file_path); // Remove uploaded file if database insert failed
        }
    } else {
        $errors[] = "Failed to move uploaded file {$file_name}";
    }
}

// Send response
$response = ['uploaded_files' => $uploaded_files];
if (!empty($errors)) {
    $response['errors'] = $errors;
}

send_response($response);

// Helper functions
function generateUniqueFileName($original_name, $extension) {
    $timestamp = time();
    $random = bin2hex(random_bytes(8));
    $safe_name = preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($original_name, PATHINFO_FILENAME));
    return $timestamp . '_' . $random . '_' . $safe_name . '.' . $extension;
}

function storeFileInfo($user_id, $original_name, $stored_name, $file_url, $file_size, $file_type) {
    global $mysqli;
    
    // Create uploads table if it doesn't exist
    $create_table = "CREATE TABLE IF NOT EXISTS Uploads (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        UserID INT NOT NULL,
        OriginalName VARCHAR(255) NOT NULL,
        StoredName VARCHAR(255) NOT NULL,
        FileURL VARCHAR(500) NOT NULL,
        FileSize BIGINT NOT NULL,
        FileType VARCHAR(100) NOT NULL,
        UploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE
    )";
    $mysqli->query($create_table);
    
    $stmt = $mysqli->prepare("INSERT INTO Uploads (UserID, OriginalName, StoredName, FileURL, FileSize, FileType) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isssds", $user_id, $original_name, $stored_name, $file_url, $file_size, $file_type);
    
    if ($stmt->execute()) {
        return $mysqli->insert_id;
    }
    
    return false;
}

function generateThumbnail($file_path, $file_type, $user_id) {
    if (!str_starts_with($file_type, 'image/')) {
        return null;
    }
    
    $thumbnail_dir = '../uploads/' . $user_id . '/thumbnails/';
    if (!file_exists($thumbnail_dir)) {
        mkdir($thumbnail_dir, 0755, true);
    }
    
    $file_name = pathinfo($file_path, PATHINFO_FILENAME);
    $thumbnail_path = $thumbnail_dir . $file_name . '_thumb.jpg';
    $thumbnail_url = '/user/home/uploads/' . $user_id . '/thumbnails/' . $file_name . '_thumb.jpg';
    
    // Create thumbnail
    if (createImageThumbnail($file_path, $thumbnail_path, 200, 200)) {
        return $thumbnail_url;
    }
    
    return null;
}

function createImageThumbnail($source_path, $thumbnail_path, $max_width, $max_height) {
    $image_info = getimagesize($source_path);
    if (!$image_info) {
        return false;
    }
    
    $mime_type = $image_info['mime'];
    
    // Create image resource from source
    switch ($mime_type) {
        case 'image/jpeg':
            $source_image = imagecreatefromjpeg($source_path);
            break;
        case 'image/png':
            $source_image = imagecreatefrompng($source_path);
            break;
        case 'image/gif':
            $source_image = imagecreatefromgif($source_path);
            break;
        case 'image/webp':
            $source_image = imagecreatefromwebp($source_path);
            break;
        default:
            return false;
    }
    
    if (!$source_image) {
        return false;
    }
    
    $source_width = imagesx($source_image);
    $source_height = imagesy($source_image);
    
    // Calculate thumbnail dimensions
    $ratio = min($max_width / $source_width, $max_height / $source_height);
    $thumbnail_width = round($source_width * $ratio);
    $thumbnail_height = round($source_height * $ratio);
    
    // Create thumbnail
    $thumbnail_image = imagecreatetruecolor($thumbnail_width, $thumbnail_height);
    
    // Preserve transparency for PNG and GIF
    if ($mime_type === 'image/png' || $mime_type === 'image/gif') {
        imagealphablending($thumbnail_image, false);
        imagesavealpha($thumbnail_image, true);
        $transparent = imagecolorallocatealpha($thumbnail_image, 255, 255, 255, 127);
        imagefill($thumbnail_image, 0, 0, $transparent);
    }
    
    // Copy and resize
    imagecopyresampled(
        $thumbnail_image, $source_image,
        0, 0, 0, 0,
        $thumbnail_width, $thumbnail_height,
        $source_width, $source_height
    );
    
    // Save thumbnail as JPEG
    $result = imagejpeg($thumbnail_image, $thumbnail_path, 85);
    
    // Clean up memory
    imagedestroy($source_image);
    imagedestroy($thumbnail_image);
    
    return $result;
}

function get_upload_error_message($error_code) {
    switch ($error_code) {
        case UPLOAD_ERR_INI_SIZE:
            return 'File size exceeds upload_max_filesize directive';
        case UPLOAD_ERR_FORM_SIZE:
            return 'File size exceeds MAX_FILE_SIZE directive';
        case UPLOAD_ERR_PARTIAL:
            return 'File was only partially uploaded';
        case UPLOAD_ERR_NO_FILE:
            return 'No file was uploaded';
        case UPLOAD_ERR_NO_TMP_DIR:
            return 'Missing temporary folder';
        case UPLOAD_ERR_CANT_WRITE:
            return 'Failed to write file to disk';
        case UPLOAD_ERR_EXTENSION:
            return 'File upload stopped by extension';
        default:
            return 'Unknown upload error';
    }
}

function format_bytes($bytes, $precision = 2) {
    $units = array('B', 'KB', 'MB', 'GB', 'TB');
    
    for ($i = 0; $bytes > 1024; $i++) {
        $bytes /= 1024;
    }
    
    return round($bytes, $precision) . ' ' . $units[$i];
}
?>