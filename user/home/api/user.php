<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'current':
                    getCurrentUser();
                    break;
                default:
                    send_response(['error' => 'Invalid action'], 400);
            }
        } else {
            send_response(['error' => 'Action required'], 400);
        }
        break;
        
    default:
        send_response(['error' => 'Method not allowed'], 405);
}

function getCurrentUser() {
    // Start session to get user ID
    session_start();
    
    if (!isset($_SESSION['user_id'])) {
        // For demo purposes, return a default user
        // In production, this should validate actual session
        $default_user = [
            'id' => 1,
            'username' => 'demo_user',
            'discriminator' => '0001',
            'display_name' => 'Demo User',
            'email' => 'demo@example.com',
            'avatar' => null,
            'status' => 'online'
        ];
        
        send_response(['user' => $default_user]);
        return;
    }
    
    $user_id = $_SESSION['user_id'];
    
    try {
        global $mysqli;
        
        $query = "SELECT ID, Username, Email, ProfilePictureUrl, Status, DisplayName, Discriminator 
                  FROM Users WHERE ID = ?";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        if ($user) {
            $response_user = [
                'id' => (int)$user['ID'],
                'username' => $user['Username'],
                'discriminator' => $user['Discriminator'],
                'display_name' => $user['DisplayName'] ?: $user['Username'],
                'email' => $user['Email'],
                'avatar' => $user['ProfilePictureUrl'],
                'status' => $user['Status'] ?: 'online'
            ];
            
            send_response(['user' => $response_user]);
        } else {
            send_response(['error' => 'User not found'], 404);
        }
    } catch (Exception $e) {
        send_response(['error' => 'Database error'], 500);
    }
}
?>