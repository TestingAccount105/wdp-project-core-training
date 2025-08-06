<?php
session_start();
require_once 'database.php';

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
        $sort = $_POST['sort'] ?? 'a_to_z';
        
        // Build WHERE clause
        $whereClause = "WHERE s.IsPrivate = 0";
        $params = [$currentUserId];
        $types = "i";
        
        // Fix search functionality
        if (!empty($search)) {
            $whereClause .= " AND (s.Name LIKE ? OR s.Description LIKE ?)";
            $searchParam = "%$search%";
            $params[] = $searchParam;
            $params[] = $searchParam;
            $types .= "ss";
        }
        
        // Fix category filtering - now using actual Category column
        if ($category !== 'all' && !empty($category)) {
            $whereClause .= " AND s.Category = ?";
            $params[] = $category;
            $types .= "s";
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
                $orderClause = "ORDER BY s.Name ASC";
        }
        
        // Get servers with member count and category
        $query = "SELECT 
                    s.ID,
                    s.Name,
                    s.IconServer,
                    s.Description,
                    s.BannerServer,
                    s.InviteLink,
                    s.Category,
                    COUNT(DISTINCT usm.UserID) as member_count,
                    CASE WHEN usm_current.UserID IS NOT NULL THEN 1 ELSE 0 END as is_joined
                  FROM Server s
                  LEFT JOIN UserServerMemberships usm ON s.ID = usm.ServerID
                  LEFT JOIN UserServerMemberships usm_current ON s.ID = usm_current.ServerID AND usm_current.UserID = ?
                  $whereClause
                  GROUP BY s.ID, s.Name, s.IconServer, s.Description, s.BannerServer, s.InviteLink, s.Category, usm_current.UserID
                  $orderClause
                  LIMIT $limit OFFSET $offset";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            error_log("Prepare failed: " . $conn->error);
            echo json_encode(['error' => 'Database prepare error: ' . $conn->error, 'servers' => []]);
            exit();
        }
        
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        if (!$stmt->execute()) {
            error_log("Execute failed: " . $stmt->error);
            echo json_encode(['error' => 'Database execute error: ' . $stmt->error, 'servers' => []]);
            exit();
        }
        
        $result = $stmt->get_result();
        
        $servers = [];
        while ($row = $result->fetch_assoc()) {
            $server = [
                'ID' => $row['ID'] ?? 0,
                'Name' => $row['Name'] ?? 'Unnamed Server',
                'IconServer' => $row['IconServer'] ?? null,
                'Description' => $row['Description'] ?? '',
                'BannerServer' => $row['BannerServer'] ?? null,
                'InviteLink' => $row['InviteLink'] ?? '',
                'member_count' => (int)($row['member_count'] ?? 0),
                'is_joined' => (int)($row['is_joined'] ?? 0),
                'Category' => $row['Category'] ?? 'General'
            ];
            $servers[] = $server;
        }
        
        echo json_encode(['servers' => $servers]);
        exit();
    }
    
    if ($_POST['action'] === 'get_categories') {
        // Get actual server count
        $query = "SELECT COUNT(*) as total_servers FROM Server WHERE IsPrivate = 0";
        $result = $conn->query($query);
        $totalServers = $result ? $result->fetch_assoc()['total_servers'] : 0;
        
        // Get actual categories from database with server counts
        $categoryQuery = "SELECT 
                            s.Category,
                            COUNT(*) as server_count
                          FROM Server s 
                          WHERE s.IsPrivate = 0 
                            AND s.Category IS NOT NULL 
                            AND s.Category != ''
                          GROUP BY s.Category
                          ORDER BY server_count DESC, s.Category ASC";
        
        $categoryResult = $conn->query($categoryQuery);
        $categories = [];
        
        if ($categoryResult) {
            while ($row = $categoryResult->fetch_assoc()) {
                $categories[] = [
                    'Category' => $row['Category'],
                    'server_count' => (int)$row['server_count']
                ];
            }
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
                    s.Category,
                    COUNT(DISTINCT usm.UserID) as member_count,
                    CASE WHEN usm_current.UserID IS NOT NULL THEN 1 ELSE 0 END as is_joined
                  FROM Server s
                  LEFT JOIN UserServerMemberships usm ON s.ID = usm.ServerID
                  LEFT JOIN UserServerMemberships usm_current ON s.ID = usm_current.ServerID AND usm_current.UserID = ?
                  WHERE s.ID = ? AND s.IsPrivate = 0
                  GROUP BY s.ID, s.Name, s.IconServer, s.Description, s.BannerServer, s.InviteLink, s.Category, usm_current.UserID";
        
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
        
        // Debug: Log the join attempt
        error_log("Join server attempt - UserID: $currentUserId, ServerID: $serverId");
        
        // Check if server exists and is not private
        $serverQuery = "SELECT ID, Name FROM Server WHERE ID = ? AND IsPrivate = 0";
        $serverStmt = $conn->prepare($serverQuery);
        $serverStmt->bind_param("i", $serverId);
        $serverStmt->execute();
        $serverResult = $serverStmt->get_result();
        
        if ($serverResult->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Server not found or is private']);
            exit();
        }
        
        $server = $serverResult->fetch_assoc();
        
        // Check if already joined
        $checkQuery = "SELECT ID FROM UserServerMemberships WHERE UserID = ? AND ServerID = ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bind_param("ii", $currentUserId, $serverId);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows > 0) {
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
            error_log("Failed to join server: " . $joinStmt->error);
            echo json_encode(['success' => false, 'message' => 'Failed to join server: Database error']);
        }
        exit();
    }
    
    if ($_POST['action'] === 'join_by_invite') {
        $inviteCode = trim($_POST['invite_code']);
        
        if (empty($inviteCode)) {
            echo json_encode(['success' => false, 'message' => 'Please enter an invite code']);
            exit();
        }
        
        // Find server by invite link using ServerInvite table
        $serverQuery = "SELECT si.ServerID, s.ID, s.Name, si.ExpiresAt 
                        FROM ServerInvite si 
                        INNER JOIN Server s ON si.ServerID = s.ID 
                        WHERE si.InviteLink = ? 
                          AND s.IsPrivate = 0 
                          AND (si.ExpiresAt IS NULL OR si.ExpiresAt > NOW())";
        $serverStmt = $conn->prepare($serverQuery);
        $serverStmt->bind_param("s", $inviteCode);
        $serverStmt->execute();
        $serverResult = $serverStmt->get_result();
        
        if ($serverResult->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid or expired invite code']);
            exit();
        }
        
        $server = $serverResult->fetch_assoc();
        $serverId = $server['ServerID']; // Use ServerID from the join query
        
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
    <link rel="stylesheet" href="user-explore.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
    <div class="app-container">
        <div class="server-icon add-server floating-add-btn" id="floatingAddBtn" onclick="showJoinServerModal()" title="Add Server">
            <span>+</span>
        </div>
        <!-- Left Sidebar -->
        <!-- <div class="left-sidebar">
            <div class="server-list">
                <div class="server-icon home-icon" title="Home">
                    <span>⚔️</span>
                </div>
                <div class="server-separator"></div>
                <div class="server-icon user-server" title="My Server">
                    <img src="https://via.placeholder.com/48/36393f/ffffff?text=👤" alt="User Server">
                </div>
                <div class="server-separator"></div>
                <div class="server-icon explore-icon active" title="Explore Servers">
                    <span>🧭</span>
                </div>
            </div>
        </div> -->
        <div class="server-sidebar">
            <div class="server-nav">
                <!-- Home Button -->
                <div class="server-item home-server" data-tooltip="Home" onclick="navigateToHome()">
                    <div class="server-icon">
                        <i class="fas fa-home"></i>
                    </div>
                </div>
                
                <div class="server-separator"></div>
                
                <!-- User Servers List -->
                <div class="user-servers" id="userServersList">
                    <!-- User servers will be loaded here -->
                </div>
                
                <!-- Add Server Button -->
                <div class="server-item add-server" data-tooltip="Add a Server" onclick="openCreateServerModal()">
                    <div class="server-icon">
                        <i class="fas fa-plus"></i>
                    </div>
                </div>
                
                <div class="server-separator"></div>
                
                <!-- Explore Button -->
                <div class="server-item explore-server" data-tooltip="Explore Public Servers" onclick="navigateToExplore()">
                    <div class="server-icon">
                        <i class="fas fa-compass"></i>
                    </div>
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
            <div class="user-info-section">
                <div class="user-info">
                    <div class="user-avatar">
                        <img src="https://via.placeholder.com/32/36393f/ffffff?text=L" alt="litiyo">
                    </div>
                    <div class="user-details">
                        <div class="username">litiyo</div>
                        <div class="user-id">litiyo#9013</div>
                    </div>
                </div>
                <div class="user-controls">
                    <button class="control-btn mute-btn" title="Mute">🎤</button>
                    <button class="control-btn deafen-btn" title="Deafen">🎧</button>
                    <button class="control-btn settings-btn" title="Settings">⚙️</button>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <div class="content-header">
                <h1 style="margin-bottom: 2rem; margin-top:3rem;">Explore Servers</h1>
                <p class="subtitle" style="margin-bottom: 2rem;">Discover amazing communities, connect with like-minded people, and find your perfect server</p>
                
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

    <script src="user-explore.js"></script>
</body>
</html>