// Main Server Application Logic
class ServerApp {
    constructor() {
        this.currentServer = null;
        this.currentChannel = null;
        this.userServers = [];
        this.socket = null;
        this.cropper = null;
        this.currentCropTarget = null;
        
        this.init();
    }

    init() {
        this.initializeSocket();
        this.loadUserServers();
        this.loadUserData();
        this.bindEvents();
        this.initializeTooltips();
    }

    initializeSocket() {
        // Initialize Socket.IO connection
        this.socket = io({
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateUserStatus('online');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateUserStatus('offline');
        });

        // Server-related socket events
        this.socket.on('server_updated', (data) => {
            this.handleServerUpdate(data);
        });

        this.socket.on('channel_created', (data) => {
            this.handleChannelCreated(data);
        });

        this.socket.on('channel_updated', (data) => {
            this.handleChannelUpdated(data);
        });

        this.socket.on('channel_deleted', (data) => {
            this.handleChannelDeleted(data);
        });

        this.socket.on('member_joined', (data) => {
            this.handleMemberJoined(data);
        });

        this.socket.on('member_left', (data) => {
            this.handleMemberLeft(data);
        });

        this.socket.on('member_updated', (data) => {
            this.handleMemberUpdated(data);
        });
    }

    bindEvents() {
        // Server dropdown
        $('#serverDropdown').on('click', (e) => {
            e.stopPropagation();
            this.toggleServerDropdown();
        });

        // Close dropdown when clicking outside
        $(document).on('click', () => {
            this.closeServerDropdown();
        });

        // Dropdown menu items
        $('#invitePeopleDropdown').on('click', () => {
            this.openInvitePeopleModal();
        });

        $('#serverSettingsDropdown').on('click', () => {
            this.openServerSettingsModal();
        });

        $('#createChannelDropdown').on('click', () => {
            this.openCreateChannelModal();
        });

        $('#leaveServerDropdown').on('click', () => {
            this.openLeaveServerModal();
        });

        // User controls
        $('#settingsBtn').on('click', () => {
            this.openUserSettingsModal();
        });

        $('#muteBtn').on('click', () => {
            this.toggleMute();
        });

        $('#deafenBtn').on('click', () => {
            this.toggleDeafen();
        });

        // Server search
        $('#serverSearchInput').on('input', (e) => {
            this.searchMessages(e.target.value);
        });

        // Members search
        $('#membersSearch').on('input', (e) => {
            this.searchMembers(e.target.value);
        });

        // Window resize
        $(window).on('resize', () => {
            this.handleResize();
        });
    }

    initializeTooltips() {
        // Initialize tooltips for server items
        $('.server-item[data-tooltip]').each(function() {
            const tooltip = $(this).attr('data-tooltip');
            $(this).on('mouseenter', function() {
                $(this).attr('title', tooltip);
            });
        });
    }

    async loadUserServers() {
        try {
            const response = await fetch('/user/user-server/api/servers.php?action=getUserServers');
            const data = await response.json();
            
            if (data.success) {
                this.userServers = data.servers;
                this.renderUserServers();
            } else {
                this.showToast('Error loading servers', 'error');
            }
        } catch (error) {
            console.error('Error loading user servers:', error);
            this.showToast('Failed to load servers', 'error');
        }
    }

    renderUserServers() {
        const container = $('#userServersList');
        container.empty();

        this.userServers.forEach(server => {
            const serverItem = $(`
                <div class="server-item" data-server-id="${server.ID}" data-tooltip="${server.Name}">
                    <div class="server-icon">
                        ${server.IconServer ? 
                            `<img src="${server.IconServer}" alt="${server.Name}">` : 
                            server.Name.charAt(0).toUpperCase()
                        }
                    </div>
                </div>
            `);

            serverItem.on('click', () => {
                this.selectServer(server.ID);
            });

            container.append(serverItem);
        });
    }

    async selectServer(serverId) {
        try {
            // Remove active class from all server items
            $('.server-item').removeClass('active');
            
            // Add active class to selected server
            $(`.server-item[data-server-id="${serverId}"]`).addClass('active');

            const response = await fetch(`/user/user-server/api/servers.php?action=getServer&id=${serverId}`);
            const data = await response.json();
            
            if (data.success) {
                this.currentServer = data.server;
                this.updateServerHeader();
                this.loadServerChannels();
                this.loadServerMembers();
                this.joinServerRoom();
            } else {
                this.showToast('Error loading server', 'error');
            }
        } catch (error) {
            console.error('Error selecting server:', error);
            this.showToast('Failed to load server', 'error');
        }
    }

