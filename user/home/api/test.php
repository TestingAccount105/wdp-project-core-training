<?php
// Simple test script to debug the 500 error
header('Content-Type: application/json');

try {
    // Test 1: Basic PHP functionality
    echo json_encode(['step' => 1, 'message' => 'PHP is working']);
    
    // Test 2: Include config
    require_once 'config.php';
    echo json_encode(['step' => 2, 'message' => 'Config loaded successfully']);
    
    // Test 3: Test database connection
    if ($mysqli->ping()) {
        echo json_encode(['step' => 3, 'message' => 'Database connection is active']);
    } else {
        echo json_encode(['step' => 3, 'error' => 'Database connection failed']);
    }
    
    // Test 4: Test session functionality
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    echo json_encode(['step' => 4, 'message' => 'Session started successfully']);
    
    // Test 5: Test basic query
    $result = $mysqli->query("SELECT 1 as test");
    if ($result) {
        $row = $result->fetch_assoc();
        echo json_encode(['step' => 5, 'message' => 'Basic query works', 'result' => $row]);
    } else {
        echo json_encode(['step' => 5, 'error' => 'Query failed: ' . $mysqli->error]);
    }
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
}
?>
