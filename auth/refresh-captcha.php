<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function generateCaptcha() {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $captcha = '';
    for ($i = 0; $i < 6; $i++) {
        $captcha .= $chars[rand(0, strlen($chars) - 1)];
    }
    $_SESSION['captcha'] = $captcha;
    return $captcha;
}

header('Content-Type: text/plain');
echo generateCaptcha();
?>