    updateServerHeader() {
        if (!this.currentServer) return;

        $('#serverName').text(this.currentServer.Name);
        $('#serverNameDisplay').text(this.currentServer.Name);
        
        // Update server actions based on user role
        this.updateServerActions();
    }

    updateServerActions() {
        const actions = $('#serverActions');
        actions.empty();

        if (this.currentServer && this.currentServer.userRole) {
            if (this.currentServer.userRole === 'Owner' || this.currentServer.userRole === 'Admin') {
                actions.append(`
                    <button class="control-btn" title="Server Settings" onclick="serverApp.openServerSettingsModal()">
                        <i class="fas fa-cog"></i>
                    </button>
                `);
            }
        }
    }

    async loadServerChannels() {
        if (!this.currentServer) return;

        try {
            const response = await fetch(`/user/user-server/api/channels.php?action=getChannels&serverId=${this.currentServer.ID}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderChannels(data.channels);
            } else {
                this.showToast('Error loading channels', 'error');
            }
        } catch (error) {
            console.error('Error loading channels:', error);
            this.showToast('Failed to load channels', 'error');
        }
    }

    renderChannels(channels) {
        const container = $('#channelsList');
        container.empty();

        // Group channels by type
        const textChannels = channels.filter(c => c.Type === 'Text');
        const voiceChannels = channels.filter(c => c.Type === 'Voice');

        // Render text channels
        if (textChannels.length > 0) {
            container.append(`
                <div class="channel-category">
                    <div class="category-header">
                        <span class="category-name">Text Channels</span>
                    </div>
                </div>
            `);

            textChannels.forEach(channel => {
                const channelItem = $(`
                    <div class="channel-item" data-channel-id="${channel.ID}" data-channel-type="${channel.Type}">
                        <div class="channel-icon">
                            <i class="fas fa-hashtag"></i>
                        </div>
                        <span class="channel-name">${channel.Name}</span>
                    </div>
                `);

                channelItem.on('click', () => {
                    this.selectChannel(channel.ID, channel.Type);
                });

                container.append(channelItem);
            });
        }

        // Render voice channels
        if (voiceChannels.length > 0) {
            container.append(`
                <div class="channel-category">
                    <div class="category-header">
                        <span class="category-name">Voice Channels</span>
                    </div>
                </div>
            `);

            voiceChannels.forEach(channel => {
                const channelItem = $(`
                    <div class="channel-item" data-channel-id="${channel.ID}" data-channel-type="${channel.Type}">
                        <div class="channel-icon">
                            <i class="fas fa-volume-up"></i>
                        </div>
                        <span class="channel-name">${channel.Name}</span>
                        <span class="voice-participants-count hidden">0</span>
                    </div>
                `);

                channelItem.on('click', () => {
                    this.selectChannel(channel.ID, channel.Type);
                });

                container.append(channelItem);
            });
        }

        // Select first channel by default
        if (channels.length > 0 && !this.currentChannel) {
            this.selectChannel(channels[0].ID, channels[0].Type);
        }
    }

    async selectChannel(channelId, channelType) {
        try {
            // Remove active class from all channel items
            $('.channel-item').removeClass('active');
            
            // Add active class to selected channel
            $(`.channel-item[data-channel-id="${channelId}"]`).addClass('active');

            const response = await fetch(`/user/user-server/api/channels.php?action=getChannel&id=${channelId}`);
            const data = await response.json();
            
            if (data.success) {
                this.currentChannel = data.channel;
                this.updateChannelHeader();
                
                if (channelType === 'Text') {
                    this.loadChannelMessages();
                    this.showTextInterface();
                } else if (channelType === 'Voice') {
                    this.showVoiceInterface();
                }
                
                this.joinChannelRoom();
            } else {
                this.showToast('Error loading channel', 'error');
            }
        } catch (error) {
            console.error('Error selecting channel:', error);
            this.showToast('Failed to load channel', 'error');
        }
    }

    updateChannelHeader() {
        if (!this.currentChannel) return;

        const icon = this.currentChannel.Type === 'Text' ? 'fas fa-hashtag' : 'fas fa-volume-up';
        
        $('#channelIcon').html(`<i class="${icon}"></i>`);
        $('#channelName').text(this.currentChannel.Name);
        
        // Update message input placeholder
        $('#messageInput').attr('placeholder', `Message #${this.currentChannel.Name}...`);
    }

    showTextInterface() {
        $('#voiceInterface').addClass('hidden');
        $('#messageInputContainer').removeClass('hidden');
        $('#messagesList').removeClass('hidden');
    }

    showVoiceInterface() {
        $('#voiceInterface').removeClass('hidden');
        $('#messageInputContainer').addClass('hidden');
        $('#messagesList').addClass('hidden');
    }

    async loadServerMembers() {
        if (!this.currentServer) return;

        try {
            const response = await fetch(`/user/user-server/api/members.php?action=getMembers&serverId=${this.currentServer.ID}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderMembers(data.members);
            } else {
                this.showToast('Error loading members', 'error');
            }
        } catch (error) {
            console.error('Error loading members:', error);
            this.showToast('Failed to load members', 'error');
        }
    }

    renderMembers(members) {
        const container = $('#membersList');
        container.empty();

        // Group members by role
        const groupedMembers = {
            'Owner': members.filter(m => m.Role === 'Owner'),
            'Admin': members.filter(m => m.Role === 'Admin'),
            'Bot': members.filter(m => m.Role === 'Bot'),
            'Member': members.filter(m => m.Role === 'Member'),
            'Offline': members.filter(m => m.Status === 'offline')
        };

        Object.entries(groupedMembers).forEach(([role, roleMembers]) => {
            if (roleMembers.length === 0) return;

            const group = $(`
                <div class="member-group">
                    <div class="member-group-header">${role} — ${roleMembers.length}</div>
                </div>
            `);

            roleMembers.forEach(member => {
                const memberItem = $(`
                    <div class="member-item" data-member-id="${member.ID}">
                        <img src="${member.ProfilePictureUrl || '/assets/images/default-avatar.png'}" 
                             alt="${member.Username}" class="member-avatar">
                        <div class="member-status ${member.Status || 'offline'}"></div>
                        <div class="member-info">
                            <div class="member-name">${member.DisplayName || member.Username}</div>
                            <div class="member-activity">${member.Activity || ''}</div>
                        </div>
                        ${member.Role !== 'Member' ? `<span class="member-role-badge">${member.Role}</span>` : ''}
                    </div>
                `);

                group.append(memberItem);
            });

            container.append(group);
        });
    }

    toggleServerDropdown() {
        const dropdown = $('#serverDropdownMenu');
        const isVisible = !dropdown.hasClass('hidden');
        
        if (isVisible) {
            this.closeServerDropdown();
        } else {
            this.openServerDropdown();
        }
    }

    openServerDropdown() {
        const dropdown = $('#serverDropdownMenu');
        const serverDropdown = $('#serverDropdown');
        
        // Position dropdown
        const rect = serverDropdown[0].getBoundingClientRect();
        dropdown.css({
            top: rect.bottom + 8,
            left: rect.left
        });
        
        dropdown.removeClass('hidden');
    }

    closeServerDropdown() {
        $('#serverDropdownMenu').addClass('hidden');
    }

    searchMessages(query) {
        // Implement server-wide message search
        if (!query.trim()) return;
        
        // This would search across all channels in the server
        console.log('Searching for:', query);
    }

    searchMembers(query) {
        const memberItems = $('.member-item');
        
        if (!query.trim()) {
            memberItems.show();
            return;
        }
        
        memberItems.each(function() {
            const memberName = $(this).find('.member-name').text().toLowerCase();
            const matches = memberName.includes(query.toLowerCase());
            $(this).toggle(matches);
        });
    }

    toggleMute() {
        const btn = $('#muteBtn');
        const icon = btn.find('i');
        
        if (icon.hasClass('fa-microphone')) {
            icon.removeClass('fa-microphone').addClass('fa-microphone-slash');
            btn.addClass('active');
        } else {
            icon.removeClass('fa-microphone-slash').addClass('fa-microphone');
            btn.removeClass('active');
        }
    }

    toggleDeafen() {
        const btn = $('#deafenBtn');
        const icon = btn.find('i');
        
        if (icon.hasClass('fa-headphones')) {
            icon.removeClass('fa-headphones').addClass('fa-deaf');
            btn.addClass('active');
        } else {
            icon.removeClass('fa-deaf').addClass('fa-headphones');
            btn.removeClass('active');
        }
    }

    joinServerRoom() {
        if (this.currentServer && this.socket) {
            this.socket.emit('join_server', { serverId: this.currentServer.ID });
        }
    }

    joinChannelRoom() {
        if (this.currentChannel && this.socket) {
            this.socket.emit('join_channel', { channelId: this.currentChannel.ID });
        }
    }

    updateUserStatus(status) {
        if (this.socket) {
            this.socket.emit('update_status', { status });
        }
    }

    async loadUserData() {
        try {
            const response = await fetch('/user/user-server/api/user.php?action=getCurrentUser');
            const data = await response.json();
            
            if (data.success) {
                const user = data.user;
                $('#currentUsername').text(user.Username);
                $('#currentDiscriminator').text(`#${user.Discriminator}`);
                $('#userAvatar').attr('src', user.ProfilePictureUrl || '/assets/images/default-avatar.png');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    handleResize() {
        // Handle responsive behavior
        const width = $(window).width();
        
        if (width < 768) {
            // Mobile view adjustments
            $('.members-sidebar').addClass('hidden');
        } else {
            $('.members-sidebar').removeClass('hidden');
        }
    }

    // Socket event handlers
    handleServerUpdate(data) {
        if (this.currentServer && this.currentServer.ID === data.serverId) {
            this.currentServer = { ...this.currentServer, ...data.updates };
            this.updateServerHeader();
        }
        
        // Update server in sidebar
        const serverItem = $(`.server-item[data-server-id="${data.serverId}"]`);
        if (data.updates.Name) {
            serverItem.attr('data-tooltip', data.updates.Name);
        }
        if (data.updates.IconServer) {
            serverItem.find('.server-icon').html(`<img src="${data.updates.IconServer}" alt="${data.updates.Name}">`);
        }
    }

    handleChannelCreated(data) {
        if (this.currentServer && this.currentServer.ID === data.serverId) {
            this.loadServerChannels();
        }
    }

    handleChannelUpdated(data) {
        if (this.currentServer && this.currentServer.ID === data.serverId) {
            this.loadServerChannels();
        }
    }

    handleChannelDeleted(data) {
        if (this.currentServer && this.currentServer.ID === data.serverId) {
            if (this.currentChannel && this.currentChannel.ID === data.channelId) {
                this.currentChannel = null;
                $('#channelName').text('Select a channel');
                $('#messagesList').empty();
            }
            this.loadServerChannels();
        }
    }

    handleMemberJoined(data) {
        if (this.currentServer && this.currentServer.ID === data.serverId) {
            this.loadServerMembers();
            this.showToast(`${data.member.Username} joined the server`, 'success');
        }
    }

    handleMemberLeft(data) {
        if (this.currentServer && this.currentServer.ID === data.serverId) {
            this.loadServerMembers();
            this.showToast(`${data.member.Username} left the server`, 'warning');
        }
    }

    handleMemberUpdated(data) {
        if (this.currentServer && this.currentServer.ID === data.serverId) {
            this.loadServerMembers();
        }
    }

    showToast(message, type = 'info') {
        const toast = $(`
            <div class="toast ${type}">
                <div class="toast-icon">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                                   type === 'error' ? 'fa-exclamation-circle' : 
                                   type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
                </div>
                <div class="toast-message">${message}</div>
                <button class="toast-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `);

        toast.find('.toast-close').on('click', () => {
            toast.remove();
        });

        $('#toastContainer').append(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    // Modal functions (will be called by modal.js)
    openCreateServerModal() {
        $('#createServerModal').removeClass('hidden');
    }

    openUserSettingsModal() {
        $('#userSettingsModal').removeClass('hidden');
    }

    openServerSettingsModal() {
        if (this.currentServer) {
            $('#serverSettingsModal').removeClass('hidden');
            // Initialize server settings with current server data
            window.serverSettings.loadServerData(this.currentServer);
        }
    }

    openInvitePeopleModal() {
        if (this.currentServer) {
            $('#invitePeopleModal').removeClass('hidden');
            // Initialize invite modal with current server
            window.inviteSystem.loadServerInvites(this.currentServer.ID);
        }
    }

    openCreateChannelModal() {
        if (this.currentServer) {
            $('#createChannelModal').removeClass('hidden');
        }
    }

    openLeaveServerModal() {
        if (this.currentServer) {
            $('#leaveServerModal').removeClass('hidden');
            // Initialize leave server modal
            window.serverSettings.initializeLeaveServerModal(this.currentServer);
        }
    }
}

// Navigation functions
function navigateToHome() {
    window.location.href = '/user/home/';
}

function navigateToExplore() {
    window.location.href = '/user/explore/';
}

function openCreateServerModal() {
    serverApp.openCreateServerModal();
}

function closeCreateServerModal() {
    $('#createServerModal').addClass('hidden');
}

function createServer() {
    // Get form data and submit
    const form = document.getElementById('createServerForm');
    const formData = new FormData(form);
    
    // Add action
    formData.append('action', 'createServer');
    
    fetch('/user/user-server/api/servers.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            serverApp.showToast('Server created successfully!', 'success');
            closeCreateServerModal();
            serverApp.loadUserServers();
            form.reset();
        } else {
            serverApp.showToast(data.error || 'Failed to create server', 'error');
        }
    })
    .catch(error => {
        console.error('Error creating server:', error);
        serverApp.showToast('Failed to create server', 'error');
    });
}

function closeCropperModal() {
    $('#imageCropperModal').addClass('hidden');
}

function applyCrop() {
    // Apply crop functionality would go here
    // For now, just close the modal
    closeCropperModal();
}

// Modal functions for confirmation modal
function closeConfirmationModal() {
    $('#confirmationModal').addClass('hidden');
}

function executeConfirmationAction() {
    // This function should be customized based on what action is being confirmed
    // For now, just close the modal
    closeConfirmationModal();
}

// Modal functions for leave server modal
function closeLeaveServerModal() {
    $('#leaveServerModal').addClass('hidden');
}

function leaveServer() {
    if (!serverApp.currentServer) return;
    
    // Call the server API to leave the server
    fetch('/user/user-server/api/servers.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=leaveServer&serverId=${serverApp.currentServer.ID}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            serverApp.showToast('Left server successfully', 'success');
            closeLeaveServerModal();
            serverApp.loadUserServers();
            // Redirect to home or select another server
            window.location.href = '/user/home/';
        } else {
            serverApp.showToast(data.error || 'Failed to leave server', 'error');
        }
    })
    .catch(error => {
        console.error('Error leaving server:', error);
        serverApp.showToast('Failed to leave server', 'error');
    });
}

function deleteServerFromLeave() {
    if (!serverApp.currentServer) return;
    
    // Call the server API to delete the server
    fetch('/user/user-server/api/servers.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=deleteServer&serverId=${serverApp.currentServer.ID}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            serverApp.showToast('Server deleted successfully', 'success');
            closeLeaveServerModal();
            serverApp.loadUserServers();
            // Redirect to home
            window.location.href = '/user/home/';
        } else {
            serverApp.showToast(data.error || 'Failed to delete server', 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting server:', error);
        serverApp.showToast('Failed to delete server', 'error');
    });
}

// Initialize the application
let serverApp;

$(document).ready(() => {
    serverApp = new ServerApp();
});

// Export for use in other files
window.serverApp = serverApp;

// Additional Modal Functions

// Close user settings modal
function closeUserSettingsModal() {
    document.getElementById('userSettingsModal').classList.add('hidden');
}

// Channel Management Functions
function closeCreateChannelModal() {
    document.getElementById('createChannelModal').classList.add('hidden');
}

function createChannel() {
    // Get form data
    const channelName = document.getElementById('channelName').value.trim();
    const channelType = document.querySelector('input[name="channelType"]:checked').value;
    const channelDescription = document.getElementById('channelDescription').value.trim();
    
    if (!channelName) {
        alert('Channel name is required');
        return;
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('action', 'create_channel');
    formData.append('name', channelName);
    formData.append('type', channelType);
    formData.append('description', channelDescription);
    formData.append('server_id', currentServerId);
    
    fetch('api/channel.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeCreateChannelModal();
            // Refresh channel list
            location.reload();
        } else {
            alert(data.message || 'Failed to create channel');
        }
    })
    .catch(error => {
        console.error('Error creating channel:', error);
        alert('Failed to create channel');
    });
}

// Invite People Functions
function closeInvitePeopleModal() {
    document.getElementById('invitePeopleModal').classList.add('hidden');
}

function copyInviteLink() {
    const inviteLink = document.getElementById('inviteLink');
    inviteLink.select();
    document.execCommand('copy');
    
    const copyBtn = document.getElementById('copyInviteBtn');
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
        copyBtn.innerHTML = originalText;
    }, 2000);
}

