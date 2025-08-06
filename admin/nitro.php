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
    
    if ($_POST['action'] === 'search_users') {
        $searchTerm = $_POST['search_term'] ?? '';
        
        if (strlen($searchTerm) < 2) {
            echo json_encode(['users' => []]);
            exit();
        }
        
        // Get all users
        $query = "SELECT u.ID, u.Username, u.Email, u.Discriminator, u.AvatarURL,
                         (SELECT COUNT(*) FROM Nitro n WHERE n.UserID = u.ID) as HasNitro
                  FROM Users u 
                  ORDER BY u.Username";
        $result = $conn->query($query);
        
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        
        // Apply Jaro-Winkler algorithm
        $filteredUsers = [];
        foreach ($users as $user) {
            $usernameScore = jaroWinkler($searchTerm, $user['Username']);
            $emailScore = jaroWinkler($searchTerm, $user['Email']);
            $maxScore = max($usernameScore, $emailScore);
            
            if ($maxScore > 0.3) {
                $user['similarity_score'] = $maxScore;
                $filteredUsers[] = $user;
            }
        }
        
        // Sort by similarity score
        usort($filteredUsers, function($a, $b) {
            return $b['similarity_score'] <=> $a['similarity_score'];
        });
        
        // Limit to top 10 results
        $filteredUsers = array_slice($filteredUsers, 0, 10);
        
        echo json_encode(['users' => $filteredUsers]);
        exit();
    }
    
    if ($_POST['action'] === 'generate_code') {
        $userId = !empty($_POST['user_id']) ? (int)$_POST['user_id'] : null;
        
        // Generate random code
        $code = generateNitroCode();
        
        $query = "INSERT INTO Nitro (UserID, Code) VALUES (?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("is", $userId, $code);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Nitro code generated successfully', 'code' => $code]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to generate code']);
        }
        exit();
    }
    
    if ($_POST['action'] === 'delete_code') {
        $codeId = (int)$_POST['code_id'];
        
        $query = "DELETE FROM Nitro WHERE ID = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $codeId);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Nitro code deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete code']);
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
    $whereClause .= " AND (n.Code LIKE ? OR n.ID LIKE ? OR u.Username LIKE ?)";
    $searchParam = "%$search%";
    $params = [$searchParam, $searchParam, $searchParam];
    $types = "sss";
}

// Get statistics
$statsQuery = "SELECT 
                 COUNT(*) as total_codes,
                 SUM(CASE WHEN UserID IS NULL THEN 1 ELSE 0 END) as active_codes,
                 SUM(CASE WHEN UserID IS NOT NULL THEN 1 ELSE 0 END) as used_codes
               FROM Nitro";
$statsResult = $conn->query($statsQuery);
$stats = $statsResult->fetch_assoc();

// Get total count for pagination
$countQuery = "SELECT COUNT(*) as total 
               FROM Nitro n 
               LEFT JOIN Users u ON n.UserID = u.ID 
               $whereClause";

if (!empty($params)) {
    $countStmt = $conn->prepare($countQuery);
    $countStmt->bind_param($types, ...$params);
    $countStmt->execute();
    $totalCodes = $countStmt->get_result()->fetch_assoc()['total'];
} else {
    $totalCodes = $conn->query($countQuery)->fetch_assoc()['total'];
}

// Get nitro codes
$query = "SELECT 
            n.ID,
            n.Code,
            n.CreatedAt,
            u.Username,
            u.Discriminator,
            u.Email,
            CASE WHEN n.UserID IS NULL THEN 'Active' ELSE 'Used' END as Status
          FROM Nitro n 
          LEFT JOIN Users u ON n.UserID = u.ID 
          $whereClause 
          ORDER BY n.ID DESC 
          LIMIT $limit OFFSET $offset";

if (!empty($params)) {
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $conn->query($query);
}

$nitroCodes = [];
while ($row = $result->fetch_assoc()) {
    $nitroCodes[] = $row;
}

$totalPages = ceil($totalCodes / $limit);

