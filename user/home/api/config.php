<?php
// Database configuration
$host = "localhost";
$username = "root";
$password = "";
$database = "misvord";

// Create mysqli connection
$mysqli = new mysqli($host, $username, $password, $database, 3307);

// Check connection
if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

// Set charset to UTF-8
$mysqli->set_charset("utf8");

// Enable error reporting
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Function to sanitize input
function sanitize_input($data) {
    global $mysqli;
    return $mysqli->real_escape_string(trim($data));
}

// Function to send JSON response
function send_response($data, $status_code = 200) {
    http_response_code($status_code);
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    echo json_encode($data);
    exit;
}

// Function to validate user session
function validate_session() {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        send_response(['error' => 'Unauthorized'], 401);
    }
    return $_SESSION['user_id'];
}

// Function to get user by ID
function get_user_by_id($user_id) {
    global $mysqli;
    $stmt = $mysqli->prepare("SELECT ID, Username, Email, ProfilePictureUrl, Status, DisplayName, Discriminator FROM Users WHERE ID = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->fetch_assoc();
}

// Function to format timestamp
function format_timestamp($timestamp) {
    return date('Y-m-d H:i:s', strtotime($timestamp));
}
?>