function regenerateInviteLink() {
    const formData = new FormData();
    formData.append('action', 'regenerate_invite');
    formData.append('server_id', currentServerId);
    
    fetch('api/invite.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('inviteLink').value = data.invite_link;
        } else {
            alert(data.message || 'Failed to regenerate invite link');
        }
    })
    .catch(error => {
        console.error('Error regenerating invite:', error);
        alert('Failed to regenerate invite link');
    });
}

function inviteTitibot() {
    const formData = new FormData();
    formData.append('action', 'invite_titibot');
    formData.append('server_id', currentServerId);
    
    fetch('api/invite.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Titibot has been invited to the server!');
        } else {
            alert(data.message || 'Failed to invite Titibot');
        }
    })
    .catch(error => {
        console.error('Error inviting Titibot:', error);
        alert('Failed to invite Titibot');
    });
}

function acceptInvite() {
    const inviteCode = new URLSearchParams(window.location.search).get('invite');
    if (!inviteCode) return;
    
    const formData = new FormData();
    formData.append('action', 'accept_invite');
    formData.append('invite_code', inviteCode);
    
    fetch('api/invite.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = 'server.php?id=' + data.server_id;
        } else {
            alert(data.message || 'Failed to accept invite');
        }
    })
    .catch(error => {
        console.error('Error accepting invite:', error);
        alert('Failed to accept invite');
    });
}