// Jaro-Winkler algorithm implementation
function jaro($s1, $s2) {
    $len1 = strlen($s1);
    $len2 = strlen($s2);
    
    if ($len1 == 0) return $len2 == 0 ? 1.0 : 0.0;
    if ($len2 == 0) return 0.0;
    
    $match_distance = (int)(max($len1, $len2) / 2) - 1;
    if ($match_distance < 0) $match_distance = 0;
    
    $s1_matches = array_fill(0, $len1, false);
    $s2_matches = array_fill(0, $len2, false);
    
    $matches = 0;
    $transpositions = 0;
    
    // Find matches
    for ($i = 0; $i < $len1; $i++) {
        $start = max(0, $i - $match_distance);
        $end = min($i + $match_distance + 1, $len2);
        
        for ($j = $start; $j < $end; $j++) {
            if ($s2_matches[$j] || $s1[$i] != $s2[$j]) continue;
            $s1_matches[$i] = true;
            $s2_matches[$j] = true;
            $matches++;
            break;
        }
    }
    
    if ($matches == 0) return 0.0;
    
    // Find transpositions
    $k = 0;
    for ($i = 0; $i < $len1; $i++) {
        if (!$s1_matches[$i]) continue;
        while (!$s2_matches[$k]) $k++;
        if ($s1[$i] != $s2[$k]) $transpositions++;
        $k++;
    }
    
    return ($matches / $len1 + $matches / $len2 + ($matches - $transpositions / 2) / $matches) / 3.0;
}

function jaroWinkler($s1, $s2) {
    $s1 = strtolower($s1);
    $s2 = strtolower($s2);
    
    $jaro_score = jaro($s1, $s2);
    
    if ($jaro_score < 0.7) {
        return $jaro_score;
    }
    
    // Calculate prefix length (up to 4 characters)
    $prefix_length = 0;
    $max_prefix = min(4, min(strlen($s1), strlen($s2)));
    
    for ($i = 0; $i < $max_prefix; $i++) {
        if ($s1[$i] == $s2[$i]) {
            $prefix_length++;
        } else {
            break;
        }
    }
    
    return $jaro_score + (0.1 * $prefix_length * (1 - $jaro_score));
}

