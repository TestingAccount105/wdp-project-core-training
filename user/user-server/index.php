<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: /auth/login.php');
    exit;
}

$user_id = $_SESSION['user_id'];
$username = $_SESSION['username'] ?? 'User';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MisVord - Servers</title>
    <link rel="stylesheet" href="assets/css/server.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.2/socket.io.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/cropperjs@1.5.12/dist/cropper.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/cropperjs@1.5.12/dist/cropper.min.css">
</head>
<body>
    <div class="app-container">
        <!-- Server Sidebar -->
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

        <!-- Main Server Content -->
        <div class="server-content" id="serverContent">
            <!-- Server Header -->
            <div class="server-header" id="serverHeader">
                <div class="server-info">
                    <h2 id="serverName">Select a Server</h2>
                    <div class="server-dropdown" id="serverDropdown">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="server-search">
                    <input type="text" placeholder="Search messages in server" id="serverSearchInput">
                    <i class="fas fa-search"></i>
                </div>
            </div>

            <!-- Server Body -->
            <div class="server-body">
                <!-- Channels Sidebar -->
                <div class="channels-sidebar" id="channelsSidebar">
                    <div class="channels-header">
                        <div class="server-name-display" id="serverNameDisplay">
                            Select a Server
                        </div>
                        <div class="server-actions" id="serverActions">
                            <!-- Server actions will appear here when server is selected -->
                        </div>
                    </div>
                    
                    <div class="channels-list" id="channelsList">
                        <!-- Channels will be loaded here -->
                    </div>
                    
                    <!-- User Panel -->
                    <div class="user-panel">
                        <div class="user-info">
                            <img id="userAvatar" src="" alt="Avatar" class="user-avatar">
                            <div class="user-details">
                                <span class="username" id="currentUsername"><?php echo htmlspecialchars($username); ?></span>
                                <span class="discriminator" id="currentDiscriminator">#0000</span>
                            </div>
                        </div>
                        <div class="user-controls">
                            <button class="control-btn" id="muteBtn" title="Mute">
                                <i class="fas fa-microphone"></i>
                            </button>
                            <button class="control-btn" id="deafenBtn" title="Deafen">
                                <i class="fas fa-headphones"></i>
                            </button>
                            <button class="control-btn" id="settingsBtn" title="User Settings">
                                <i class="fas fa-cog"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Main Chat Area -->
                <div class="chat-area" id="chatArea">
                    <!-- Channel Header -->
                    <div class="channel-header" id="channelHeader">
                        <div class="channel-info">
                            <div class="channel-icon" id="channelIcon">
                                <i class="fas fa-hashtag"></i>
                            </div>
                            <div class="channel-details">
                                <span class="channel-name" id="channelName">Select a channel</span>
                                <span class="channel-description" id="channelDescription"></span>
                            </div>
                        </div>
                        <div class="channel-controls">
                            <button class="control-btn" id="startCallBtn" title="Start Call">
                                <i class="fas fa-phone"></i>
                            </button>
                            <button class="control-btn" id="startVideoBtn" title="Start Video Call">
                                <i class="fas fa-video"></i>
                            </button>
                            <button class="control-btn" id="invitePeopleBtn" title="Invite People">
                                <i class="fas fa-user-plus"></i>
                            </button>
                            <button class="control-btn" id="channelSearchBtn" title="Search">
                                <i class="fas fa-search"></i>
                            </button>
                            <button class="control-btn" id="notificationBtn" title="Notification Settings">
                                <i class="fas fa-bell"></i>
                            </button>
                            <button class="control-btn" id="helpBtn" title="Help">
                                <i class="fas fa-question-circle"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Messages Area -->
                    <div class="messages-container" id="messagesContainer">
                        <div class="messages-list" id="messagesList">
                            <!-- Messages will be loaded here -->
                        </div>
                        
                        <!-- Voice Channel Interface -->
                        <div class="voice-interface hidden" id="voiceInterface">
                            <div class="voice-header">
                                <h3>Voice Channel</h3>
                                <button class="btn-secondary" id="leaveVoiceBtn">
                                    <i class="fas fa-sign-out-alt"></i> Leave
                                </button>
                            </div>
                            <div class="voice-participants" id="voiceParticipants">
                                <!-- Voice participants will appear here -->
                            </div>
                            <div class="voice-controls">
                                <button class="voice-control-btn" id="toggleVideoBtn" title="Toggle Video">
                                    <i class="fas fa-video-slash"></i>
                                </button>
                                <button class="voice-control-btn" id="toggleScreenShareBtn" title="Share Screen">
                                    <i class="fas fa-desktop"></i>
                                </button>
                                <button class="voice-control-btn" id="toggleMicBtn" title="Toggle Microphone">
                                    <i class="fas fa-microphone"></i>
                                </button>
                                <button class="voice-control-btn" id="toggleDeafenBtn" title="Toggle Deafen">
                                    <i class="fas fa-headphones"></i>
                                </button>
                                <button class="voice-control-btn" id="activitiesBtn" title="Activities">
                                    <i class="fas fa-gamepad"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Typing Indicator -->
                    <div class="typing-indicator hidden" id="typingIndicator">
                        <span id="typingText"></span>
                    </div>

                    <!-- Message Input -->
                    <div class="message-input-container" id="messageInputContainer">
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
                            <div class="file-previews" id="filePreviews"></div>
                        </div>
                        <div class="message-input">
                            <button class="attachment-btn" id="attachmentBtn">
                                <i class="fas fa-plus"></i>
                            </button>
                            <input type="file" id="fileInput" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" style="display: none;">
                            <div class="input-wrapper">
                                <textarea placeholder="Message #channel..." id="messageInput" rows="1"></textarea>
                            </div>
                            <div class="message-actions">
                                <button class="action-btn" id="emojiBtn"><i class="fas fa-smile"></i></button>
                                <button class="action-btn" id="sendBtn"><i class="fas fa-paper-plane"></i></button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Members Sidebar -->
                <div class="members-sidebar" id="membersSidebar">
                    <div class="members-header">
                        <div class="search-container">
                            <input type="text" placeholder="Search members" id="membersSearch">
                            <i class="fas fa-search"></i>
                        </div>
                    </div>
                    <div class="members-list" id="membersList">
                        <!-- Members will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Server Dropdown Menu -->
    <div class="dropdown-menu hidden" id="serverDropdownMenu">
        <div class="dropdown-item" id="invitePeopleDropdown">
            <i class="fas fa-user-plus"></i>
            <span>Invite People</span>
        </div>
        <div class="dropdown-item" id="serverSettingsDropdown">
            <i class="fas fa-cog"></i>
            <span>Server Settings</span>
        </div>
        <div class="dropdown-item" id="createChannelDropdown">
            <i class="fas fa-plus"></i>
            <span>Create Channel</span>
        </div>
        <div class="dropdown-separator"></div>
        <div class="dropdown-item danger" id="leaveServerDropdown">
            <i class="fas fa-sign-out-alt"></i>
            <span>Leave Server</span>
        </div>
    </div>

    <!-- Modals -->
    <?php include 'modals/create-server-modal.php'; ?>
    <?php include 'modals/user-settings-modal.php'; ?>
    <?php include 'modals/server-settings-modal.php'; ?>
    <?php include 'modals/invite-people-modal.php'; ?>
    <?php include 'modals/create-channel-modal.php'; ?>
    <?php include 'modals/confirmation-modal.php'; ?>

    <!-- Scripts -->
    <script src="assets/js/socket-client.js"></script>
    <script src="assets/js/server.js"></script>
    <script src="assets/js/channels.js"></script>
    <script src="assets/js/voice.js"></script>
    <script src="assets/js/modals.js"></script>
    <script>
        // Initialize with user data
        window.currentUser = {
            id: <?php echo $user_id; ?>,
            username: '<?php echo htmlspecialchars($username); ?>'
        };
    </script>
</body>
</html>