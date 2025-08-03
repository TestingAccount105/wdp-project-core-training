<?php
session_start();

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/google-config.php';

$error = '';
$success = '';
$current_step = 1;
$show_step_2 = false;
$registration_complete = false;

// Check if we should show step 2 based on session data FIRST
if (isset($_SESSION['register_data'])) {
    $show_step_2 = true;
    $current_step = 2;
}

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    var_dump($_POST);
    $database = new Database();
    $db = $database->getConnection();
    echo "Success";
    // Registration Step 1 Handler
    if (isset($_POST['register_step1'])) {
        $username = trim($_POST['username']);
        $email = trim($_POST['email']);
        $password = $_POST['password'];
        $confirm_password = $_POST['confirm_password'];
        
        if (empty($username) || empty($email) || empty($password) || empty($confirm_password)) {
            $error = 'All fields are required.';
        } elseif ($password !== $confirm_password) {
            $error = 'Passwords do not match.';
        } elseif (strlen($password) < 6) {
            $error = 'Password must be at least 6 characters long.';
        } else {
            $query = "SELECT ID FROM Users WHERE Username = ? OR Email = ?";
            $stmt = $db->prepare($query);
            $stmt->bind_param('ss', $username, $email);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->fetch_assoc()) {
                $error = 'Username or email already exists.';
            } else {
                // Store registration data in session for step 2
                $_SESSION['register_data'] = [
                    'username' => $username,
                    'email' => $email,
                    'password' => $password
                ];
                $success = 'Step 1 completed! Please set up your security question.';
                $show_step_2 = true;
                $current_step = 2;
            }
        }
    }
    
    // Registration Step 2 Handler (Security Question)
    elseif (isset($_POST['register_step2'])) {
        $security_question = $_POST['security_question'];
        $security_answer = trim($_POST['security_answer']);
        $captcha = $_POST['captcha'];
        $session_captcha = $_SESSION['captcha'] ?? '';
        
        if (empty($security_question) || empty($security_answer) || empty($captcha)) {
            $error = 'All fields are required.';
            $show_step_2 = true;
            $current_step = 2;
        } elseif (strtoupper($captcha) !== $session_captcha) {
            $error = 'Invalid verification code.';
            $show_step_2 = true;
            $current_step = 2;
        } elseif (!isset($_SESSION['register_data'])) {
            $error = 'Session expired. Please start registration again.';
            unset($_SESSION['register_data']);
            $current_step = 1;
        } else {
            $register_data = $_SESSION['register_data'];
            
            $id = time() . rand(1000, 9999);
            $discriminator = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $hashed_password = password_hash($register_data['password'], PASSWORD_DEFAULT);
            $hashed_security_answer = password_hash($security_answer, PASSWORD_DEFAULT);
            
            $query = "INSERT INTO Users (ID, Username, Email, Password, Status, Discriminator, SecurityQuestion, SecurityAnswer) VALUES (?, ?, ?, ?, 'active', ?, ?, ?)";
            $stmt = $db->prepare($query);
            $stmt->bind_param('sssssss', $id, $register_data['username'], $register_data['email'], $hashed_password, $discriminator, $security_question, $hashed_security_answer);
            
            if ($stmt->execute()) {
                unset($_SESSION['register_data']);
                $success = 'Account created successfully! You can now log in.';
                $registration_complete = true;
            } else {
                $error = 'Registration failed. Please try again.';
                $show_step_2 = true;
                $current_step = 2;
            }
        }
    }
    
    // Clear registration data
    elseif (isset($_POST['clear_registration'])) {
        unset($_SESSION['register_data']);
        echo 'cleared';
        exit();
    }
    else{
        echo "Hei";
    }
}

