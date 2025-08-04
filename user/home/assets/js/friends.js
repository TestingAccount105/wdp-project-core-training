// Friends management functionality
class FriendsManager {
    constructor() {
        this.currentTab = 'online';
        this.friends = {
            online: [],
            all: [],
            pending: { incoming: [], outgoing: [] }
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadOnlineFriends();
        this.loadActiveTab();
    }

    setupEventListeners() {
        // Friend tab navigation
        document.querySelectorAll('.friends-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Search functionality
        document.getElementById('onlineSearch')?.addEventListener('input', (e) => {
            this.searchFriends('online', e.target.value);
        });

        document.getElementById('allSearch')?.addEventListener('input', (e) => {
            this.searchFriends('all', e.target.value);
        });

        document.getElementById('pendingSearch')?.addEventListener('input', (e) => {
            this.searchPendingRequests(e.target.value);
        });

        // Add friend functionality
        document.getElementById('sendFriendRequest')?.addEventListener('click', () => {
            this.sendFriendRequest();
        });

        document.getElementById('usernameInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendFriendRequest();
            }
        });
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.friends-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Show corresponding content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        this.currentTab = tabName;

        // Load data for the tab
        switch (tabName) {
            case 'online':
                this.loadOnlineFriends();
                break;
            case 'all':
                this.loadAllFriends();
                break;
            case 'pending':
                this.loadPendingRequests();
                break;
            case 'add':
                this.clearAddFriendForm();
                break;
        }
    }

    async loadOnlineFriends() {
        try {
            const response = await fetch('/user/home/api/friends.php?action=online');
            const data = await response.json();
            
            if (data.friends) {
                this.friends.online = data.friends;
                this.renderFriendsList('online', data.friends);
            }
        } catch (error) {
            console.error('Error loading online friends:', error);
        }
    }

    async loadAllFriends() {
        try {
            const response = await fetch('/user/home/api/friends.php?action=all');
            const data = await response.json();
            
            if (data.friends) {
                this.friends.all = data.friends;
                this.renderFriendsList('all', data.friends);
            }
        } catch (error) {
            console.error('Error loading all friends:', error);
        }
    }

    async loadPendingRequests() {
        try {
            const response = await fetch('/user/home/api/friends.php?action=pending');
            const data = await response.json();
            
            if (data.incoming && data.outgoing) {
                this.friends.pending = data;
                this.renderPendingRequests(data);
            }
        } catch (error) {
            console.error('Error loading pending requests:', error);
        }
    }