function declineInvite() {
    window.location.href = 'dashboard.php';
}

// Server Settings Functions
function closeServerSettingsModal() {
    document.getElementById('serverSettingsModal').classList.add('hidden');
}

function editServerBanner() {
    document.getElementById('serverBannerInput').click();
}

function editServerIcon() {
    document.getElementById('serverIconInput').click();
}

function saveServerName() {
    const serverName = document.getElementById('serverNameInput').value.trim();
    if (!serverName) {
        alert('Server name is required');
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'update_server_name');
    formData.append('server_id', currentServerId);
    formData.append('name', serverName);
    
    fetch('api/server.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert(data.message || 'Failed to update server name');
        }
    })
    .catch(error => {
        console.error('Error updating server name:', error);
        alert('Failed to update server name');
    });
}

function saveServerDescription() {
    const serverDescription = document.getElementById('serverDescriptionInput').value.trim();
    
    const formData = new FormData();
    formData.append('action', 'update_server_description');
    formData.append('server_id', currentServerId);
    formData.append('description', serverDescription);
    
    fetch('api/server.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert(data.message || 'Failed to update server description');
        }
    })
    .catch(error => {
        console.error('Error updating server description:', error);
        alert('Failed to update server description');
    });
}

function saveServerCategory() {
    const serverCategory = document.getElementById('serverCategorySelect').value;
    
    const formData = new FormData();
    formData.append('action', 'update_server_category');
    formData.append('server_id', currentServerId);
    formData.append('category', serverCategory);
    
    fetch('api/server.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert(data.message || 'Failed to update server category');
        }
    })
    .catch(error => {
        console.error('Error updating server category:', error);
        alert('Failed to update server category');
    });
}

