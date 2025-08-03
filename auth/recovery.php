<?php
session_start();

require_once __DIR__ . '/database.php';

$error = '';
$success = '';
$current_step = 1;

// Determine current step
if (isset($_SESSION['recovery_user_id']) && !isset($_SESSION['recovery_verified'])) {
    $current_step = 2;
} elseif (isset($_SESSION['recovery_verified']) && $_SESSION['recovery_verified'] === true) {
    $current_step = 3;
}

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $database = new Database();
    $db = $database->getConnection();
    
    // Recovery Step 1 Handler
    if (isset($_POST['recovery_email'])) {
        $email = trim($_POST['email']);
        
        if (empty($email)) {
            $error = 'Email is required.';
        } else {
            $query = "SELECT ID, SecurityQuestion FROM Users WHERE Email = ?";
            $stmt = $db->prepare($query);
            $stmt->bind_param('s', $email);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            
            if ($user && !empty($user['SecurityQuestion'])) {
                $_SESSION['recovery_user_id'] = $user['ID'];
                $_SESSION['recovery_email'] = $email;
                $_SESSION['security_question'] = $user['SecurityQuestion'];
                $success = 'Email verified. Please answer your security question.';
                $current_step = 2;
            } else {
                $error = 'No account found with that email or no security question set.';
            }
        }
    }
    
    // Recovery Step 2 Handler
    elseif (isset($_POST['recovery_security'])) {
        $security_answer = trim($_POST['security_answer']);
        $user_id = $_SESSION['recovery_user_id'] ?? null;
        
        if (empty($security_answer) || !$user_id) {
            $error = 'Security answer is required.';
        } else {
            $query = "SELECT SecurityAnswer FROM Users WHERE ID = ?";
            $stmt = $db->prepare($query);
            $stmt->bind_param('s', $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            
            if ($user && password_verify($security_answer, $user['SecurityAnswer'])) {
                $_SESSION['recovery_verified'] = true;
                $success = 'Security question verified. You can now reset your password.';
                $current_step = 3;
            } else {
                $error = 'Incorrect security answer.';
            }
        }
    }
    
    // Password Reset Handler
    elseif (isset($_POST['reset_password'])) {
        $new_password = $_POST['new_password'];
        $confirm_password = $_POST['confirm_password'];
        $user_id = $_SESSION['recovery_user_id'] ?? null;
        $verified = $_SESSION['recovery_verified'] ?? false;
        
        if (!$verified || !$user_id) {
            $error = 'Unauthorized access.';
        } elseif (empty($new_password) || empty($confirm_password)) {
            $error = 'All fields are required.';
        } elseif ($new_password !== $confirm_password) {
            $error = 'Passwords do not match.';
        } elseif (strlen($new_password) < 6) {
            $error = 'Password must be at least 6 characters long.';
        } else {
            $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
            $query = "UPDATE Users SET Password = ? WHERE ID = ?";
            $stmt = $db->prepare($query);
            $stmt->bind_param('ss', $hashed_password, $user_id);
            
            if ($stmt->execute()) {
                unset($_SESSION['recovery_user_id'], $_SESSION['recovery_email'], $_SESSION['security_question'], $_SESSION['recovery_verified']);
                $success = 'Password reset successfully! You can now log in with your new password.';
                $current_step = 'completed';
            } else {
                $error = 'Password reset failed. Please try again.';
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Recovery</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="auth-container">
        <div id="recovery-page" class="page active">
            <div class="logo">
                <svg class="logo-icon" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            
            <h1 class="auth-title">Account Recovery</h1>
            
            <?php if ($current_step !== 'completed'): ?>
            <p class="recovery-description">Enter your email to recover your account using your security question</p>
            <?php endif; ?>
            
            <?php if ($error): ?>
                <div class="error-message"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            
            <?php if ($success): ?>
                <div class="success-message"><?php echo htmlspecialchars($success); ?></div>
            <?php endif; ?>
            
            <?php if ($current_step === 'completed'): ?>
                <div class="auth-links">
                    <a href="login.php" class="btn-primary" style="text-decoration: none; display: block; text-align: center;">Go to Login</a>
                </div>
            
            <?php elseif ($current_step == 1): ?>
                <form method="POST" action="">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" name="email" class="form-input" required value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>">
                    </div>
                    <input type="hidden" name="recovery_email" value="1">
                    <button type="submit" name="recovery_email" class="btn-primary">Continue</button>
                </form>
            
            <?php elseif ($current_step == 2): ?>
                <form method="POST" action="">
                    <div class="form-group">
                        <label class="form-label">Security Question</label>
                        <div style="color: rgba(255, 255, 255, 0.8); margin-bottom: 12px; font-size: 14px;"><?php echo htmlspecialchars($_SESSION['security_question']); ?></div>
                        <input type="text" name="security_answer" class="form-input" placeholder="Enter your answer" required>
                    </div>
                    <input type="hidden" name="recovery_security" value="1">
                    <button type="submit" name="recovery_security" class="btn-primary">Verify Answer</button>
                </form>
            
            <?php else: ?>
                <form method="POST" action="">
                    <div class="form-group">
                        <label class="form-label">New Password</label>
                        <div class="password-container">
                            <input type="password" name="new_password" class="form-input" id="new-password" required>
                            <button type="button" class="password-toggle" onclick="togglePassword('new-password')"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg></button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm New Password</label>
                        <div class="password-container">
                            <input type="password" name="confirm_password" class="form-input" id="confirm-new-password" required>
                            <button type="button" class="password-toggle" onclick="togglePassword('confirm-new-password')"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg></button>
                        </div>
                    </div>
                    <input type="hidden" name="reset_password">
                    <button type="submit" name="reset_password" class="btn-primary">Reset Password</button>
                </form>
            <?php endif; ?>
            
            <div class="auth-links">
                <a href="login.php" class="auth-link">Back to Login</a>
            </div>
        </div>
    </div>
    
    <script src="auth.js"></script>
</body>
</html>