<?php
session_start();
require_once 'config/database.php';

// Get current user ID (assuming user is logged in)
$currentUserId = $_SESSION['user_id'] ?? 1; // Default to user 1 for demo

// Handle AJAX requests
if (isset($_POST['action'])) {
    header('Content-Type: application/json');
    
    $database = new Database();
    $conn = $database->getConnection();
    
    if ($_POST['action'] === 'get_servers') {
        $page = (int)($_POST['page'] ?? 1);
        $limit = 12;
        $offset = ($page - 1) * $limit;
        $category = $_POST['category'] ?? 'all';
        $search = $_POST['search'] ?? '';
        $sort = $_POST['sort'] ?? 'newest';
        
        // Build WHERE clause
        $whereClause = "WHERE s.IsPrivate = 0";
        $params = [];
        $types = "";
        
        if ($category !== 'all') {
            $whereClause .= " AND si.Category = ?";
            $params[] = $category;
            $types .= "s";
        }
        
        if (!empty($search)) {
            $whereClause .= " AND (s.Name LIKE ? OR s.Description LIKE ?)";
            $searchParam = "%$search%";
            $params[] = $searchParam;
            $params[] = $searchParam;
            $types .= "ss";
        }
        
        // Build ORDER BY clause
        $orderClause = "";
        switch ($sort) {
            case 'newest':
                $orderClause = "ORDER BY s.ID DESC";
                break;
            case 'oldest':
                $orderClause = "ORDER BY s.ID ASC";
                break;
            case 'most_members':
                $orderClause = "ORDER BY member_count DESC";
                break;
            case 'least_members':
                $orderClause = "ORDER BY member_count ASC";
                break;
            case 'a_to_z':
                $orderClause = "ORDER BY s.Name ASC";
                break;
            case 'z_to_a':
                $orderClause = "ORDER BY s.Name DESC";
                break;
            default:
                $orderClause = "ORDER BY s.ID DESC";
        }
        
        // Get servers with member count
        $query = "SELECT 
                    s.ID,
                    s.Name,
                    s.IconServer,
                    s.Description,
                    s.BannerServer,
                    s.InviteLink,
                    si.Category,
                    si.ExpiresAt,
                    COUNT(usm.UserID) as member_count,
                    CASE WHEN usm_current.UserID IS NOT NULL THEN 1 ELSE 0 END as is_joined
                  FROM Server s
                  LEFT JOIN ServerInfo si ON s.ID = si.ServerID
                  LEFT JOIN UserServerMemberships usm ON s.ID = usm.ServerID
                  LEFT JOIN UserServerMemberships usm_current ON s.ID = usm_current.ServerID AND usm_current.UserID = ?
                  $whereClause
                  GROUP BY s.ID, s.Name, s.IconServer, s.Description, s.BannerServer, s.InviteLink, si.Category, si.ExpiresAt, usm_current.UserID
                  $orderClause
                  LIMIT $limit OFFSET $offset";
        
        // Add current user ID to params
        array_unshift($params, $currentUserId);
        $types = "i" . $types;
        
        $stmt = $conn->prepare($query);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        
        $servers = [];
        while ($row = $result->fetch_assoc()) {
            $servers[] = $row;
        }
        
        echo json_encode(['servers' => $servers]);
        exit();
    }
    
    if ($_POST['action'] === 'get_categories') {
        // Get categories with server counts
        $query = "SELECT 
                    si.Category,
                    COUNT(s.ID) as server_count
                  FROM ServerInfo si
                  LEFT JOIN Server s ON si.ServerID = s.ID
                  WHERE s.IsPrivate = 0
                  GROUP BY si.Category
                  ORDER BY server_count DESC";
        
        $result = $conn->query($query);
        $categories = [];
        $totalServers = 0;
        
        while ($row = $result->fetch_assoc()) {
            $categories[] = $row;
            $totalServers += $row['server_count'];
        }
        
        echo json_encode([
            'categories' => $categories,
            'total_servers' => $totalServers
        ]);
        exit();
    }
    
    if ($_POST['action'] === 'get_server_details') {
        $serverId = (int)$_POST['server_id'];
        
        $query = "SELECT 
                    s.ID,
                    s.Name,
                    s.IconServer,
                    s.Description,
                    s.BannerServer,
                    s.InviteLink,
                    si.Category,
                    COUNT(usm.UserID) as member_count,
                    CASE WHEN usm_current.UserID IS NOT NULL THEN 1 ELSE 0 END as is_joined
                  FROM Server s
                  LEFT JOIN ServerInfo si ON s.ID = si.ServerID
                  LEFT JOIN UserServerMemberships usm ON s.ID = usm.ServerID
                  LEFT JOIN UserServerMemberships usm_current ON s.ID = usm_current.ServerID AND usm_current.UserID = ?
                  WHERE s.ID = ? AND s.IsPrivate = 0
                  GROUP BY s.ID, s.Name, s.IconServer, s.Description, s.BannerServer, s.InviteLink, si.Category, usm_current.UserID";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ii", $currentUserId, $serverId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($server = $result->fetch_assoc()) {
            echo json_encode(['success' => true, 'server' => $server]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Server not found']);
        }
        exit();
    }
    
    if ($_POST['action'] === 'join_server') {
        $serverId = (int)$_POST['server_id'];
        
        // Check if already joined
        $checkQuery = "SELECT ID FROM UserServerMemberships WHERE UserID = ? AND ServerID = ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bind_param("ii", $currentUserId, $serverId);
        $checkStmt->execute();
        
        if ($checkStmt->get_result()->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'You are already a member of this server']);
            exit();
        }
        
        // Join server
        $joinQuery = "INSERT INTO UserServerMemberships (UserID, ServerID, Role) VALUES (?, ?, 'Member')";
        $joinStmt = $conn->prepare($joinQuery);
        $joinStmt->bind_param("ii", $currentUserId, $serverId);
        
        if ($joinStmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Successfully joined the server!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to join server']);
        }
        exit();
    }
    
    if ($_POST['action'] === 'join_by_invite') {
        $inviteCode = trim($_POST['invite_code']);
        
        if (empty($inviteCode)) {
            echo json_encode(['success' => false, 'message' => 'Please enter an invite code']);
            exit();
        }
        
        // Find server by invite link
        $serverQuery = "SELECT s.ID, s.Name FROM Server s WHERE s.InviteLink = ? AND s.IsPrivate = 0";
        $serverStmt = $conn->prepare($serverQuery);
        $serverStmt->bind_param("s", $inviteCode);
        $serverStmt->execute();
        $serverResult = $serverStmt->get_result();
        
        if ($serverResult->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid invite code']);
            exit();
        }
        
        $server = $serverResult->fetch_assoc();
        $serverId = $server['ID'];
        
        // Check if already joined
        $checkQuery = "SELECT ID FROM UserServerMemberships WHERE UserID = ? AND ServerID = ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bind_param("ii", $currentUserId, $serverId);
        $checkStmt->execute();
        
        if ($checkStmt->get_result()->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'You are already a member of this server']);
            exit();
        }
        
        // Join server
        $joinQuery = "INSERT INTO UserServerMemberships (UserID, ServerID, Role) VALUES (?, ?, 'Member')";
        $joinStmt = $conn->prepare($joinQuery);
        $joinStmt->bind_param("ii", $currentUserId, $serverId);
        
        if ($joinStmt->execute()) {
            echo json_encode(['success' => true, 'message' => "Successfully joined {$server['Name']}!"]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to join server']);
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
    <title>Explore Servers - Discord</title>
    <link rel="stylesheet" href="assets/css/user-explore.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
    <div class="app-container">
        <!-- Left Sidebar -->
        <div class="left-sidebar">
            <!-- User Avatar -->
            <div class="user-avatar-container">
                <div class="user-avatar">
                    <img src="/placeholder.svg?height=32&width=32" alt="User Avatar">
                </div>
            </div>
            
            <!-- Server List Icons -->
            <div class="server-list">
                <div class="server-icon home-icon">
                    <span>🏠</span>
                </div>
                <div class="server-separator"></div>
                <div class="server-icon add-server" onclick="showJoinServerModal()">
                    <span>+</span>
                </div>
                <div class="server-icon explore-icon active">
                    <span>🧭</span>
                </div>
                <div class="server-separator"></div>
                <div class="server-icon">
                    <span>🎮</span>
                </div>
                <div class="server-icon">
                    <span>🎵</span>
                </div>
            </div>
            
            <!-- Bottom Icons -->
            <div class="bottom-icons">
                <div class="bottom-icon">
                    <span>🎧</span>
                </div>
                <div class="bottom-icon">
                    <span>🔇</span>
                </div>
                <div class="bottom-icon">
                    <span>⚙️</span>
                </div>
            </div>
        </div>

        <!-- Categories Sidebar -->
        <div class="categories-sidebar">
            <div class="categories-header">
                <h3>CATEGORIES</h3>
            </div>
            
            <div class="categories-list" id="categoriesList">
                <div class="category-item active" data-category="all">
                    <div class="category-icon">🌐</div>
                    <span class="category-name">All Servers</span>
                    <span class="category-count" id="totalCount">0</span>
                </div>
                <!-- Categories will be loaded dynamically -->
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <div class="content-header">
                <h1>Explore Servers</h1>
                <p class="subtitle">Discover amazing communities, connect with like-minded people, and find your perfect server</p>
                
                <div class="search-controls">
                    <div class="search-container">
                        <input type="text" id="searchInput" class="search-input" placeholder="Search for communities...">
                        <div class="search-icon">🔍</div>
                    </div>
                    
                    <div class="sort-container">
                        <button class="sort-btn" id="sortBtn">
                            <span class="sort-icon">⚡</span>
                            <span class="sort-text">Sort</span>
                        </button>
                        
                        <div class="sort-dropdown" id="sortDropdown">
                            <div class="sort-option" data-sort="newest">
                                <span class="sort-option-icon">📅</span>
                                <span>Newest First</span>
                            </div>
                            <div class="sort-option" data-sort="oldest">
                                <span class="sort-option-icon">📅</span>
                                <span>Oldest First</span>
                            </div>
                            <div class="sort-option" data-sort="most_members">
                                <span class="sort-option-icon">👥</span>
                                <span>Most Members</span>
                            </div>
                            <div class="sort-option" data-sort="least_members">
                                <span class="sort-option-icon">👤</span>
                                <span>Least Members</span>
                            </div>
                            <div class="sort-option active" data-sort="a_to_z">
                                <span class="sort-option-icon">🔤</span>
                                <span>A to Z</span>
                            </div>
                            <div class="sort-option" data-sort="z_to_a">
                                <span class="sort-option-icon">🔠</span>
                                <span>Z to A</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="discover-section">
                <div class="section-header">
                    <h2>Discover Communities</h2>
                    <span class="server-count" id="serverCount">0 servers available</span>
                </div>
                
                <div class="servers-grid" id="serversGrid">
                    <!-- Servers will be loaded dynamically -->
                </div>
                
                <div class="loading-indicator" id="loadingIndicator">
                    <div class="loading-spinner"></div>
                    <span>Loading more servers...</span>
                </div>
                
                <div class="no-more-servers" id="noMoreServers" style="display: none;">
                    <span>No more servers to load</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Server Detail Modal -->
    <div id="serverDetailModal" class="modal">
        <div class="modal-content server-detail-modal">
            <button class="modal-close">&times;</button>
            <div class="server-banner" id="serverBanner">
                <img src="/placeholder.svg?height=120&width=600" alt="Server Banner">
            </div>
            <div class="server-info">
                <div class="server-avatar" id="serverAvatar">
                    <img src="/placeholder.svg?height=80&width=80" alt="Server Avatar">
                </div>
                <div class="server-details">
                    <h3 class="server-name" id="serverName">kittens</h3>
                    <div class="server-members">
                        <span class="members-icon">👥</span>
                        <span id="serverMemberCount">2 members</span>
                    </div>
                </div>
            </div>
            
            <div class="server-description-section">
                <h4>ℹ️ About this server</h4>
                <p id="serverDescription">ww</p>
            </div>
            
            <button class="join-server-btn" id="joinServerBtn">
                <span class="btn-icon">+</span>
                <span class="btn-text">JOIN SERVER</span>
            </button>
            
            <button class="joined-btn" id="joinedBtn" style="display: none;">
                <span class="btn-icon">✓</span>
                <span class="btn-text">JOINED</span>
            </button>
        </div>
    </div>

    <!-- Join Server Modal -->
    <div id="joinServerModal" class="modal">
        <div class="modal-content join-server-modal">
            <div class="modal-header">
                <h3>Join Server</h3>
                <button class="modal-close">&times;</button>
            </div>
            
            <div class="invite-input-container">
                <input type="text" id="inviteCodeInput" class="invite-input" placeholder="Enter invite code...">
                <button class="invite-submit-btn" id="inviteSubmitBtn">
                    <span class="btn-icon">→</span>
                </button>
            </div>
            
            <p class="invite-help">Enter a server invite code to join</p>
        </div>
    </div>

    <!-- Toast Container -->
    <div id="toastContainer" class="toast-container"></div>

    <script src="assets/js/user-explore.js"></script>
</body>
</html>
