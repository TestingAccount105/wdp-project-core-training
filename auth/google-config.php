<?php
// Google OAuth Configuration
define('GOOGLE_CLIENT_ID', 'your-google-client-id.googleusercontent.com');
define('GOOGLE_CLIENT_SECRET', 'your-google-client-secret');
define('GOOGLE_REDIRECT_URI', 'http://localhost/auth-website/auth/google-callback.php');

// Site Configuration
define('SITE_URL', 'http://localhost/auth-website');
define('SITE_NAME', 'Auth System');

// Session Configuration - only start if not already active
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_lifetime', 86400); // 24 hours
    session_start();
}
?>