function deleteServer() {
    const confirmText = document.getElementById('deleteServerConfirm').value;
    const expectedText = document.getElementById('deleteServerConfirm').getAttribute('data-server-name');
    
    if (confirmText !== expectedText) {
        alert('Server name does not match');
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'delete_server');
    formData.append('server_id', currentServerId);
    
    fetch('api/server.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = 'dashboard.php';
        } else {
            alert(data.message || 'Failed to delete server');
        }
    })
    .catch(error => {
        console.error('Error deleting server:', error);
        alert('Failed to delete server');
    });
}

// Channel Edit Functions
function closeEditChannelModal() {
    document.getElementById('editChannelModal').classList.add('hidden');
}

function saveChannelEdit() {
    const channelId = document.getElementById('editChannelId').value;
    const channelName = document.getElementById('editChannelName').value.trim();
    const channelDescription = document.getElementById('editChannelDescription').value.trim();
    
    if (!channelName) {
        alert('Channel name is required');
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'update_channel');
    formData.append('channel_id', channelId);
    formData.append('name', channelName);
    formData.append('description', channelDescription);
    
    fetch('api/channel.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeEditChannelModal();
            location.reload();
        } else {
            alert(data.message || 'Failed to update channel');
        }
    })
    .catch(error => {
        console.error('Error updating channel:', error);
        alert('Failed to update channel');
    });
}

