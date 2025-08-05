<?php
require_once 'config.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$user_id = validate_session();

switch ($action) {
    case 'getCurrentUser':
        getCurrentUser($user_id);
        break;
    case 'updateProfile':
        updateProfile($user_id);
        break;
    case 'updateAvatar':
        updateAvatar($user_id);
        break;
    case 'updateBanner':
        updateBanner($user_id);
        break;
    case 'changePassword':
        changePassword($user_id);
        break;
    case 'verifySecurityQuestion':
        verifySecurityQuestion($user_id);
        break;
    case 'deleteAccount':
        deleteAccount($user_id);
        break;
    case 'checkOwnedServers':
        checkOwnedServers($user_id);
        break;
    case 'updateStatus':
        updateStatus($user_id);
        break;
    default:
        send_response(['error' => 'Invalid action'], 400);
}

function getCurrentUser($user_id) {
    global $mysqli;
    
    try {
        $user = get_user_by_id($user_id);
        if ($user) {
            // Mask email for security
            $email = $user['Email'];
            $masked_email = substr($email, 0, 2) . str_repeat('*', strlen($email) - 6) . substr($email, -4);
            $user['MaskedEmail'] = $masked_email;
            
            send_response(['success' => true, 'user' => $user]);
        } else {
            send_response(['error' => 'User not found'], 404);
        }
    } catch (Exception $e) {
        error_log("Error getting current user: " . $e->getMessage());
        send_response(['error' => 'Failed to load user data'], 500);
    }
}

function updateProfile($user_id) {
    global $mysqli;
    
    $field = $_POST['field'] ?? '';
    $value = sanitize_input($_POST['value'] ?? '');
    
    if (empty($field)) {
        send_response(['error' => 'Field is required'], 400);
    }
    
    $allowed_fields = ['Username', 'DisplayName', 'Bio'];
    if (!in_array($field, $allowed_fields)) {
        send_response(['error' => 'Invalid field'], 400);
    }
    
    try {
        // Special validation for username
        if ($field === 'Username') {
            if (strlen($value) < 2 || strlen($value) > 32) {
                send_response(['error' => 'Username must be between 2 and 32 characters'], 400);
            }
            
            // Check if username is already taken
            $stmt = $mysqli->prepare("SELECT ID FROM Users WHERE Username = ? AND ID != ?");
            $stmt->bind_param("si", $value, $user_id);
            $stmt->execute();
            
            if ($stmt->get_result()->num_rows > 0) {
                send_response(['error' => 'Username is already taken'], 400);
            }
        }
        
        // Special validation for bio
        if ($field === 'Bio' && strlen($value) > 1000) {
            send_response(['error' => 'Bio must be 1000 characters or less'], 400);
        }
        
        $stmt = $mysqli->prepare("UPDATE Users SET $field = ? WHERE ID = ?");
        $stmt->bind_param("si", $value, $user_id);
        $stmt->execute();
        
        if ($stmt->affected_rows > 0) {
            send_response(['success' => true, 'message' => 'Profile updated successfully']);
        } else {
            send_response(['error' => 'No changes made'], 400);
        }
    } catch (Exception $e) {
        error_log("Error updating profile: " . $e->getMessage());
        send_response(['error' => 'Failed to update profile'], 500);
    }
}

function updateAvatar($user_id) {
    global $mysqli;
    
    $avatar_url = $_POST['avatarUrl'] ?? '';
    
    if (empty($avatar_url)) {
        send_response(['error' => 'Avatar URL is required'], 400);
    }
    
    try {
        $stmt = $mysqli->prepare("UPDATE Users SET ProfilePictureUrl = ? WHERE ID = ?");
        $stmt->bind_param("si", $avatar_url, $user_id);
        $stmt->execute();
        
        if ($stmt->affected_rows > 0) {
            send_response(['success' => true, 'message' => 'Avatar updated successfully']);
        } else {
            send_response(['error' => 'No changes made'], 400);
        }
    } catch (Exception $e) {
        error_log("Error updating avatar: " . $e->getMessage());
        send_response(['error' => 'Failed to update avatar'], 500);
    }
}

function updateBanner($user_id) {
    global $mysqli;
    
    $banner_url = $_POST['bannerUrl'] ?? '';
    
    try {
        $stmt = $mysqli->prepare("UPDATE Users SET BannerProfile = ? WHERE ID = ?");
        $stmt->bind_param("si", $banner_url, $user_id);
        $stmt->execute();
        
        send_response(['success' => true, 'message' => 'Banner updated successfully']);
    } catch (Exception $e) {
        error_log("Error updating banner: " . $e->getMessage());
        send_response(['error' => 'Failed to update banner'], 500);
    }
}

function verifySecurityQuestion($user_id) {
    global $mysqli;
    
    $answer = sanitize_input($_POST['answer'] ?? '');
    
    if (empty($answer)) {
        send_response(['error' => 'Answer is required'], 400);
    }
    
    try {
        $stmt = $mysqli->prepare("SELECT SecurityQuestion, SecurityAnswer FROM Users WHERE ID = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($user = $result->fetch_assoc()) {
            if (password_verify($answer, $user['SecurityAnswer'])) {
                // Store verification in session
                $_SESSION['security_verified'] = true;
                $_SESSION['security_verified_at'] = time();
                
                send_response([
                    'success' => true, 
                    'message' => 'Security question verified',
                    'question' => $user['SecurityQuestion']
                ]);
            } else {
                send_response(['error' => 'Incorrect answer'], 400);
            }
        } else {
            send_response(['error' => 'User not found'], 404);
        }
    } catch (Exception $e) {
        error_log("Error verifying security question: " . $e->getMessage());
        send_response(['error' => 'Failed to verify security question'], 500);
    }
}

