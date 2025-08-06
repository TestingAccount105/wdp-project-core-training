<?php
session_start();
require_once 'database.php';

// Simple authentication check
// if (!isset($_SESSION['admin_logged_in'])) {
//     header('Location: login.php');
//     exit();
// }

// Handle AJAX requests
if (isset($_POST['action'])) {
    header('Content-Type: application/json');
    
    $database = new Database();
    $conn = $database->getConnection();
    
    if ($_POST['action'] === 'delete_server') {
        $serverId = (int)$_POST['server_id'];
        
        // Start transaction
        $conn->begin_transaction();
        
        try {
            // Delete related records first (channels, memberships, etc.)
            $conn->query("DELETE FROM ChannelMessage WHERE ChannelID IN (SELECT ID FROM Channel WHERE ServerID = $serverId)");
            $conn->query("DELETE FROM Channel WHERE ServerID = $serverId");
            $conn->query("DELETE FROM UserServerMemberships WHERE ServerID = $serverId");
            $conn->query("DELETE FROM ServerInvite WHERE ServerID = $serverId");
            
            // Delete the server
            $query = "DELETE FROM Server WHERE ID = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $serverId);
            
            if ($stmt->execute()) {
                $conn->commit();
                echo json_encode(['success' => true, 'message' => 'Server deleted successfully']);
            } else {
                $conn->rollback();
                echo json_encode(['success' => false, 'message' => 'Failed to delete server']);
            }
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => 'Error deleting server: ' . $e->getMessage()]);
        }
        exit();
    }
}

// Get search parameter
$search = $_GET['search'] ?? '';
$page = (int)($_GET['page'] ?? 1);
$limit = 10;
$offset = ($page - 1) * $limit;

// Build query based on search
$database = new Database();
$conn = $database->getConnection();

$whereClause = "WHERE 1=1";
$params = [];
$types = "";

if (!empty($search)) {
    $whereClause .= " AND (s.Name LIKE ? OR s.ID LIKE ? OR u.Username LIKE ?)";
    $searchParam = "%$search%";
    $params = [$searchParam, $searchParam, $searchParam];
    $types = "sss";
}

// Get total count
$countQuery = "SELECT COUNT(*) as total 
               FROM Server s 
               LEFT JOIN UserServerMemberships usm ON s.ID = usm.ServerID AND usm.Role = 'owner'
               LEFT JOIN Users u ON usm.UserID = u.ID 
               $whereClause";

if (!empty($params)) {
    $countStmt = $conn->prepare($countQuery);
    $countStmt->bind_param($types, ...$params);
    $countStmt->execute();
    $totalServers = $countStmt->get_result()->fetch_assoc()['total'];
} else {
    $totalServers = $conn->query($countQuery)->fetch_assoc()['total'];
}

// Get servers with owner info and member count
$query = "SELECT 
            s.ID,
            s.Name,
            s.IconServer,
            s.Description,
            s.CreatedAt,
            u.Username as OwnerUsername,
            u.Discriminator as OwnerDiscriminator,
            (SELECT COUNT(*) FROM UserServerMemberships WHERE ServerID = s.ID) as MemberCount
          FROM Server s 
          LEFT JOIN UserServerMemberships usm ON s.ID = usm.ServerID AND usm.Role = 'owner'
          LEFT JOIN Users u ON usm.UserID = u.ID 
          $whereClause 
          ORDER BY s.ID DESC 
          LIMIT $limit OFFSET $offset";

if (!empty($params)) {
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $conn->query($query);
}

$servers = [];
while ($row = $result->fetch_assoc()) {
    $servers[] = $row;
}

