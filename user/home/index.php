<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MisVord - Home</title>
    <link rel="stylesheet" href="assets/css/styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.2/socket.io.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
    <div class="app-container">
        <!-- Sidebar Navigation -->
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="user-info">
                    <img src="" alt="User Avatar" class="user-avatar" id="currentUserAvatar">
                    <div class="user-details">
                        <span class="username" id="currentUsername">Loading...</span>
                        <span class="discriminator" id="currentDiscriminator">#0000</span>
                    </div>
                </div>
            </div>

            <div class="sidebar-content">
                <!-- Search Bar -->
                <div class="search-container">
                    <input type="text" placeholder="Find or start a conversation..." class="search-input" id="conversationSearch">
                </div>

                <!-- Navigation Tabs -->
                <div class="nav-tabs">
                    <div class="nav-tab active" data-tab="friends">
                        <i class="fas fa-user-friends"></i>
                        <span>Friends</span>
                    </div>
                    <div class="nav-tab" data-tab="nitro">
                        <i class="fas fa-bolt"></i>
                        <span>Nitro</span>
                    </div>
                </div>

                <!-- Direct Messages Section -->
                <div class="direct-messages">
                    <div class="section-header">
                        <span>DIRECT MESSAGES</span>
                        <button class="create-dm-btn" id="createDMBtn">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="dm-list" id="directMessagesList">
                        <!-- Direct messages will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- User Panel -->
            <div class="user-panel">
                <div class="user-info-panel">
                    <img src="" alt="Avatar" class="panel-avatar" id="panelUserAvatar">
                    <div class="user-status">
                        <span class="panel-username" id="panelUsername">Loading...</span>
                        <span class="panel-discriminator" id="panelDiscriminator">#0000</span>
                    </div>
                </div>
                <div class="user-controls">
                    <button class="control-btn" title="Mute"><i class="fas fa-microphone-slash"></i></button>
                    <button class="control-btn" title="Deafen"><i class="fas fa-headphones"></i></button>
                    <button class="control-btn" title="Settings"><i class="fas fa-cog"></i></button>
                </div>
            </div>
        </div>

        <!-- Main Content Area -->
        <div class="main-content">
            <!-- Friends Section -->
            <div class="friends-section" id="friendsSection">
                <div class="friends-header">
                    <h2><i class="fas fa-user-friends"></i> Friends</h2>
                    <div class="friends-tabs">
                        <button class="friends-tab active" data-tab="online">Online</button>
                        <button class="friends-tab" data-tab="all">All</button>
                        <button class="friends-tab" data-tab="pending">Pending</button>
                        <button class="friends-tab add-friend" data-tab="add">Add Friend</button>
                    </div>
                </div>

                <div class="friends-content">
                    <!-- Online Tab -->
                    <div class="tab-content active" id="onlineTab">
                        <div class="search-container">
                            <input type="text" placeholder="Search online friends..." class="search-input" id="onlineSearch">
                        </div>
                        <div class="friends-list" id="onlineFriendsList">
                            <!-- Online friends will be loaded here -->
                        </div>
                    </div>

                    <!-- All Tab -->
                    <div class="tab-content" id="allTab">
                        <div class="search-container">
                            <input type="text" placeholder="Search all friends..." class="search-input" id="allSearch">
                        </div>
                        <div class="friends-list" id="allFriendsList">
                            <!-- All friends will be loaded here -->
                        </div>
                    </div>

                    <!-- Pending Tab -->
                    <div class="tab-content" id="pendingTab">
                        <div class="search-container">
                            <input type="text" placeholder="Search requests..." class="search-input" id="pendingSearch">
                        </div>
                        <div class="pending-sections">
                            <div class="pending-section">
                                <h3>INCOMING FRIEND REQUESTS — <span id="incomingCount">0</span></h3>
                                <div class="friends-list" id="incomingRequestsList">
                                    <!-- Incoming requests will be loaded here -->
                                </div>
                            </div>
                            <div class="pending-section">
                                <h3>OUTGOING FRIEND REQUESTS — <span id="outgoingCount">0</span></h3>
                                <div class="friends-list" id="outgoingRequestsList">
                                    <!-- Outgoing requests will be loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Add Friend Tab -->
                    <div class="tab-content" id="addTab">
                        <div class="add-friend-container">
                            <h3>Add Friend</h3>
                            <p>You can add friends with their MisVord username or full username#discriminator.</p>
                            <div class="add-friend-form">
                                <label for="usernameInput">ADD FRIEND</label>
                                <div class="input-group">
                                    <input type="text" id="usernameInput" placeholder="Username#XXXX" maxlength="37">
                                    <button type="button" id="sendFriendRequest">Send Friend Request</button>
                                </div>
                                <div class="error-message" id="addFriendError"></div>
                                <div class="success-message" id="addFriendSuccess"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Chat Section -->
            <div class="chat-section hidden" id="chatSection">
                <div class="chat-header">
                    <div class="chat-info">
                        <div class="chat-icon">
                            <i class="fas fa-at"></i>
                        </div>
                        <div class="chat-details">
                            <span class="chat-name" id="chatName">Select a conversation</span>
                            <span class="chat-status" id="chatStatus"></span>
                        </div>
                    </div>
                    <div class="chat-controls">
                        <button class="control-btn"><i class="fas fa-phone"></i></button>
                        <button class="control-btn"><i class="fas fa-video"></i></button>
                        <button class="control-btn"><i class="fas fa-user-plus"></i></button>
                        <button class="control-btn"><i class="fas fa-search"></i></button>
                        <button class="control-btn"><i class="fas fa-inbox"></i></button>
                        <button class="control-btn"><i class="fas fa-question-circle"></i></button>
                    </div>
                </div>

                <div class="chat-messages" id="chatMessages">
                    <!-- Messages will be loaded here -->
                </div>

                <div class="typing-indicator hidden" id="typingIndicator">
                    <span id="typingText"></span>
                </div>

                <div class="message-input-container">
                    <div class="reply-context hidden" id="replyContext">
                        <div class="reply-info">
                            <span>Replying to <strong id="replyUsername"></strong></span>
                            <span class="reply-content" id="replyContent"></span>
                        </div>
                        <button class="cancel-reply" id="cancelReply">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="file-preview-container hidden" id="filePreviewContainer">
                        <div class="file-previews" id="filePreviews">
                            <!-- File previews will appear here -->
                        </div>
                    </div>
                    <div class="message-input">
                        <button class="attachment-btn" id="attachmentBtn">
                            <i class="fas fa-plus"></i>
                        </button>
                        <input type="file" id="fileInput" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" style="display: none;">
                        <div class="input-wrapper">
                            <textarea placeholder="Message..." id="messageInput" rows="1"></textarea>
                        </div>
                        <div class="message-actions">
                            <button class="action-btn" id="emojiBtn"><i class="fas fa-smile"></i></button>
                            <button class="action-btn" id="sendBtn"><i class="fas fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Active Now Section -->
        <div class="active-now-section" id="activeNowSection">
            <div class="active-now-header">
                <h3>Active Now</h3>
            </div>
            <div class="active-now-list" id="activeNowList">
                <!-- Active users will be loaded here -->
            </div>
        </div>
    </div>

    <!-- Modals -->
    <!-- Create Direct Message Modal -->
    <div class="modal hidden" id="createDMModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>New Direct Message</h3>
                <button class="modal-close" id="closeDMModal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="select-users-section">
                    <label>SELECT USERS</label>
                    <div class="search-container">
                        <input type="text" placeholder="Search friends..." id="dmUserSearch">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="selected-users" id="selectedUsers">
                        <span class="selected-count">SELECTED USERS (0):</span>
                        <div class="selected-user-tags" id="selectedUserTags">
                            <!-- Selected user tags will appear here -->
                        </div>
                    </div>
                    <div class="user-list" id="dmUserList">
                        <!-- Friends list for DM selection -->
                    </div>
                </div>
                <div class="group-settings hidden" id="groupSettings">
                    <label>GROUP NAME</label>
                    <input type="text" placeholder="Enter group name" id="groupNameInput">
                    <label>GROUP IMAGE</label>
                    <p>We recommend an image of at least 512×512.</p>
                    <div class="group-image-upload">
                        <div class="image-placeholder" id="groupImagePlaceholder">
                            <i class="fas fa-camera"></i>
                        </div>
                        <input type="file" id="groupImageInput" accept="image/*" style="display: none;">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="cancelDM">Cancel</button>
                <button class="btn-primary" id="createDMBtn">Create Message</button>
            </div>
        </div>
    </div>

    <!-- Delete Message Confirmation Modal -->
    <div class="modal hidden" id="deleteMessageModal">
        <div class="modal-content small">
            <div class="modal-header">
                <h3>Delete Message</h3>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this message? This cannot be undone.</p>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="cancelDelete">Cancel</button>
                <button class="btn-danger" id="confirmDelete">Delete</button>
            </div>
        </div>
    </div>

    <!-- Emoji Picker -->
    <div class="emoji-picker hidden" id="emojiPicker">
        <div class="emoji-categories">
            <button class="emoji-category active" data-category="smileys">😀</button>
            <button class="emoji-category" data-category="people">👋</button>
            <button class="emoji-category" data-category="nature">🌱</button>
            <button class="emoji-category" data-category="food">🍎</button>
            <button class="emoji-category" data-category="activities">⚽</button>
            <button class="emoji-category" data-category="travel">🚗</button>
            <button class="emoji-category" data-category="objects">💡</button>
            <button class="emoji-category" data-category="symbols">❤️</button>
            <button class="emoji-category" data-category="flags">🏁</button>
        </div>
        <div class="emoji-grid" id="emojiGrid">
            <!-- Emojis will be loaded here -->
        </div>
    </div>

    <script src="assets/js/socket-client.js"></script>
    <script src="assets/js/home.js"></script>
    <script src="assets/js/chat.js"></script>
    <script src="assets/js/friends.js"></script>
    <script src="assets/js/emoji.js"></script>
</body>
</html>