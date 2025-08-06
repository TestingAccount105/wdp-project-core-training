<?php
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/google-config.php';

if (isset($_GET['code'])) {
    $code = $_GET['code'];
    
    // Exchange code for access token
    $token_url = 'https://oauth2.googleapis.com/token';
    $token_data = array(
        'client_id' => GOOGLE_CLIENT_ID,
        'client_secret' => GOOGLE_CLIENT_SECRET,
        'redirect_uri' => GOOGLE_REDIRECT_URI,
        'grant_type' => 'authorization_code',
        'code' => $code
    );
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $token_url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($token_data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $token_response = curl_exec($ch);
    curl_close($ch);
    
    $token_info = json_decode($token_response, true);
    
    if (isset($token_info['access_token'])) {
        // Get user info from Google
        $user_url = 'https://www.googleapis.com/oauth2/v2/userinfo?access_token=' . $token_info['access_token'];
        $user_response = file_get_contents($user_url);
        $user_info = json_decode($user_response, true);
        
        if (isset($user_info['email'])) {
            $database = new Database();
            $db = $database->getConnection();
            
            // Check if user exists
            $query = "SELECT ID, Username, Email, Status FROM Users WHERE Email = ? OR GoogleID = ?";
            $stmt = $db->prepare($query);
            $stmt->bind_param('ss', $user_info['email'], $user_info['id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            
            if ($user) {
                // Check if user is banned
                if ($user['Status'] === 'banned') {
                    header('Location: login.php?error=account_banned');
                    exit();
                }
                
                // Update Google ID if not set
                if (empty($user['GoogleID'])) {
                    $update_query = "UPDATE Users SET GoogleID = ? WHERE ID = ?";
                    $update_stmt = $db->prepare($update_query);
                    $update_stmt->bind_param('si', $user_info['id'], $user['ID']);
                    $update_stmt->execute();
                }
                
                // User exists, log them in
                $_SESSION['user_id'] = $user['ID'];
                $_SESSION['username'] = $user['Username'];
                $_SESSION['email'] = $user['Email'];
            } else {
                // Create new user
                // Generate a unique integer ID that fits within INTEGER(10) range
                do {
                    $id = rand(100000000, 999999999);
                    $check_query = "SELECT ID FROM Users WHERE ID = ?";
                    $check_stmt = $db->prepare($check_query);
                    $check_stmt->bind_param('i', $id);
                    $check_stmt->execute();
                    $check_result = $check_stmt->get_result();
                } while ($check_result->num_rows > 0);
                
                $username = $user_info['name'] ?? explode('@', $user_info['email'])[0];
                $discriminator = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
                
                // Check if username exists, if so, append discriminator
                $check_query = "SELECT ID FROM Users WHERE Username = ?";
                $check_stmt = $db->prepare($check_query);
                $check_stmt->bind_param('s', $username);
                $check_stmt->execute();
                if ($check_stmt->get_result()->num_rows > 0) {
                    $username = $username . '#' . $discriminator;
                }
                
                $query = "INSERT INTO Users (ID, Username, Email, GoogleID, Status, Discriminator) VALUES (?, ?, ?, ?, 'active', ?)";
                $stmt = $db->prepare($query);
                $stmt->bind_param(
                    'issss', 
                    $id, 
                    $username, 
                    $user_info['email'], 
                    $user_info['id'], 
                    $discriminator,
                    // $user_info['picture'] ?? null
                );
                $stmt->execute();
                
                $_SESSION['user_id'] = $id;
                $_SESSION['username'] = $username;
                $_SESSION['email'] = $user_info['email'];
            }
            
            // Redirect to the same place as regular login
            header('Location: ../user/nitro/nitro.php');
            exit();
        }
    }
}

header('Location: login.php?error=google_auth_failed');
exit();
?>