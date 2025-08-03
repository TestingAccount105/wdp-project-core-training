<?php
require_once __DIR__ . '/google-config.php';

// Build Google OAuth URL
$params = array(
    'client_id' => GOOGLE_CLIENT_ID,
    'redirect_uri' => GOOGLE_REDIRECT_URI,
    'scope' => 'email profile',
    'response_type' => 'code',
    'access_type' => 'online',
    'prompt' => 'select_account'
);

$google_url = 'https://accounts.google.com/o/oauth2/auth?' . http_build_query($params);

header('Location: ' . $google_url);
exit();
?>