function changePassword($user_id) {
    global $mysqli;
    
    $new_password = $_POST['newPassword'] ?? '';
    $confirm_password = $_POST['confirmPassword'] ?? '';
    
    if (empty($new_password) || empty($confirm_password)) {
        send_response(['error' => 'New password and confirmation are required'], 400);
    }
    
    if ($new_password !== $confirm_password) {
        send_response(['error' => 'Passwords do not match'], 400);
    }
    
    if (strlen($new_password) < 8) {
        send_response(['error' => 'Password must be at least 8 characters long'], 400);
    }
    
    // Check if security question was verified recently (within 10 minutes)
    if (!isset($_SESSION['security_verified']) || 
        !isset($_SESSION['security_verified_at']) || 
        (time() - $_SESSION['security_verified_at']) > 600) {
        send_response(['error' => 'Security verification required'], 403);
    }
    
    try {
        // Get current password to check if it's different
        $stmt = $mysqli->prepare("SELECT Password FROM Users WHERE ID = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($user = $result->fetch_assoc()) {
            if (password_verify($new_password, $user['Password'])) {
                send_response(['error' => 'New password must be different from current password'], 400);
            }
            
            $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
            
            $stmt = $mysqli->prepare("UPDATE Users SET Password = ? WHERE ID = ?");
            $stmt->bind_param("si", $hashed_password, $user_id);
            $stmt->execute();
            
            // Clear security verification
            unset($_SESSION['security_verified']);
            unset($_SESSION['security_verified_at']);
            
            send_response(['success' => true, 'message' => 'Password changed successfully']);
        } else {
            send_response(['error' => 'User not found'], 404);
        }
    } catch (Exception $e) {
        error_log("Error changing password: " . $e->getMessage());
        send_response(['error' => 'Failed to change password'], 500);
    }
}

function checkOwnedServers($user_id) {
    global $mysqli;
    
    try {
        $stmt = $mysqli->prepare("
            SELECT s.ID, s.Name 
            FROM Server s 
            JOIN UserServerMemberships usm ON s.ID = usm.ServerID 
            WHERE usm.UserID = ? AND usm.Role = 'Owner'
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $owned_servers = [];
        while ($row = $result->fetch_assoc()) {
            $owned_servers[] = $row;
        }
        
        send_response([
            'success' => true, 
            'ownedServers' => $owned_servers,
            'hasOwnedServers' => count($owned_servers) > 0
        ]);
    } catch (Exception $e) {
        error_log("Error checking owned servers: " . $e->getMessage());
        send_response(['error' => 'Failed to check owned servers'], 500);
    }
}

function deleteAccount($user_id) {
    global $mysqli;
    
    $confirmation = sanitize_input($_POST['confirmation'] ?? '');
    
    if (empty($confirmation)) {
        send_response(['error' => 'Confirmation is required'], 400);
    }
    
    try {
        // Check if user owns any servers
        $stmt = $mysqli->prepare("
            SELECT COUNT(*) as owned_count 
            FROM UserServerMemberships 
            WHERE UserID = ? AND Role = 'Owner'
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $owned_count = $stmt->get_result()->fetch_assoc()['owned_count'];
        
        if ($owned_count > 0) {
            send_response(['error' => 'You must transfer ownership of all your servers before deleting your account'], 400);
        }
        
        // Get user info for confirmation
        $user = get_user_by_id($user_id);
        if (!$user) {
            send_response(['error' => 'User not found'], 404);
        }
        
        if ($confirmation !== $user['Username']) {
            send_response(['error' => 'Username confirmation does not match'], 400);
        }
        
        $mysqli->begin_transaction();
        
        // Delete user (cascading deletes will handle related records)
        $stmt = $mysqli->prepare("DELETE FROM Users WHERE ID = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        
        $mysqli->commit();
        
        // Destroy session
        session_destroy();
        
        send_response(['success' => true, 'message' => 'Account deleted successfully']);
    } catch (Exception $e) {
        $mysqli->rollback();
        error_log("Error deleting account: " . $e->getMessage());
        send_response(['error' => 'Failed to delete account'], 500);
    }
}

function updateStatus($user_id) {
    global $mysqli;
    
    $status = sanitize_input($_POST['status'] ?? 'online');
    
    $valid_statuses = ['online', 'away', 'busy', 'invisible', 'offline'];
    if (!in_array($status, $valid_statuses)) {
        $status = 'online';
    }
    
    try {
        // Update or insert user status
        $stmt = $mysqli->prepare("
            INSERT INTO UserLastSeen (UserID, Status, LastSeenAt) 
            VALUES (?, ?, NOW()) 
            ON DUPLICATE KEY UPDATE 
            Status = VALUES(Status), 
            LastSeenAt = VALUES(LastSeenAt)
        ");
        $stmt->bind_param("is", $user_id, $status);
        $stmt->execute();
        
        send_response(['success' => true, 'message' => 'Status updated successfully']);
    } catch (Exception $e) {
        error_log("Error updating status: " . $e->getMessage());
        send_response(['error' => 'Failed to update status'], 500);
    }
}
?>