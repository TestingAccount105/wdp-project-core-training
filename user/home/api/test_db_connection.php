<?php
header('Content-Type: application/json');

try {
    require_once 'config.php';
    
    // Test basic database connection
    if ($mysqli->ping()) {
        echo json_encode(['status' => 'success', 'message' => 'Database connection is working']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Database ping failed']);
    }
    
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
