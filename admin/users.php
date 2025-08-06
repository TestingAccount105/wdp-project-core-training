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
    
    if ($_POST['action'] === 'ban_user') {
        $userId = (int)$_POST['user_id'];
        $query = "UPDATE Users SET Status = 'banned' WHERE ID = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $userId);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'User banned successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to ban user']);
        }
        exit();
    }
    
    if ($_POST['action'] === 'unban_user') {
        $userId = (int)$_POST['user_id'];
        $query = "UPDATE Users SET Status = 'active' WHERE ID = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $userId);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'User unbanned successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to unban user']);
        }
        exit();
    }
}

// Get filter and search parameters
$filter = $_GET['filter'] ?? 'all';
$search = $_GET['search'] ?? '';
$page = (int)($_GET['page'] ?? 1);
$limit = 10;
$offset = ($page - 1) * $limit;

// Build query based on filters
$database = new Database();
$conn = $database->getConnection();

$whereClause = "WHERE 1=1";
$params = [];
$types = "";

if ($filter === 'active') {
    $whereClause .= " AND (Status = 'active' OR Status = 'online' OR Status = 'offline')";
} elseif ($filter === 'banned') {
    $whereClause .= " AND Status = 'banned'";
}

if (!empty($search)) {
    $whereClause .= " AND (Username LIKE ? OR Email LIKE ? OR ID LIKE ?)";
    $searchParam = "%$search%";
    $params = [$searchParam, $searchParam, $searchParam];
    $types = "sss";
}

// Get total count
$countQuery = "SELECT COUNT(*) as total FROM Users $whereClause";
if (!empty($params)) {
    $countStmt = $conn->prepare($countQuery);
    $countStmt->bind_param($types, ...$params);
    $countStmt->execute();
    $totalUsers = $countStmt->get_result()->fetch_assoc()['total'];
} else {
    $totalUsers = $conn->query($countQuery)->fetch_assoc()['total'];
}

// Get users with pagination
$query = "SELECT ID, Username, Email, Status, AvatarURL, Discriminator, DisplayName, CreatedAt
          FROM Users $whereClause 
        --   ORDER BY CreatedAt DESC 
          LIMIT $limit OFFSET $offset";

if (!empty($params)) {
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $conn->query($query);
}

$users = [];
while ($row = $result->fetch_assoc()) {
    $users[] = $row;
}

