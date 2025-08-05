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

// Initialize the application
let serverApp;

$(document).ready(() => {
    serverApp = new ServerApp();
});

// Export for use in other files
window.serverApp = serverApp;