// Transfer Ownership Functions
function closeTransferOwnershipModal() {
    document.getElementById('transferOwnershipModal').classList.add('hidden');
}

function confirmOwnershipTransfer() {
    const memberId = document.getElementById('transferMemberSelect').value;
    if (!memberId) {
        alert('Please select a member');
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'transfer_ownership');
    formData.append('server_id', currentServerId);
    formData.append('new_owner_id', memberId);
    
    fetch('api/server.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeTransferOwnershipModal();
            location.reload();
        } else {
            alert(data.message || 'Failed to transfer ownership');
        }
    })
    .catch(error => {
        console.error('Error transferring ownership:', error);
        alert('Failed to transfer ownership');
    });
}

// User Settings Functions
function logout() {
    window.location.href = '../auth/logout.php';
}

function editBanner() {
    document.getElementById('bannerInput').click();
}

function editAvatar() {
    document.getElementById('avatarInput').click();
}

function openPasswordChangeModal() {
    document.getElementById('passwordChangeModal').classList.remove('hidden');
}

function resetAccountForm() {
    // Reset the account form to original values
    location.reload();
}

function saveAccountChanges() {
    const formData = new FormData();
    const form = document.getElementById('accountForm');
    
    // Get all form data
    const formDataObj = new FormData(form);
    formDataObj.append('action', 'update_account');
    
    fetch('api/user.php', {
        method: 'POST',
        body: formDataObj
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Account updated successfully');
            location.reload();
        } else {
            alert(data.message || 'Failed to update account');
        }
    })
    .catch(error => {
        console.error('Error updating account:', error);
        alert('Failed to update account');
    });
}

