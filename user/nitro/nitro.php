<?php
session_start();
require_once 'database.php';

// Check if user is logged in (assuming you have user sessions)
$userId = $_SESSION['user_id'] ?? null;
$userHasNitro = false;

if ($userId) {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Check if user already has Nitro
    $query = "SELECT COUNT(*) as nitro_count FROM Nitro WHERE UserID = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $userHasNitro = $result->fetch_assoc()['nitro_count'] > 0;
}

// Handle AJAX requests
if (isset($_POST['action'])) {
    header('Content-Type: application/json');
    
    if ($_POST['action'] === 'redeem_code') {
        $code = trim($_POST['code'] ?? '');
        $userId = $_SESSION['user_id'] ?? null;
        
        if (!$userId) {
            echo json_encode(['success' => false, 'message' => 'Please log in to redeem a code']);
            exit();
        }
        
        if (empty($code)) {
            echo json_encode(['success' => false, 'message' => 'Please enter a valid code']);
            exit();
        }
        
        $database = new Database();
        $conn = $database->getConnection();
        
        // Check if user already has Nitro
        $checkQuery = "SELECT COUNT(*) as nitro_count FROM Nitro WHERE UserID = ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bind_param("i", $userId);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->fetch_assoc()['nitro_count'] > 0) {
            echo json_encode(['success' => false, 'message' => 'You already have an active Nitro subscription']);
            exit();
        }
        
        // Check if code exists and is available
        $query = "SELECT ID FROM Nitro WHERE Code = ? AND UserID IS NULL";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("s", $code);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid or already used code']);
            exit();
        }
        
        $nitroId = $result->fetch_assoc()['ID'];
        
        // Assign code to user
        $updateQuery = "UPDATE Nitro SET UserID = ? WHERE ID = ?";
        $updateStmt = $conn->prepare($updateQuery);
        $updateStmt->bind_param("ii", $userId, $nitroId);
        
        if ($updateStmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Nitro code redeemed successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'EEFailed to redeem code. Please try again2.']);
        }
        exit();
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Get more with Nitro - MisVord</title>
    <link rel="stylesheet" href="nitro.css">
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
    <div class="nitro-container">
        <!-- Header -->
        <div class="header">
            <button class="back-btn" onclick="history.back()">
                <span class="back-icon">←</span>
                Back
            </button>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <div class="hero-section">
                <h1 class="main-title">Get more with Nitro</h1>
                <p class="subtitle">
                    Unlock perks to make your Discord experience even better - bigger file uploads, HD video, custom profiles, and more!
                </p>
            </div>

            <!-- Cards Section -->
            <div class="cards-section">
                <!-- Nitro Subscription Card -->
                <div class="nitro-card">
                    <div class="card-header">
                        <div class="nitro-icon">💎</div>
                        <div class="nitro-info">
                            <h3>Nitro</h3>
                            <p class="price">$9.99/month</p>
                        </div>
                    </div>

                    <div class="features-list">
                        <div class="feature-item">
                            <span class="check-icon">✓</span>
                            <span class="feature-text">500MB uploads <span class="upgrade-text">(up from 8MB)</span></span>
                        </div>
                        <div class="feature-item">
                            <span class="check-icon">✓</span>
                            <span class="feature-text">4K 60fps HD video streaming</span>
                        </div>
                        <div class="feature-item">
                            <span class="check-icon">✓</span>
                            <span class="feature-text">Custom profiles and animated banners</span>
                        </div>
                        <div class="feature-item">
                            <span class="check-icon">✓</span>
                            <span class="feature-text">2 Server Boosts + 30% off extra Boosts</span>
                        </div>
                        <div class="feature-item">
                            <span class="check-icon">✓</span>
                            <span class="feature-text">Longer messages (up to 4,000 characters)</span>
                        </div>
                        <div class="feature-item">
                            <span class="check-icon">✓</span>
                            <span class="feature-text">Custom emoji anywhere</span>
                        </div>
                        <div class="feature-item">
                            <span class="check-icon">✓</span>
                            <span class="feature-text">Custom server profiles</span>
                        </div>
                    </div>

                    <button class="subscribe-btn" onclick="showSubscriptionModal()">
                        <span class="btn-icon">💳</span>
                        Subscribe
                    </button>
                </div>

                <!-- Gift Redemption Card -->
                <div class="gift-card">
                    <div class="gift-icon">🎁</div>
                    <h3>Got a gift?</h3>
                    <p class="gift-subtitle">Redeem your Nitro code below</p>
                    
                    <div class="code-input-container">
                        <input type="text" id="nitroCode" class="code-input" placeholder="XXXX-XXXX-XXXX-XXXX" maxlength="16">
                        <span class="gift-input-icon">🎁</span>
                    </div>
                    
                    <button class="redeem-btn" id="redeemBtn">
                        <span class="btn-icon">⚪</span>
                        Redeem Code
                    </button>
                    
                    <p class="redeem-help">Enter a valid code to unlock all Nitro benefits</p>
                </div>
            </div>

            <!-- Perks Section -->
            <div class="perks-section">
                <div class="perks-column">
                    <h2>Nitro Perks</h2>
                    
                    <div class="perk-item">
                        <div class="perk-icon">📤</div>
                        <div class="perk-content">
                            <h4>Bigger uploads</h4>
                            <p>Share files up to 500MB with Nitro</p>
                        </div>
                    </div>
                    
                    <div class="perk-item">
                        <div class="perk-icon">📹</div>
                        <div class="perk-content">
                            <h4>HD video streaming</h4>
                            <p>Stream in 1080p 60fps or 4K 60fps</p>
                        </div>
                    </div>
                    
                    <div class="perk-item">
                        <div class="perk-icon">😀</div>
                        <div class="perk-content">
                            <h4>Custom emoji anywhere</h4>
                            <p>Use custom emoji from any server</p>
                        </div>
                    </div>
                    
                    <div class="perk-item">
                        <div class="perk-icon">👤</div>
                        <div class="perk-content">
                            <h4>Personalize your profile</h4>
                            <p>Use an animated avatar and profile banner</p>
                        </div>
                    </div>
                </div>

                <div class="boosts-column">
                    <h2>Server Boosts Included</h2>
                    
                    <div class="boost-card">
                        <div class="boost-header">
                            <div class="boost-icon">🚀</div>
                            <div class="boost-info">
                                <h4>2 Server Boosts</h4>
                                <p>Help your favorite servers unlock perks</p>
                            </div>
                        </div>
                        
                        <div class="boost-features">
                            <div class="boost-feature-row">
                                <div class="boost-feature">
                                    <span class="check-icon">✓</span>
                                    <span>Better audio quality</span>
                                </div>
                                <div class="boost-feature">
                                    <span class="check-icon">✓</span>
                                    <span>More emoji slots</span>
                                </div>
                            </div>
                            <div class="boost-feature-row">
                                <div class="boost-feature">
                                    <span class="check-icon">✓</span>
                                    <span>Bigger upload limit</span>
                                </div>
                                <div class="boost-feature">
                                    <span class="check-icon">✓</span>
                                    <span>HD streaming</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="extra-boosts">
                        <span class="discount-icon">💎</span>
                        <span>Get 30% off additional Server Boosts</span>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p>Questions? Check out our support articles or contact us.</p>
                <div class="footer-links">
                    <a href="#" class="footer-link">📚 Support</a>
                    <a href="#" class="footer-link">📋 Terms</a>
                    <a href="#" class="footer-link">🔒 Privacy</a>
                </div>
            </div>
        </div>
    </div>

    <!-- Success Modal -->
    <div id="successModal" class="modal">
        <div class="modal-content success-modal">
            <div class="success-icon">✓</div>
            <h3>Welcome to Nitro!</h3>
            <p>Your Nitro subscription has been activated! Enjoy all the perks!</p>
            <button class="awesome-btn" onclick="closeSuccessModal()">Awesome!</button>
        </div>
    </div>

    <!-- Subscription Modal -->
    <div id="subscriptionModal" class="modal">
        <div class="modal-content subscription-modal">
            <div class="modal-header">
                <h3>Confirm Subscription</h3>
                <button class="modal-close" onclick="closeSubscriptionModal()">&times;</button>
            </div>
            
            <div class="subscription-details">
                <div class="detail-row">
                    <span>Plan</span>
                    <span>Nitro Premium</span>
                </div>
                <div class="detail-row">
                    <span>Price</span>
                    <span>$9.99/month</span>
                </div>
            </div>
            
            <div class="payment-buttons">
                <button class="payment-btn card-btn">
                    <span class="payment-icon">💳</span>
                    Pay with Card
                </button>
                <button class="payment-btn paypal-btn">
                    <span class="payment-icon">🅿️</span>
                    PayPal
                </button>
            </div>
            
            <p class="terms-text">By subscribing, you agree to our Terms of Service</p>
        </div>
    </div>

    <!-- Toast Container -->
    <div id="toastContainer" class="toast-container"></div>

    <script src="nitro.js"></script>
</body>
</html>