<?php
// Disable error display to prevent HTML output in API responses
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Database configuration
$host = "localhost";
$username = "root";
$password = "";
$database = "misvord";

// Create mysqli connection
$mysqli = new mysqli($host, $username, $password, $database, 3307);

// Check connection
if ($mysqli->connect_error) {
    if (!headers_sent()) {
        header('Content-Type: application/json');
        http_response_code(500);
    }
    echo json_encode(['error' => 'Database connection failed: ' . $mysqli->connect_error]);
    exit;
}

// Set charset to UTF-8
$mysqli->set_charset("utf8mb4");

// Enable error reporting
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Function to sanitize input
function sanitize_input($data) {
    global $mysqli;
    return $mysqli->real_escape_string(trim($data));
}

// Function to send JSON response
function send_response($data, $status_code = 200) {
    if (!headers_sent()) {
        http_response_code($status_code);
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
    }
    echo json_encode($data);
    exit;
}

// Function to validate user session
function validate_session() {
    try {
        // Only start session if not already started and headers not sent
        if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
            session_start();
        }
        
        // Check if session is active and has user_id
        if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['user_id'])) {
            return $_SESSION['user_id'];
        }
        
        // If no valid session, send unauthorized response
        send_response(['error' => 'Unauthorized - Please log in'], 401);
        
    } catch (Exception $e) {
        error_log("Session validation error: " . $e->getMessage());
        send_response(['error' => 'Session error: ' . $e->getMessage()], 500);
    }
}

// Function to get user by ID
function get_user_by_id($user_id) {
    global $mysqli;
    $stmt = $mysqli->prepare("SELECT ID, Username, Email, ProfilePictureUrl, Status, DisplayName, Discriminator, Bio FROM Users WHERE ID = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->fetch_assoc();
}

// Function to check if user is server owner
function is_server_owner($user_id, $server_id) {
    global $mysqli;
    $stmt = $mysqli->prepare("SELECT Role FROM UserServerMemberships WHERE UserID = ? AND ServerID = ? AND Role = 'Owner'");
    $stmt->bind_param("ii", $user_id, $server_id);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->num_rows > 0;
}

// Function to check if user is server admin or owner
function is_server_admin($user_id, $server_id) {
    global $mysqli;
    $stmt = $mysqli->prepare("SELECT Role FROM UserServerMemberships WHERE UserID = ? AND ServerID = ? AND (Role = 'Owner' OR Role = 'Admin')");
    $stmt->bind_param("ii", $user_id, $server_id);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->num_rows > 0;
}

// Function to check if user is member of server
function is_server_member($user_id, $server_id) {
    global $mysqli;
    $stmt = $mysqli->prepare("SELECT ID FROM UserServerMemberships WHERE UserID = ? AND ServerID = ?");
    $stmt->bind_param("ii", $user_id, $server_id);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->num_rows > 0;
}

// Function to format timestamp
function format_timestamp($timestamp) {
    return date('Y-m-d H:i:s', strtotime($timestamp));
}

// Function to generate unique invite code
function generate_invite_code($length = 8) {
    $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    $code = '';
    for ($i = 0; $i < $length; $i++) {
        $code .= $characters[rand(0, strlen($characters) - 1)];
    }
    return $code;
}

// Server categories for explore page
$server_categories = [
    'Gaming', 'Music', 'Education', 'Science & Tech', 'Entertainment', 
    'Art', 'Fashion & Beauty', 'Fitness & Health', 'Travel & Places',
    'Food & Cooking', 'Animals & Nature', 'Anime & Manga', 'Movies & TV',
    'Books & Literature', 'Sports', 'Business', 'Cryptocurrency', 'Other'
];
?>