function startMicTest() {
    // Microphone test functionality
    navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        alert('Microphone test started');
        // Stop the stream after test
        stream.getTracks().forEach(track => track.stop());
    })
    .catch(error => {
        console.error('Microphone error:', error);
        alert('Microphone access denied or not available');
    });
}

function testCamera() {
    // Camera test functionality
    navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        const video = document.getElementById('cameraPreview');
        video.srcObject = stream;
        video.play();
        document.getElementById('stopCameraBtn').classList.remove('hidden');
    })
    .catch(error => {
        console.error('Camera error:', error);
        alert('Camera access denied or not available');
    });
}

function stopCamera() {
    const video = document.getElementById('cameraPreview');
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    document.getElementById('stopCameraBtn').classList.add('hidden');
}

function initiateAccountDeletion() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        const formData = new FormData();
        formData.append('action', 'delete_account');
        
        fetch('api/user.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Account deletion initiated. You will be logged out.');
                logout();
            } else {
                alert(data.message || 'Failed to delete account');
            }
        })
        .catch(error => {
            console.error('Error deleting account:', error);
            alert('Failed to delete account');
        });
    }
}

function closePasswordChangeModal() {
    document.getElementById('passwordChangeModal').classList.add('hidden');
}

function verifySecurityAnswer() {
    const answer = document.getElementById('securityAnswer').value.trim();
    if (!answer) {
        alert('Please enter your security answer');
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'verify_security');
    formData.append('answer', answer);
    
    fetch('api/user.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('securityStep').classList.add('hidden');
            document.getElementById('passwordStep').classList.remove('hidden');
        } else {
            alert(data.message || 'Security answer incorrect');
        }
    })
    .catch(error => {
        console.error('Error verifying security:', error);
        alert('Failed to verify security answer');
    });
}

function changePassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (newPassword.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'change_password');
    formData.append('new_password', newPassword);
    
    fetch('api/user.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Password changed successfully');
            closePasswordChangeModal();
        } else {
            alert(data.message || 'Failed to change password');
        }
    })
    .catch(error => {
        console.error('Error changing password:', error);
        alert('Failed to change password');
    });
}