$totalPages = ceil($totalUsers / $limit);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Management - MisVord Admin</title>
    <link rel="stylesheet" href="users.css">
    <link rel="stylesheet" href="admin.css">
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
                    <a href="users.php" class="nav-item active">
                        <span class="nav-text">Users</span>
                    </a>
                    <a href="servers.php" class="nav-item">
                        <span class="nav-text">Servers</span>
                    </a>
                    <a href="nitro.php" class="nav-item">
                        <span class="nav-text">Nitro Codes</span>
                    </a>
                </div>
                
                <a href="../auth/login.php" class="nav-item logout">
                    <span class="nav-icon">🚪</span>
                    <span class="nav-text">Log Out</span>
                </a>
            </nav>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <div class="content-header">
                <div class="header-left">
                    <h1>User Management</h1>
                    <p>View and manage all users</p>
                </div>
                <div class="header-right">
                    <div class="view-toggle">
                        <button class="view-btn active" data-view="table" title="Table View">
                            <span class="view-icon">☰</span>
                        </button>
                        <button class="view-btn" data-view="grid" title="Grid View">
                            <span class="view-icon">⊞</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Filters and Search -->
            <div class="controls-bar">
                <div class="filter-section">
                    <select id="userFilter" class="filter-dropdown">
                        <option value="all" <?php echo $filter === 'all' ? 'selected' : ''; ?>>All Users</option>
                        <option value="active" <?php echo $filter === 'active' ? 'selected' : ''; ?>>Active Users</option>
                        <option value="banned" <?php echo $filter === 'banned' ? 'selected' : ''; ?>>Banned Users</option>
                    </select>
                </div>
                <div class="search-section">
                    <div class="search-container">
                        <input type="text" id="searchInput" class="search-input" placeholder="Search users..." value="<?php echo htmlspecialchars($search); ?>">
                        <span class="search-icon">🔍</span>
                    </div>
                </div>
            </div>

            <!-- Users Content -->
            <div class="users-container" id="usersContainer">
                <!-- Skeleton Loading for Table View -->
                <div id="skeletonTableView" class="table-view skeleton-table">
                    <div class="table-container">
                        <table class="users-table">
                            <thead>
                                <tr>
                                    <th>Avatar</th>
                                    <th>Username</th>
                                    <th>ID</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Skeleton rows -->
                                <?php for ($i = 0; $i < 8; $i++): ?>
                                <tr>
                                    <td>
                                        <div class="skeleton-avatar"></div>
                                    </td>
                                    <td><div class="skeleton-text medium"></div></td>
                                    <td><div class="skeleton-text short"></div></td>
                                    <td><div class="skeleton-text long"></div></td>
                                    <td><div class="skeleton-badge"></div></td>
                                    <td><div class="skeleton-text medium"></div></td>
                                    <td><div class="skeleton-button"></div></td>
                                </tr>
                                <?php endfor; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Skeleton Loading for Grid View -->
                <div id="skeletonGridView" class="grid-view skeleton-grid">
                    <div class="users-grid">
                        <!-- Skeleton cards -->
                        <?php for ($i = 0; $i < 6; $i++): ?>
                        <div class="skeleton-card-modern">
                            <div class="skeleton-card-header">
                                <div class="skeleton-avatar"></div>
                                <div style="flex: 1;">
                                    <div class="skeleton-text medium" style="margin-bottom: 8px;"></div>
                                    <div class="skeleton-text short"></div>
                                </div>
                            </div>
                            <div class="skeleton-card-body">
                                <div class="skeleton-card-row">
                                    <div class="skeleton-detail-icon"></div>
                                    <div class="skeleton-text medium"></div>
                                </div>
                                <div class="skeleton-card-row">
                                    <div class="skeleton-detail-icon"></div>
                                    <div class="skeleton-text long"></div>
                                </div>
                                <div class="skeleton-card-row">
                                    <div class="skeleton-detail-icon"></div>
                                    <div class="skeleton-text short"></div>
                                </div>
                            </div>
                            <div class="skeleton-card-actions">
                                <div class="skeleton-button"></div>
                            </div>
                        </div>
                        <?php endfor; ?>
                    </div>
                </div>

                <!-- Table View -->
                <div id="tableView" class="table-view active">
                    <div class="table-container">
                        <table class="users-table">
                            <thead>
                                <tr>
                                    <th>Avatar</th>
                                    <th>Username</th>
                                    <th>ID</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($users as $user): ?>
                                <tr>
                                    <td>
                                        <div class="avatar">
                                            <?php if ($user['AvatarURL']): ?>
                                                <img src="<?php echo htmlspecialchars($user['AvatarURL']); ?>" alt="Avatar">
                                            <?php else: ?>
                                                <div class="avatar-placeholder">
                                                    <?php echo strtoupper(substr($user['Username'], 0, 1)); ?>
                                                </div>
                                            <?php endif; ?>
                                        </div>
                                    </td>
                                    <td class="username"><?php echo htmlspecialchars($user['Username']); ?></td>
                                    <td class="user-id"><?php echo $user['ID']; ?></td>
                                    <td class="email"><?php echo htmlspecialchars($user['Email']); ?></td>
                                    <td>
                                        <span class="status-badge <?php echo strtolower($user['Status']); ?>">
                                            <?php echo ucfirst($user['Status'] === 'banned' ? 'Banned' : 'Active'); ?>
                                        </span>
                                    </td>
                                    <td class="join-date">
                                        <?php echo $user['CreatedAt'] ? date('j M Y', strtotime($user['CreatedAt'])) : 'N/A'; ?>
                                    </td>
                                    <td>
                                        <?php if ($user['Status'] === 'banned'): ?>
                                            <button class="action-btn unban-btn" data-user-id="<?php echo $user['ID']; ?>" data-username="<?php echo htmlspecialchars($user['Username']); ?>">
                                                Unban
                                            </button>
                                        <?php else: ?>
                                            <button class="action-btn ban-btn" data-user-id="<?php echo $user['ID']; ?>" data-username="<?php echo htmlspecialchars($user['Username']); ?>">
                                                Ban
                                            </button>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Grid View -->
                <div id="gridView" class="grid-view">
                    <div class="users-grid">
                        <div class="grid-header">
                            <div class="grid-header-cell">User</div>
                            <div class="grid-header-cell">Details</div>
                            <div class="grid-header-cell">Actions</div>
                        </div>
                        <?php foreach ($users as $user): ?>
                        <div class="user-card">
                            <div class="card-user">
                                <div class="user-info">
                                    <div class="avatar">
                                        <?php if ($user['AvatarURL']): ?>
                                            <img src="<?php echo htmlspecialchars($user['AvatarURL']); ?>" alt="Avatar">
                                        <?php else: ?>
                                            <div class="avatar-placeholder">
                                                <?php echo strtoupper(substr($user['Username'], 0, 1)); ?>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                    <div class="user-details">
                                        <h3 class="username username-flex">
                                            <?php echo htmlspecialchars($user['Username']); ?>
                                            <span class="discriminator">#<?php echo $user['Discriminator'] ?? '0000'; ?></span>
                                        </h3>
                                    </div>
                                </div>
                            </div>
                            <div class="card-details">
                                <div class="card-details-flex">
                                    <div class="detail-row">
                                        <span class="detail-icon">🆔</span>
                                        <span class="detail-label">ID: <?php echo $user['ID']; ?></span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-icon">👤</span>
                                        <span class="detail-label"><?php echo htmlspecialchars($user['Username']); ?></span>
                                    </div>
                                </div>
                                <div class="card-details-flex">
                                    <div class="detail-row">
                                        <span class="detail-icon">✉️</span>
                                        <span class="detail-label"><?php echo htmlspecialchars($user['Email']); ?></span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-icon">📅</span>
                                        <span class="detail-label">
                                            <?php echo $user['Username'] ? date('j M Y', strtotime($user['Username'])) : 'N/A'; ?>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div class="card-actions">
                                <?php if ($user['Status'] === 'banned'): ?>
                                    <button class="action-btn unban-btn" data-user-id="<?php echo $user['ID']; ?>" data-username="<?php echo htmlspecialchars($user['Username']); ?>">
                                        Unban
                                    </button>
                                <?php else: ?>
                                    <button class="action-btn ban-btn" data-user-id="<?php echo $user['ID']; ?>" data-username="<?php echo htmlspecialchars($user['Username']); ?>">
                                        Ban
                                    </button>
                                <?php endif; ?>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>

            <!-- Pagination -->
            <div class="pagination-container">
                <div class="pagination-info">
                    Showing <?php echo min($limit, $totalUsers - $offset); ?> of <?php echo $totalUsers; ?> users
                </div>
                <div class="pagination-controls">
                    <?php if ($page > 1): ?>
                        <a href="?page=<?php echo $page - 1; ?>&filter=<?php echo $filter; ?>&search=<?php echo urlencode($search); ?>" class="pagination-btn">
                            ← Previous
                        </a>
                    <?php endif; ?>
                    
                    <?php if ($page < $totalPages): ?>
                        <a href="?page=<?php echo $page + 1; ?>&filter=<?php echo $filter; ?>&search=<?php echo urlencode($search); ?>" class="pagination-btn">
                            Next →
                        </a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Ban Confirmation Modal -->
    <div id="banModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Confirm Ban User</h3>
                <button class="modal-close" onclick="closeModal('banModal')">&times;</button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to ban user <strong id="banUsername"></strong>?</p>
                <p class="warning-text">This action will prevent the user from accessing the platform.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('banModal')">Cancel</button>
                <button class="btn btn-danger" id="confirmBan">Ban User</button>
            </div>
        </div>
    </div>

    <!-- Unban Confirmation Modal -->
    <div id="unbanModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Confirm Unban User</h3>
                <button class="modal-close" onclick="closeModal('unbanModal')">&times;</button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to unban user <strong id="unbanUsername"></strong>?</p>
                <p class="info-text">This action will restore the user's access to the platform.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('unbanModal')">Cancel</button>
                <button class="btn btn-success" id="confirmUnban">Unban User</button>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id="toastContainer" class="toast-container"></div>

    <script>
        let currentUserId = null;
        let currentUsername = null;
        let isLoading = false;

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            // Show skeleton loading on page load
            showSkeletonLoading();
            
            // Simulate loading time and then show real content
            setTimeout(() => {
                hideSkeletonLoading();
                initializeEventListeners();
            }, 2000); // 2 second loading simulation
        });

        // Show skeleton loading
        function showSkeletonLoading() {
            isLoading = true;
            const currentView = document.querySelector('.view-btn.active').dataset.view;
            
            // Hide real content
            document.getElementById('tableView').style.display = 'none';
            document.getElementById('gridView').style.display = 'none';
            
            // Show appropriate skeleton
            if (currentView === 'table') {
                document.getElementById('skeletonTableView').classList.add('active');
                document.getElementById('skeletonGridView').classList.remove('active');
            } else {
                document.getElementById('skeletonGridView').classList.add('active');
                document.getElementById('skeletonTableView').classList.remove('active');
            }
            
            // Add loading class to container
            document.getElementById('usersContainer').classList.add('loading');
        }

        // Hide skeleton loading
        function hideSkeletonLoading() {
            isLoading = false;
            const currentView = document.querySelector('.view-btn.active').dataset.view;
            
            // Hide skeletons
            document.getElementById('skeletonTableView').classList.remove('active');
            document.getElementById('skeletonGridView').classList.remove('active');
            
            // Show real content with fade in
            setTimeout(() => {
                if (currentView === 'table') {
                    document.getElementById('tableView').style.display = 'block';
                    document.getElementById('tableView').classList.add('active');
                    document.getElementById('gridView').classList.remove('active');
                } else {
                    document.getElementById('gridView').style.display = 'block';
                    document.getElementById('gridView').classList.add('active');
                    document.getElementById('tableView').classList.remove('active');
                }
                
                // Remove loading class
                document.getElementById('usersContainer').classList.remove('loading');
            }, 100);
        }

        // Initialize all event listeners
        function initializeEventListeners() {
            // View toggle buttons
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    if (isLoading) return; // Prevent interaction during loading
                    
                    const view = this.dataset.view;
                    toggleView(view);
                });
            });

            // Filter dropdown
            document.getElementById('userFilter').addEventListener('change', function() {
                if (isLoading) return;
                applyFiltersWithLoading();
            });

            // Search input
            document.getElementById('searchInput').addEventListener('input', debounce(function() {
                if (isLoading) return;
                applyFiltersWithLoading();
            }, 500));

            // Ban/Unban buttons
            document.querySelectorAll('.ban-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const userId = this.dataset.userId;
                    const username = this.dataset.username;
                    showBanModal(userId, username);
                });
            });

            document.querySelectorAll('.unban-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const userId = this.dataset.userId;
                    const username = this.dataset.username;
                    showUnbanModal(userId, username);
                });
            });

            // Modal event listeners
            document.getElementById('confirmBan').addEventListener('click', function() {
                banUser(currentUserId);
            });

            document.getElementById('confirmUnban').addEventListener('click', function() {
                unbanUser(currentUserId);
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeAllModals();
                }
            });

            // Modal background click to close
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', function(e) {
                    if (e.target === this) {
                        closeModal(this.id);
                    }
                });
            });
        }

        // Apply filters with loading animation
        function applyFiltersWithLoading() {
            showSkeletonLoading();
            
            // Delay the actual filter application to show loading
            setTimeout(() => {
                applyFilters();
            }, 800);
        }

        // Toggle between table and grid view
        function toggleView(view) {
            if (isLoading) return;
            
            const tableView = document.getElementById('tableView');
            const gridView = document.getElementById('gridView');
            const skeletonTableView = document.getElementById('skeletonTableView');
            const skeletonGridView = document.getElementById('skeletonGridView');
            const viewBtns = document.querySelectorAll('.view-btn');

            // Update buttons
            viewBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === view);
            });

            // Show loading for view change
            showSkeletonLoading();
            
            setTimeout(() => {
                // Update views
                if (view === 'table') {
                    tableView.style.display = 'block';
                    gridView.style.display = 'none';
                    tableView.classList.add('active');
                    gridView.classList.remove('active');
                } else {
                    tableView.style.display = 'none';
                    gridView.style.display = 'block';
                    tableView.classList.remove('active');
                    gridView.classList.add('active');
                }
                
                hideSkeletonLoading();
            }, 600);
        }

        // Apply filters and search
        function applyFilters() {
            const filter = document.getElementById('userFilter').value;
            const search = document.getElementById('searchInput').value;
            
            // Build URL with current parameters
            const url = new URL(window.location);
            url.searchParams.set('filter', filter);
            url.searchParams.set('search', search);
            url.searchParams.set('page', '1'); // Reset to first page
            
            // Reload page with new parameters
            window.location.href = url.toString();
        }

        // Show ban modal
        function showBanModal(userId, username) {
            currentUserId = userId;
            currentUsername = username;
            
            document.getElementById('banUsername').textContent = username;
            showModal('banModal');
        }

        // Show unban modal
        function showUnbanModal(userId, username) {
            currentUserId = userId;
            currentUsername = username;
            
            document.getElementById('unbanUsername').textContent = username;
            showModal('unbanModal');
        }

        // Show modal
        function showModal(modalId) {
            const modal = document.getElementById(modalId);
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // Close modal
        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            modal.classList.remove('active');
            document.body.style.overflow = '';
            
            // Reset current user data
            currentUserId = null;
            currentUsername = null;
        }

        // Close all modals
        function closeAllModals() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
            document.body.style.overflow = '';
            currentUserId = null;
            currentUsername = null;
        }

        // Ban user via AJAX
        function banUser(userId) {
            if (!userId) return;
            
            const formData = new FormData();
            formData.append('action', 'ban_user');
            formData.append('user_id', userId);
            
            fetch(window.location.href, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showToast(`User ${currentUsername} has been banned successfully`, 'success');
                    closeModal('banModal');
                    // Reload page to reflect changes with loading
                    setTimeout(() => {
                        showSkeletonLoading();
                        setTimeout(() => {
                            window.location.reload();
                        }, 500);
                    }, 1000);
                } else {
                    showToast(data.message || 'Failed to ban user', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('An error occurred while banning the user', 'error');
            });
        }

        // Unban user via AJAX
        function unbanUser(userId) {
            if (!userId) return;
            
            const formData = new FormData();
            formData.append('action', 'unban_user');
            formData.append('user_id', userId);
            
            fetch(window.location.href, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showToast(`User ${currentUsername} has been unbanned successfully`, 'success');
                    closeModal('unbanModal');
                    // Reload page to reflect changes with loading
                    setTimeout(() => {
                        showSkeletonLoading();
                        setTimeout(() => {
                            window.location.reload();
                        }, 500);
                    }, 1000);
                } else {
                    showToast(data.message || 'Failed to unban user', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('An error occurred while unbanning the user', 'error');
            });
        }

        // Show toast notification
        function showToast(message, type = 'info') {
            const toastContainer = document.getElementById('toastContainer');
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            
            toastContainer.appendChild(toast);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                toast.style.animation = 'toastSlideOut 0.3s ease forwards';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 5000);
            
            // Click to dismiss
            toast.addEventListener('click', () => {
                toast.style.animation = 'toastSlideOut 0.3s ease forwards';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            });
        }

        // Debounce function for search
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    </script>
</body>
</html>