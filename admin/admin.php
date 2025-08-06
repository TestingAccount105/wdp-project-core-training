<?php
session_start();
require_once 'function.php';

// Simple authentication check
// if (!isset($_SESSION['admin_logged_in'])) {
//     header('Location: login.php');
//     exit();
// }

$stats = new AdminStats();
$totalUsers = $stats->getTotalUsers();
$onlineUsers = $stats->getOnlineUsers();
$newUsers = $stats->getNewUsers();
$totalServers = $stats->getTotalServers();
$totalMessages = $stats->getTotalMessages();
$todayMessages = $stats->getTodayMessages();
$channelStats = $stats->getChannelStats();
$serverStats = $stats->getServerStats();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MisVord Admin Dashboard</title>
    <link rel="stylesheet" href="admin.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="admin-container">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-header">
                <h2>Admin Dashboard</h2>
                <div style="font-size: 12px; color: #888; margin-top: 4px;">Admin</div>
            </div>
            <nav class="sidebar-nav">
                <div class="nav-section">
                    <div class="nav-section-title">Dashboard</div>
                    <a href="#" class="nav-item active">
                        <span class="nav-text">Overview</span>
                    </a>
                    <a href="users.php" class="nav-item">
                        <span class="nav-text">Users</span>
                    </a>
                    <a href="servers.php" class="nav-item">
                        <span class="nav-text">Servers</span>
                    </a>
                    <a href="nitro.php" class="nav-item">
                        <span class="nav-text">Nitro Codes</span>
                    </a>
                </div>
                
                <a href="logout.php" class="nav-item logout">
                    <span class="nav-icon">🚪</span>
                    <span class="nav-text">Log Out</span>
                </a>
            </nav>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <div class="content-header">
                <h1>System Overview</h1>
                <p>System statistics and information</p>
            </div>

            <!-- Statistics Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon user-icon">👥</div>
                    <div class="stat-content">
                        <h3>Users</h3>
                        <p class="stat-label">Total Users</p>
                        <p class="stat-value"><?php echo $totalUsers; ?></p>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon online-icon">🟢</div>
                    <div class="stat-content">
                        <h3>Online Users</h3>
                        <p class="stat-label">Online Users</p>
                        <p class="stat-value online-value"><?php echo $onlineUsers; ?></p>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon new-user-icon">👤</div>
                    <div class="stat-content">
                        <h3>New Users</h3>
                        <p class="stat-label">New (7 days)</p>
                        <p class="stat-value new-user-value"><?php echo $newUsers; ?></p>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon server-icon">🖥️</div>
                    <div class="stat-content">
                        <h3>Servers</h3>
                        <p class="stat-label">Total Servers</p>
                        <p class="stat-value"><?php echo $totalServers; ?></p>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon message-icon">💬</div>
                    <div class="stat-content">
                        <h3>Total Messages</h3>
                        <p class="stat-label">Total Messages</p>
                        <p class="stat-value"><?php echo $totalMessages; ?></p>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon today-icon">⏰</div>
                    <div class="stat-content">
                        <h3>Today's Messages</h3>
                        <p class="stat-label">Today</p>
                        <p class="stat-value today-value"><?php echo $todayMessages; ?></p>
                    </div>
                </div>
            </div>

            <!-- Activity & Growth Section -->
            <div class="activity-section">
                <h2>Activity & Growth</h2>
                
                <div class="charts-grid">
                    <div class="chart-container">
                        <h3>Channel Statistics</h3>
                        <canvas id="channelChart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <h3>Message Statistics</h3>
                        <canvas id="messageChart"></canvas>
                    </div>
                    
                    <div class="chart-container full-width">
                        <h3>Server Statistics</h3>
                        <canvas id="serverChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="admin.js"></script>
    <script src="chart.js"></script>
    <script>
        // Chart data is now loaded asynchronously through chart.js
        // with skeleton loading for better user experience
    </script>
</body>
</html>