$totalPages = ceil($totalServers / $limit);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Management - MisVord Admin</title>
    <link rel="stylesheet" href="admin.css">
    <link rel="stylesheet" href="servers.css">
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
                    <a href="admin.php" class="nav-item">
                        <span class="nav-text">Overview</span>
                    </a>
                    <a href="users.php" class="nav-item">
                        <span class="nav-text">Users</span>
                    </a>
                    <a href="servers.php" class="nav-item active">
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
                <div class="header-left">
                    <h1>Server Management</h1>
                    <p>View and manage all servers</p>
                </div>
                <div class="header-right">
                    <div class="search-container">
                        <input type="text" id="searchInput" class="search-input" placeholder="Search servers..." value="<?php echo htmlspecialchars($search); ?>">
                        <span class="search-icon">🔍</span>
                    </div>
                </div>
            </div>

            <!-- Servers Section -->
            <div class="servers-section">
                <h2>Servers</h2>
                
                <div class="servers-container" id="serversContainer">
                    <!-- Skeleton Loading Table -->
                    <div class="skeleton-servers-table" id="skeletonServersTable">
                        <div class="table-container">
                            <table class="servers-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Server</th>
                                        <th>Owner</th>
                                        <th>Members</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Skeleton rows -->
                                    <?php for ($i = 0; $i < 8; $i++): ?>
                                    <tr>
                                        <td><div class="skeleton-id"></div></td>
                                        <td>
                                            <div class="skeleton-server-display">
                                                <div class="skeleton-server-icon"></div>
                                                <div class="skeleton-text medium"></div>
                                            </div>
                                        </td>
                                        <td><div class="skeleton-text long"></div></td>
                                        <td><div class="skeleton-member-count"></div></td>
                                        <td><div class="skeleton-text medium"></div></td>
                                        <td><div class="skeleton-delete-btn"></div></td>
                                    </tr>
                                    <?php endfor; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Real Servers Table -->
                    <div class="table-container" id="realServersTable">
                        <table class="servers-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Server</th>
                                    <th>Owner</th>
                                    <th>Members</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($servers as $server): ?>
                                <tr>
                                    <td class="server-id"><?php echo $server['ID']; ?></td>
                                    <td class="server-info">
                                        <div class="server-display">
                                            <div class="server-icon">
                                                <?php if ($server['IconServer']): ?>
                                                    <img src="<?php echo htmlspecialchars($server['IconServer']); ?>" alt="Server Icon">
                                                <?php else: ?>
                                                    <div class="server-icon-placeholder">
                                                        <?php echo strtoupper(substr($server['Name'], 0, 1)); ?>
                                                    </div>
                                                <?php endif; ?>
                                            </div>
                                            <span class="server-name"><?php echo htmlspecialchars($server['Name']); ?></span>
                                        </div>
                                    </td>
                                    <td class="owner-info">
                                        <?php if ($server['OwnerUsername']): ?>
                                            <?php echo htmlspecialchars($server['OwnerUsername']); ?>#<?php echo $server['OwnerDiscriminator'] ?? '0000'; ?>
                                        <?php else: ?>
                                            <span class="unknown-owner">Unknown User</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="member-count"><?php echo $server['MemberCount']; ?></td>
                                    <td class="created-date"><?php echo date('j M Y', strtotime($server['CreatedAt'])); ?></td>
                                    <td class="actions">
                                        <button class="delete-btn" 
                                                data-server-id="<?php echo $server['ID']; ?>" 
                                                data-server-name="<?php echo htmlspecialchars($server['Name']); ?>">
                                            🗑️ Delete
                                        </button>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Pagination -->
            <div class="pagination-container">
                <div class="pagination-info">
                    Showing <?php echo min($limit, $totalServers - $offset); ?> of <?php echo $totalServers; ?> servers
                </div>
                <div class="pagination-controls">
                    <?php if ($page > 1): ?>
                        <button class="pagination-btn" onclick="changePage(<?php echo $page - 1; ?>)">
                            ← Previous
                        </button>
                    <?php endif; ?>
                    
                    <?php if ($page < $totalPages): ?>
                        <button class="pagination-btn" onclick="changePage(<?php echo $page + 1; ?>)">
                            Next →
                        </button>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="deleteModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Confirm Delete Server</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete the server <strong id="deleteServerName"></strong>?</p>
                <p class="warning-text">This action cannot be undone. All channels, messages, and memberships will be permanently deleted.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('deleteModal')">Cancel</button>
                <button class="btn btn-danger" id="confirmDelete">Delete Server</button>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id="toastContainer" class="toast-container"></div>

    <script src="servers.js"></script>
</body>
</html>