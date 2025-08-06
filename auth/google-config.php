<?php
// Google OAuth Configuration
define('GOOGLE_CLIENT_ID', '320087490425-8e76330k5fqm5i6rrovaqj5i99ih9i29.apps.googleusercontent.com');
define('GOOGLE_CLIENT_SECRET', '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');
define('GOOGLE_REDIRECT_URI', 'http://localhost:8010/auth/google-callback.php');

// Site Configuration
define('SITE_URL', 'http://localhost:8010/auth');
define('SITE_NAME', 'Auth System');

// Session Configuration - only start if not already active
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_lifetime', 86400); // 24 hours
    session_start();
}
?>