    renderFriendsList(type, friends) {
        const container = document.getElementById(`${type}FriendsList`);
        if (!container) return;

        if (friends.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No ${type === 'online' ? 'online' : ''} friends found.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = friends.map(friend => `
            <div class="friend-item" data-user-id="${friend.id}">
                <div class="friend-avatar">
                    <img src="${friend.avatar || '/assets/images/default-avatar.png'}" alt="${friend.display_name}">
                    <div class="status-indicator status-${friend.status}"></div>
                </div>
                <div class="friend-info">
                    <div class="friend-name">${friend.display_name}</div>
                    <div class="friend-status">${this.getStatusText(friend.status)}</div>
                </div>
                <div class="friend-actions">
                    <button class="action-btn message" title="Message" data-action="message" data-user-id="${friend.id}">
                        <i class="fas fa-comment"></i>
                    </button>
                    <button class="action-btn" title="More options" data-action="more" data-user-id="${friend.id}">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners for friend actions
        this.setupFriendActionListeners(container);
    }

    renderPendingRequests(data) {
        // Update counts
        document.getElementById('incomingCount').textContent = data.incoming.length;
        document.getElementById('outgoingCount').textContent = data.outgoing.length;

        // Render incoming requests
        const incomingContainer = document.getElementById('incomingRequestsList');
        if (data.incoming.length === 0) {
            incomingContainer.innerHTML = '<div class="empty-state"><p>No incoming friend requests.</p></div>';
        } else {
            incomingContainer.innerHTML = data.incoming.map(request => `
                <div class="friend-item" data-request-id="${request.request_id}">
                    <div class="friend-avatar">
                        <img src="${request.avatar || '/assets/images/default-avatar.png'}" alt="${request.display_name}">
                        <div class="status-indicator status-${request.status}"></div>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name">${request.display_name}</div>
                        <div class="friend-status">Incoming Friend Request</div>
                    </div>
                    <div class="friend-actions">
                        <button class="action-btn accept" title="Accept" data-action="accept" data-request-id="${request.request_id}">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="action-btn decline" title="Ignore" data-action="decline" data-request-id="${request.request_id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Render outgoing requests
        const outgoingContainer = document.getElementById('outgoingRequestsList');
        if (data.outgoing.length === 0) {
            outgoingContainer.innerHTML = '<div class="empty-state"><p>No outgoing friend requests.</p></div>';
        } else {
            outgoingContainer.innerHTML = data.outgoing.map(request => `
                <div class="friend-item" data-request-id="${request.request_id}">
                    <div class="friend-avatar">
                        <img src="${request.avatar || '/assets/images/default-avatar.png'}" alt="${request.display_name}">
                        <div class="status-indicator status-${request.status}"></div>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name">${request.display_name}</div>
                        <div class="friend-status">Outgoing Friend Request</div>
                    </div>
                    <div class="friend-actions">
                        <button class="action-btn cancel" title="Cancel" data-action="cancel" data-request-id="${request.request_id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Add event listeners for request actions
        this.setupRequestActionListeners(incomingContainer, outgoingContainer);
    }

    setupFriendActionListeners(container) {
        container.addEventListener('click', (e) => {
            const button = e.target.closest('.action-btn');
            if (!button) return;

            const action = button.dataset.action;
            const userId = button.dataset.userId;

            switch (action) {
                case 'message':
                    this.startDirectMessage(userId);
                    break;
                case 'more':
                    this.showFriendOptions(userId, button);
                    break;
            }
        });
    }

    setupRequestActionListeners(...containers) {
        containers.forEach(container => {
            container.addEventListener('click', (e) => {
                const button = e.target.closest('.action-btn');
                if (!button) return;

                const action = button.dataset.action;
                const requestId = button.dataset.requestId;

                switch (action) {
                    case 'accept':
                        this.acceptFriendRequest(requestId);
                        break;
                    case 'decline':
                        this.declineFriendRequest(requestId);
                        break;
                    case 'cancel':
                        this.cancelFriendRequest(requestId);
                        break;
                }
            });
        });
    }

    async sendFriendRequest() {
        const usernameInput = document.getElementById('usernameInput');
        const errorDiv = document.getElementById('addFriendError');
        const successDiv = document.getElementById('addFriendSuccess');
        const sendButton = document.getElementById('sendFriendRequest');
        
        const username = usernameInput.value.trim();

        if (!username) {
            this.showError('Please enter a username');
            return;
        }

        // Disable button and show loading
        sendButton.disabled = true;
        sendButton.textContent = 'Sending...';

        try {
            const response = await fetch('/user/home/api/friends.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'send_request',
                    username: username
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Friend request sent successfully!');
                usernameInput.value = '';
                // Update pending requests if on that tab
                if (this.currentTab === 'pending') {
                    this.loadPendingRequests();
                }
            } else {
                this.showError(data.error || 'Failed to send friend request');
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
            console.error('Error sending friend request:', error);
        } finally {
            sendButton.disabled = false;
            sendButton.textContent = 'Send Friend Request';
        }
    }

    async acceptFriendRequest(requestId) {
        try {
            const response = await fetch('/user/home/api/friends.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'accept_request',
                    request_id: requestId
                })
            });

            const data = await response.json();

            if (data.success) {
                // Reload friends lists
                this.loadPendingRequests();
                this.loadAllFriends();
                this.loadOnlineFriends();
            } else {
                this.showError(data.error || 'Failed to accept friend request');
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
            console.error('Error accepting friend request:', error);
        }
    }

    async declineFriendRequest(requestId) {
        try {
            const response = await fetch('/user/home/api/friends.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'decline_request',
                    request_id: requestId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.loadPendingRequests();
            } else {
                this.showError(data.error || 'Failed to decline friend request');
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
            console.error('Error declining friend request:', error);
        }
    }

    async cancelFriendRequest(requestId) {
        try {
            const response = await fetch('/user/home/api/friends.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'cancel_request',
                    request_id: requestId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.loadPendingRequests();
            } else {
                this.showError(data.error || 'Failed to cancel friend request');
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
            console.error('Error cancelling friend request:', error);
        }
    }

    async startDirectMessage(userId) {
        try {
            const response = await fetch('/user/home/api/chat.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create_dm',
                    user_ids: [parseInt(userId)]
                })
            });

            const data = await response.json();

            if (data.room_id) {
                // Switch to chat view
                window.chatManager?.openChat(data.room_id);
            } else {
                this.showError(data.error || 'Failed to create direct message');
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
            console.error('Error creating direct message:', error);
        }
    }

    searchFriends(type, query) {
        if (!query.trim()) {
            this.renderFriendsList(type, this.friends[type]);
            return;
        }

        const filteredFriends = this.friends[type].filter(friend => 
            friend.display_name.toLowerCase().includes(query.toLowerCase()) ||
            friend.username.toLowerCase().includes(query.toLowerCase()) ||
            `${friend.username}#${friend.discriminator}`.toLowerCase().includes(query.toLowerCase())
        );

        this.renderFriendsList(type, filteredFriends);
    }

    searchPendingRequests(query) {
        if (!query.trim()) {
            this.renderPendingRequests(this.friends.pending);
            return;
        }

        const filteredIncoming = this.friends.pending.incoming.filter(request =>
            request.display_name.toLowerCase().includes(query.toLowerCase()) ||
            request.username.toLowerCase().includes(query.toLowerCase()) ||
            `${request.username}#${request.discriminator}`.toLowerCase().includes(query.toLowerCase())
        );

        const filteredOutgoing = this.friends.pending.outgoing.filter(request =>
            request.display_name.toLowerCase().includes(query.toLowerCase()) ||
            request.username.toLowerCase().includes(query.toLowerCase()) ||
            `${request.username}#${request.discriminator}`.toLowerCase().includes(query.toLowerCase())
        );

        this.renderPendingRequests({
            incoming: filteredIncoming,
            outgoing: filteredOutgoing
        });
    }

    updateUserStatus(userId, status) {
        // Update status in all friend lists
        ['online', 'all'].forEach(type => {
            const friend = this.friends[type].find(f => f.id === userId);
            if (friend) {
                friend.status = status;
            }
        });

        // Re-render current tab if it's affected
        if (this.currentTab === 'online' || this.currentTab === 'all') {
            this.loadActiveTab();
        }
    }

    loadActiveTab() {
        switch (this.currentTab) {
            case 'online':
                this.loadOnlineFriends();
                break;
            case 'all':
                this.loadAllFriends();
                break;
            case 'pending':
                this.loadPendingRequests();
                break;
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'online':
                return 'Online';
            case 'away':
                return 'Away';
            case 'busy':
                return 'Do Not Disturb';
            case 'offline':
                return 'Offline';
            default:
                return 'Unknown';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('addFriendError');
        const successDiv = document.getElementById('addFriendSuccess');
        
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        
        if (successDiv) {
            successDiv.style.display = 'none';
        }
    }

    showSuccess(message) {
        const errorDiv = document.getElementById('addFriendError');
        const successDiv = document.getElementById('addFriendSuccess');
        
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
        }
        
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    clearAddFriendForm() {
        const usernameInput = document.getElementById('usernameInput');
        const errorDiv = document.getElementById('addFriendError');
        const successDiv = document.getElementById('addFriendSuccess');
        
        if (usernameInput) usernameInput.value = '';
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
    }

    showFriendOptions(userId, button) {
        // Create context menu for friend options
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="profile">
                <i class="fas fa-user"></i>
                <span>View Profile</span>
            </div>
            <div class="context-menu-item" data-action="message">
                <i class="fas fa-comment"></i>
                <span>Send Message</span>
            </div>
            <div class="context-menu-item" data-action="call">
                <i class="fas fa-phone"></i>
                <span>Call</span>
            </div>
            <div class="context-menu-item danger" data-action="remove">
                <i class="fas fa-user-minus"></i>
                <span>Remove Friend</span>
            </div>
        `;

        // Position the menu
        const rect = button.getBoundingClientRect();
        contextMenu.style.position = 'fixed';
        contextMenu.style.top = `${rect.bottom + 5}px`;
        contextMenu.style.left = `${rect.left}px`;
        contextMenu.style.zIndex = '1000';

        document.body.appendChild(contextMenu);

        // Handle menu item clicks
        contextMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.context-menu-item');
            if (!item) return;

            const action = item.dataset.action;
            switch (action) {
                case 'profile':
                    // Show user profile
                    break;
                case 'message':
                    this.startDirectMessage(userId);
                    break;
                case 'call':
                    // Start voice call
                    break;
                case 'remove':
                    // Remove friend (implement later)
                    break;
            }

            contextMenu.remove();
        });

        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!contextMenu.contains(e.target)) {
                contextMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 10);
    }
}

// Initialize friends manager
window.friendsManager = new FriendsManager();