// Check if we should show step 2 based on session data (for page refresh)
// This is already handled above, so we can remove this duplicate check

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
    <title>Register - Create Account</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="auth-container">
        <div id="register-page" class="page active">
            <div class="logo">
                <svg class="logo-icon" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            
            <h1 class="auth-title">Create an account</h1>
            
            <?php if (!$registration_complete): ?>
            <div class="step-indicator">
                <div class="step <?php echo ($current_step == 1) ? 'active' : 'completed'; ?>">1</div>
                <div class="step <?php echo ($current_step == 2 || $show_step_2) ? 'active' : 'inactive'; ?>">2</div>
            </div>
            <?php endif; ?>
            
            <?php if ($error): ?>
                <div class="error-message"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            
            <?php if ($success): ?>
                <div class="success-message"><?php echo htmlspecialchars($success); ?></div>
            <?php endif; ?>
            
            <?php if ($registration_complete): ?>
                <div class="auth-links">
                    <a href="login.php" class="btn-primary" style="text-decoration: none; display: block; text-align: center;">Go to Login</a>
                </div>
            
            <?php elseif (!$show_step_2 && $current_step == 1): ?>
                <!-- STEP 1: Basic Information -->
                <form method="post" action="" id="register-form">
                    <div class="form-group">
                        <label class="form-label">Username</label>
                        <input type="text" name="username" class="form-input" required value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" name="email" class="form-input" required value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <div class="password-container">
                           <input type="password" name="password" class="form-input" id="register-password" required>
                           <button type="button" class="password-toggle" onclick="togglePassword('register-password')"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg></button>
                        </div>
                        <div class="password-strength" id="password-strength"><div class="strength-bar" id="strength-bar"></div></div>
                        <div class="strength-text" id="strength-text">0%</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm Password</label>
                        <div class="password-container">
                            <input type="password" name="confirm_password" class="form-input" id="confirm-password" required>
                            <button type="button" class="password-toggle" onclick="togglePassword('confirm-password')"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg></button>
                        </div>
                    </div>
                    <input type="hidden" name="register_step1" value="1">
                    <button type="submit" name="register_step1" class="btn-primary">Next Step →</button>
                </form>
                <div class="divider"><span>OR</span></div>
                <a href="google-login.php" class="btn-google"><svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Sign up with Google</a>
                <div class="auth-links">
                    <span style="color: rgba(255, 255, 255, 0.5);">Already have an account?</span>
                    <a href="login.php" class="auth-link">Log In</a>
                </div>
            
            <?php else: ?>
                <!-- STEP 2: Security Question -->
                <p class="security-description">Set up a security question to help recover your account if you forget your password.</p>
                <form method="POST" action="" id="register-step2-form">
                    <div class="form-group">
                        <label class="form-label">Security Question</label>
                        <select name="security_question" class="form-input" required>
                            <option value="">-- Select a security question --</option>
                            <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                            <option value="In what city were you born?">In what city were you born?</option>
                            <option value="What was the name of your first school?">What was the name of your first school?</option>
                            <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                            <option value="What was your childhood nickname?">What was your childhood nickname?</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Security Answer</label>
                        <input type="text" name="security_answer" class="form-input" placeholder="Answer to your security question" required>
                        <small style="color: rgba(255, 255, 255, 0.6); font-size: 12px;">Used for account recovery if you forget your password</small>
                    </div>
                    <div class="captcha-section">
                        <!-- T -->
                        <div class="form-group">
                            <label class="form-label">Verification</label>
                            <div class="captcha-container">
                                <span class="captcha-text" id="captcha-text-register"><?php echo $captcha; ?></span>
                                <button type="button" class="captcha-refresh" onclick="refreshCaptcha()"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></button>
                            </div>
                            <input type="text" name="captcha" class="form-input captcha-input" placeholder="Enter the code above" required>
                        </div>
                    </div>
                    <input type="hidden" name="register_step2" value="1">
                    <div class="form-actions">
                        <button type="button" class="btn-back" onclick="clearRegistrationData()">← Back</button>
                        <button type="submit" name="register_step2" class="btn-primary">Register →</button>
                    </div>
                </form>
            <?php endif; ?>
        </div>
    </div>
    
    <script src="auth.js"></script>
    <script>
        function clearRegistrationData() {
            fetch('register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'clear_registration=1'
            }).then(() => {
                window.location.href = 'register.php';
            });
        }
    </script>
</body>
</html>