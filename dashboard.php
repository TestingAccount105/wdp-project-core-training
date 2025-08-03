<?php
require_once '../auth/database.php';
require_once '../auth/google-config.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: ../index.php');
    exit();
}

$database = new Database();
$db = $database->getConnection();

// Get user details
$query = "SELECT * FROM Users WHERE ID = ?";
$stmt = $db->prepare($query);
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    session_destroy();
    header('Location: ../index.php');
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - <?php echo SITE_NAME; ?></title>
    <link rel="stylesheet" href="../auth/style.css">
    <style>
        .dashboard-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .welcome-card {
            background: rgba(55, 65, 81, 0.95);
            backdrop-filter: blur(15px);
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
            margin-bottom: 30px;
        }
        
        .user-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: bold;
            color: white;
        }
        
        .user-info {
            color: #ffffff;
            margin-bottom: 30px;
        }
        
        .user-info h2 {
            font-size: 28px;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .user-info p {
            color: rgba(255, 255, 255, 0.7);
            font-size: 16px;
            margin-bottom: 4px;
        }
        
        .user-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .stat-label {
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .stat-value {
            color: #6366f1;
            font-size: 24px;
            font-weight: 600;
        }
        
        .logout-btn {
            background: #ef4444;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .logout-btn:hover {
            background: #dc2626;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }
        
        .action-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            padding: 12px 24px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-1px);
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <div class="welcome-card">
            <div class="logo">
                <svg class="logo-icon" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
            </div>
            
            <div class="user-avatar">
                <?php if ($user['ProfilePictureUrl']): ?>
                    <img src="<?php echo htmlspecialchars($user['ProfilePictureUrl']); ?>" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                <?php else: ?>
                    <?php echo strtoupper(substr($user['Username'], 0, 1)); ?>
                <?php endif; ?>
            </div>
            
            <div class="user-info">
                <h2>Welcome, <?php echo htmlspecialchars($user['DisplayName'] ?: $user['Username']); ?>!</h2>
                <p><?php echo htmlspecialchars($user['Email']); ?></p>
                <?php if ($user['Discriminator']): ?>
                    <p style="font-size: 14px; color: rgba(255, 255, 255, 0.5);">
                        #<?php echo htmlspecialchars($user['Discriminator']); ?>
                    </p>
                <?php endif; ?>
                <?php if ($user['Bio']): ?>
                    <p style="font-style: italic; margin-top: 10px;">
                        "<?php echo htmlspecialchars($user['Bio']); ?>"
                    </p>
                <?php endif; ?>
            </div>
            
            <div class="user-stats">
                <div class="stat-card">
                    <div class="stat-label">Account Status</div>
                    <div class="stat-value" style="color: <?php echo $user['Status'] === 'active' ? '#22c55e' : '#ef4444'; ?>">
                        <?php echo ucfirst($user['Status']); ?>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-label">Login Method</div>
                    <div class="stat-value">
                        <?php echo $user['GoogleID'] ? 'Google OAuth' : 'Email/Password'; ?>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-label">Security Question</div>
                    <div class="stat-value" style="color: <?php echo $user['SecurityQuestion'] ? '#22c55e' : '#f59e0b'; ?>">
                        <?php echo $user['SecurityQuestion'] ? 'Set' : 'Not Set'; ?>
                    </div>
                </div>
            </div>
            
            <div class="action-buttons">
                <a href="profile.php" class="btn-secondary">Edit Profile</a>
                <a href="security.php" class="btn-secondary">Security Settings</a>
                <a href="auth/logout.php" class="logout-btn">Logout</a>
            </div>
        </div>
    </div>
</body>
</html>