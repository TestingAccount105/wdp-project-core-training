<?php
session_start();

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/google-config.php';

$error = '';
$success = '';

// Handle URL parameters for messages
if (isset($_GET['error'])) {
    switch ($_GET['error']) {
        case 'account_banned':
            $error = 'Your account has been banned. Please contact support.';
            break;
        case 'google_auth_failed':
            $error = 'Google authentication failed. Please try again.';
            break;
        default:
            $error = 'An error occurred. Please try again.';
    }
}

if (isset($_GET['message'])) {
    switch ($_GET['message']) {
        case 'logged_out':
            $success = 'You have been logged out successfully.';
            break;
    }
}

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $database = new Database();
    $db = $database->getConnection();
    
    // Login Handler
    if (isset($_POST['login'])) {
        $email = trim($_POST['email']);
        $password = $_POST['password'];
        $captcha = $_POST['captcha'];
        $session_captcha = $_SESSION['captcha'] ?? '';
        
        if (empty($email) || empty($password) || empty($captcha)) {
            $error = 'All fields are required.';
        } elseif (strtoupper($captcha) !== $session_captcha) {
            $error = 'Invalid verification code.';
        } else {
            $query = "SELECT ID, Username, Email, Password, Status FROM Users WHERE Email = ?";
            $stmt = $db->prepare($query);
            $stmt->bind_param('s', $email);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            
            if ($user) {
                if ($user['Status'] === 'banned') {
                    $error = 'Your account has been banned. Please contact support.';
                } elseif (password_verify($password, $user['Password'])) {
                    $_SESSION['user_id'] = $user['ID'];
                    $_SESSION['username'] = $user['Username'];
                    $_SESSION['email'] = $user['Email'];
                    header('Location: ../user/nitro/nitro.php');
                    exit();
                } else {
                    $error = 'Invalid email or password.';
                }
            } else {
                // Check for admin credentials
                if ($email === 'admin@admin.com' && $password === 'admin123') {
                    $_SESSION['user_id'] = 'admin';
                    $_SESSION['username'] = 'Admin';
                    $_SESSION['email'] = 'admin@admin.com';
                    $_SESSION['is_admin'] = true;
                    header('Location: ../admin/admin.php');
                    exit();
                } else {
                    $error = 'Invalid email or password.';
                }
            }
        }
    }
}

// Generate CAPTCHA
function generateCaptcha() {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $captcha = '';
    for ($i = 0; $i < 6; $i++) {
        $captcha .= $chars[rand(0, strlen($chars) - 1)];
    }
    $_SESSION['captcha'] = $captcha;
    return $captcha;
}

$captcha = generateCaptcha();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Page</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="auth-container">
        <div id="login-page" class="page active">
            <div class="logo">
                <svg class="logo-icon" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            
            <h1 class="auth-title">Welcome back!</h1>
            
            <?php if ($error): ?>
                <div class="error-message"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            
            <?php if ($success): ?>
                <div class="success-message"><?php echo htmlspecialchars($success); ?></div>
            <?php endif; ?>
            
            <form method="post" action="" id="login-form">
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" name="email" class="form-input" required value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <div class="password-container">
                        <input type="password" name="password" class="form-input" id="login-password" required>
                        <button type="button" class="password-toggle" onclick="togglePassword('login-password')"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg></button>
                    </div>
                </div>
                
                <a href="recovery.php" class="forgot-link">Forgot your password?</a>
                
                <div class="form-group">
                    <label class="form-label">Verification</label>
                    <div class="captcha-container">
                        <span class="captcha-text" id="captcha-text"><?php echo $captcha; ?></span>
                        <button type="button" class="captcha-refresh" onclick="refreshCaptcha()"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></button>
                    </div>
                    <input type="text" name="captcha" class="form-input captcha-input" placeholder="Enter the code above" required>
                </div>

                <input type="hidden" name="login" value="1">
                
                <button type="submit" name="login" class="btn-primary">Log In</button>
            </form>
            
            <div class="divider"><span>OR</span></div>
            <a href="google-login.php" class="btn-google">
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
            </a>
            
            <div class="auth-links">
                <span style="color: rgba(255, 255, 255, 0.5);">Need an account?</span>
                <a href="register.php" class="auth-link">Register</a>
            </div>
        </div>
    </div>
    
    <script src="auth.js"></script>
</body>
</html>