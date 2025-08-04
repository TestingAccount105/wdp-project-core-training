<?php
ini_set('display_errors', 0);
header('Content-Type: application/json');
echo json_encode(['test' => 'success', 'time' => date('Y-m-d H:i:s')]);
?>