function generateNitroCode() {
    $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $code = '';
    for ($i = 0; $i < 16; $i++) {
        $code .= $characters[rand(0, strlen($characters) - 1)];
    }
    return $code;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nitro Management - MisVord Admin</title>
    <link rel="stylesheet" href="admin.css">
    <link rel="stylesheet" href="nitro.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
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
                    <a href="servers.php" class="nav-item">
                        <span class="nav-text">Servers</span>
                    </a>
                    <a href="nitro.php" class="nav-item active">
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
                <p class="subtitle">Generate and manage nitro subscription codes</p>
            </div>

            <!-- Top Section -->
            <div class="top-section">
                <!-- Generate New Code -->
                <div class="generate-section">
                    <h2>Generate New Code</h2>
                    
                    <div class="form-group">
                        <label>Assign to User (Optional)</label>
                        <div class="user-search-container">
                            <input type="text" id="userSearch" class="user-search-input" placeholder="Search for user or leave empty for unassigned">
                            <div class="search-dropdown" id="searchDropdown"></div>
                        </div>
                        <small class="search-help">Search by username or email</small>
                        <div class="info-message">
                            <span class="info-icon">ℹ️</span>
                            Users with existing Nitro will appear disabled and cannot be selected
                        </div>
                    </div>
                    
                    <button class="generate-btn" id="generateBtn">Generate Code</button>
                </div>

                <!-- Nitro Statistics -->
                <div class="stats-section">
                    <h2>Nitro Statistics</h2>
                    
                    <div class="stat-item">
                        <span class="stat-label">Active Codes</span>
                        <span class="stat-value"><?php echo $stats['active_codes']; ?></span>
                    </div>
                    
                    <div class="stat-item">
                        <span class="stat-label">Used Codes</span>
                        <span class="stat-value"><?php echo $stats['used_codes']; ?></span>
                    </div>
                    
                    <div class="stat-item">
                        <span class="stat-label">Total Codes</span>
                        <span class="stat-value"><?php echo $stats['total_codes']; ?></span>
                    </div>
                </div>
            </div>

            <!-- Nitro Codes Section -->
            <div class="codes-section">
                <div class="section-header">
                    <h2>Nitro Codes</h2>
                    <div class="search-container">
                        <input type="text" id="codeSearch" class="search-input" placeholder="Search codes..." value="<?php echo htmlspecialchars($search); ?>">
                        <span class="search-icon">🔍</span>
                    </div>
                </div>
                
                <div class="table-container">
                    <!-- Skeleton Table (shown by default) -->
                    <table class="skeleton-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Code</th>
                                <th>User</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php for ($i = 0; $i < 8; $i++): ?>
                            <tr class="skeleton-row">
                                <td><div class="skeleton-cell width-60"></div></td>
                                <td><div class="skeleton-cell width-200"></div></td>
                                <td><div class="skeleton-cell width-140"></div></td>
                                <td><div class="skeleton-status"></div></td>
                                <td><div class="skeleton-cell width-120"></div></td>
                                <td>
                                    <div class="skeleton-actions">
                                        <div class="skeleton-action-btn"></div>
                                        <div class="skeleton-action-btn"></div>
                                    </div>
                                </td>
                            </tr>
                            <?php endfor; ?>
                        </tbody>
                    </table>

                    <!-- Real Table (hidden by default) -->
                    <table class="codes-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Code</th>
                                <th>User</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($nitroCodes as $code): ?>
                            <tr>
                                <td class="code-id"><?php echo $code['ID']; ?></td>
                                <td class="code-value"><?php echo htmlspecialchars($code['Code']); ?></td>
                                <td class="user-info">
                                    <?php if ($code['Username']): ?>
                                        <?php echo htmlspecialchars($code['Username']); ?>#<?php echo $code['Discriminator'] ?? '0000'; ?>
                                    <?php else: ?>
                                        <span class="unassigned">Unassigned</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <span class="status-badge <?php echo strtolower($code['Status']); ?>">
                                        <?php echo $code['Status']; ?>
                                    </span>
                                </td>
                                <td class="created-date"><?php echo date('j/n/Y H:i:s', strtotime($code['CreatedAt'])); ?></td>
                                <td class="actions">
                                    <button class="action-btn copy-btn" data-code="<?php echo htmlspecialchars($code['Code']); ?>" title="Copy Code">
                                        📋
                                    </button>
                                    <button class="action-btn delete-btn" data-code-id="<?php echo $code['ID']; ?>" data-code="<?php echo htmlspecialchars($code['Code']); ?>" title="Delete Code">
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Skeleton Pagination (shown by default) -->
            <div class="skeleton-pagination">
                <div class="skeleton-pagination-info"></div>
                <div class="skeleton-pagination-controls">
                    <div class="skeleton-pagination-btn"></div>
                    <div class="skeleton-pagination-btn"></div>
                </div>
            </div>

            <!-- Real Pagination (hidden by default) -->
            <div class="pagination-container">
                <div class="pagination-info">
                    Showing <?php echo min($limit, $totalCodes - $offset); ?> of <?php echo $totalCodes; ?> codes
                </div>
                <div class="pagination-controls">
                    <?php if ($page > 1): ?>
                        <button class="pagination-btn" onclick="changePageWithLoading(<?php echo $page - 1; ?>)">
                            ← Previous
                        </button>
                    <?php endif; ?>
                    
                    <?php if ($page < $totalPages): ?>
                        <button class="pagination-btn" onclick="changePageWithLoading(<?php echo $page + 1; ?>)">
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
                <h3>Confirm Delete Code</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete the nitro code <strong id="deleteCodeValue"></strong>?</p>
                <p class="warning-text">This action cannot be undone.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('deleteModal')">Cancel</button>
                <button class="btn btn-danger" id="confirmDelete">Delete Code</button>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id="toastContainer" class="toast-container"></div>

    <script src="nitro.js"></script>
</body>
</html>