<?php
require_once '../auth/database.php';
require_once '../auth/google-config.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: ../index.php');
    exit();
}

$database = new Database();
$db = $database->getConnection();
$error = '';
$success = '';

// Handle profile updates
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_POST['update_profile'])) {
        $display_name = trim($_POST['display_name']);
        $bio = trim($_POST['bio']);
        
        $query = "UPDATE Users SET DisplayName = ?, Bio = ? WHERE ID = ?";
        $stmt = $db->prepare($query);
        
        if ($stmt->execute([$display_name, $bio, $_SESSION['user_id']])) {
            $success = 'Profile updated successfully!';
        } else {
            $error = 'Failed to update profile.';
        }
    }
    
    if (isset($_POST['set_security'])) {
        $security_question = trim($_POST['security_question']);
        $security_answer = trim($_POST['security_answer']);
        
        if (empty($security_question) || empty($security_answer)) {
            $error = 'Both security question and answer are required.';
        } else {
            $hashed_answer = password_hash($security_answer, PASSWORD_DEFAULT);
            $query = "UPDATE Users SET SecurityQuestion = ?, SecurityAnswer = ? WHERE ID = ?";
            $stmt = $db->prepare($query);
            
            if ($stmt->execute([$security_question, $hashed_answer, $_SESSION['user_id']])) {
                $success = 'Security question set successfully!';
            } else {
                $error = 'Failed to set security question.';
            }
        }
    }
}

// Get current user data
$query = "SELECT * FROM Users WHERE ID = ?";
$stmt = $db->prepare($query);
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile Settings - <?php echo SITE_NAME; ?></title>
    <link rel="stylesheet" href="../auth/style.css">
</head>
<body>
    <div class="auth-container" style="max-width: 600px;">
        <div class="logo">
            <svg class="logo-icon" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
        </div>
        
        <h1 class="auth-title">Profile Settings</h1>
        
        <?php if ($error): ?>
            <div class="error-message"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <?php if ($success): ?>
            <div class="success-message"><?php echo htmlspecialchars($success); ?></div>
        <?php endif; ?>
        
        <!-- Profile Information -->
        <form method="POST" action="">
            <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" class="form-input" value="<?php echo htmlspecialchars($user['Username']); ?>" disabled>
                <small style="color: rgba(255, 255, 255, 0.5); font-size: 12px;">Username cannot be changed</small>
            </div>
            
            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" value="<?php echo htmlspecialchars($user['Email']); ?>" disabled>
                <small style="color: rgba(255, 255, 255, 0.5); font-size: 12px;">Email cannot be changed</small>
            </div>
            
            <div class="form-group">
                <label class="form-label">Display Name</label>
                <input type="text" name="display_name" class="form-input" value="<?php echo htmlspecialchars($user['DisplayName'] ?? ''); ?>" placeholder="Enter display name">
            </div>
            
            <div class="form-group">
                <label class="form-label">Bio</label>
                <textarea name="bio" class="form-input" rows="3" placeholder="Tell us about yourself..."><?php echo htmlspecialchars($user['Bio'] ?? ''); ?></textarea>
            </div>
            
            <button type="submit" name="update_profile" class="btn-primary">Update Profile</button>
        </form>
        
        <div class="divider">
            <span>Security Settings</span>
        </div>
        
        <!-- Security Question -->
        <form method="POST" action="">
            <div class="form-group">
                <label class="form-label">Security Question</label>
                <input type="text" name="security_question" class="form-input" 
                       value="<?php echo htmlspecialchars($user['SecurityQuestion'] ?? ''); ?>" 
                       placeholder="e.g., What was your first pet's name?" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Security Answer</label>
                <input type="text" name="security_answer" class="form-input" 
                       placeholder="Enter your answer" required>
                <small style="color: rgba(255, 255, 255, 0.5); font-size: 12px;">
                    This will be used for account recovery
                </small>
            </div>
            
            <button type="submit" name="set_security" class="btn-primary">
                <?php echo $user['SecurityQuestion'] ? 'Update' : 'Set'; ?> Security Question
            </button>
        </form>
        
        <div class="auth-links" style="margin-top: 30px;">
            <a href="dashboard.php" class="auth-link">← Back to Dashboard</a>
        </div>
    </div>
</body>
</html>