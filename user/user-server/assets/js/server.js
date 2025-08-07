// Main Server Application Logic
class ServerApp {
    constructor() {
        this.currentServer = null;
        this.currentChannel = null;
        this.currentUser = null;
        this.userServers = [];
        this.socket = null;
        this.cropper = null;
        this.currentCropTarget = null;
        this.replyingTo = null;
        this.selectedFiles = [];
        
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
        // Initialize Socket.IO connection with better error handling
        try {
            console.log('Initializing WebSocket connection to localhost:8010');
            this.socket = io('http://localhost:8010', {
                transports: ['websocket', 'polling'],
                withCredentials: true,
                timeout: 20000,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });

            this.socket.on('connect', () => {
                console.log('Connected to WebSocket server');
                this.updateUserStatus('online');
                
                // Authenticate user
                if (window.currentUser) {
                    console.log('Authenticating user:', window.currentUser);
                    this.socket.emit('authenticate', {
                        userId: window.currentUser.id,
                        username: window.currentUser.username
                    });
                }
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from WebSocket server');
                this.updateUserStatus('offline');
            });

            this.socket.on('connect_error', (error) => {
                console.warn('WebSocket connection failed:', error.message);
                console.log('Falling back to regular HTTP polling for messages');
                this.fallbackToPolling();
            });

            this.socket.on('reconnect', (attemptNumber) => {
                console.log(`Reconnected to WebSocket server after ${attemptNumber} attempts`);
            });

            this.socket.on('reconnect_error', (error) => {
                console.warn('WebSocket reconnection failed:', error.message);
            });

            // Authentication events
            this.socket.on('authenticated', (data) => {
                console.log('Successfully authenticated:', data);
            });

            this.socket.on('authentication_failed', (data) => {
                console.error('Authentication failed:', data.message);
            });

            // Message-related socket events
            this.socket.on('message_received', (data) => {
                if (data.channelId === this.currentChannel?.ID) {
                    console.log('Real-time message received:', data);
                    this.addMessageToUI(data.message);
                }
            });

            this.socket.on('message_edited', (data) => {
                if (data.channelId === this.currentChannel?.ID) {
                    this.updateMessageInUI(data.messageId, data.newContent, data.editedAt);
                }
            });

            this.socket.on('message_deleted', (data) => {
                if (data.channelId === this.currentChannel?.ID) {
                    this.removeMessageFromUI(data.messageId);
                }
            });

            this.socket.on('reaction_added', (data) => {
                if (data.channelId === this.currentChannel?.ID) {
                    this.addReactionToUI(data.messageId, data.emoji, data.userId);
                }
            });

            this.socket.on('reaction_removed', (data) => {
                if (data.channelId === this.currentChannel?.ID) {
                    this.removeReactionFromUI(data.messageId, data.emoji, data.userId);
                }
            });

            this.socket.on('user_typing', (data) => {
                if (data.channelId === this.currentChannel?.ID) {
                    this.updateTypingIndicator(data.username, data.isTyping);
                }
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

        } catch (error) {
            console.error('Failed to initialize WebSocket connection:', error);
            this.fallbackToPolling();
        }
    }

    fallbackToPolling() {
        console.log('Using HTTP polling fallback for updates');
        
        // Set up periodic message refresh instead of real-time
        if (this.messageRefreshInterval) {
            clearInterval(this.messageRefreshInterval);
        }
        
        this.messageRefreshInterval = setInterval(() => {
            if (this.currentChannel) {
                this.loadChannelMessages();
            }
        }, 3000); // Refresh every 3 seconds
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

        // Message input handling
        $('#messageInput').on('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Send button handling
        $('#sendButton').on('click', () => {
            this.sendMessage();
        });

        // File upload handling
        $('#attachmentBtn').on('click', () => {
            $('#fileInput').click();
        });

        $('#fileInput').on('change', (e) => {
            this.handleFileSelection(e.target.files);
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
            const response = await fetch(`api/channels.php?action=getChannels&serverId=${this.currentServer.ID}`);
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

            const response = await fetch(`api/channels.php?action=getChannel&id=${channelId}`);
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

    async loadChannelMessages() {
        if (!this.currentChannel) return;

        try {
            const response = await fetch(`api/channels.php?action=getMessages&channelId=${this.currentChannel.ID}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderMessages(data.messages);
            } else {
                this.showToast('Error loading messages', 'error');
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showToast('Failed to load messages', 'error');
        }
    }

    renderMessages(messages) {
        const container = $('#messagesList');
        container.empty();

        if (messages.length === 0) {
            container.append(`
                <div class="no-messages">
                    <div class="no-messages-icon">
                        <i class="fas fa-hashtag"></i>
                    </div>
                    <h3>Welcome to #${this.currentChannel.Name}!</h3>
                    <p>This is the start of the #${this.currentChannel.Name} channel.</p>
                </div>
            `);
            return;
        }

        // Group messages by user and time
        const groupedMessages = this.groupMessages(messages);
        
        container.html(groupedMessages.map(group => {
            if (group.type === 'group') {
                return this.renderMessageGroup(group);
            } else {
                return this.renderSingleMessage(group.message);
            }
        }).join(''));

        // Add event listeners for message actions
        this.setupMessageActionListeners(container);

        // Scroll to bottom
        container.scrollTop(container[0].scrollHeight);
    }

    setupMessageActionListeners(container) {
        // Remove existing listeners to prevent duplicates
        container.off('click', '.message-action-btn');
        container.off('click', '.clickable-reaction');
        
        // Add click listeners for message actions
        container.on('click', '.message-action-btn', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const btn = $(e.currentTarget);
            const action = btn.data('action');
            const messageId = btn.data('message-id');
            
            switch (action) {
                case 'react':
                    this.showReactionPicker(messageId, btn);
                    break;
                case 'reply':
                    this.replyToMessage(messageId);
                    break;
                case 'copy':
                    this.copyMessage(messageId);
                    break;
                case 'edit':
                    this.editMessage(messageId);
                    break;
                case 'delete':
                    this.deleteMessage(messageId);
                    break;
            }
        });
        
        // Add click listeners for reactions
        container.on('click', '.clickable-reaction', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const reactionBtn = $(e.currentTarget);
            const emoji = reactionBtn.data('emoji');
            const messageId = reactionBtn.closest('.message-item').data('message-id');
            
            this.toggleReaction(messageId, emoji);
        });
    }

    showReactionPicker(messageId, button) {
        // Remove any existing reaction picker
        $('.reaction-picker').remove();
        
        // Simple reaction picker - can be expanded
        const reactions = ['👍', '👎', '❤️', '😂', '😢', '😡', '🎉', '🔥'];
        const picker = $(`
            <div class="reaction-picker">
                ${reactions.map(emoji => `
                    <button class="reaction-option" data-emoji="${emoji}">${emoji}</button>
                `).join('')}
            </div>
        `);
        
        // Position picker near button
        const buttonOffset = button.offset();
        picker.css({
            position: 'fixed',
            top: buttonOffset.top - 60,
            left: buttonOffset.left,
            zIndex: 1000
        });
        
        $('body').append(picker);
        
        // Handle reaction selection
        picker.on('click', '.reaction-option', (e) => {
            e.stopPropagation();
            const emoji = $(e.target).data('emoji');
            this.toggleReaction(messageId, emoji);
            picker.remove();
        });
        
        // Close picker when clicking outside
        setTimeout(() => {
            $(document).one('click', () => picker.remove());
        }, 100);
    }

    replyToMessage(messageId) {
        // Find the message content for preview
        const messageElement = $(`.message-item[data-message-id="${messageId}"]`);
        const messageContent = messageElement.find('.message-content').text().trim();
        const messageAuthor = messageElement.closest('.message-group').find('.message-author').text();
        
        // Show reply context
        const replyContext = $(`
            <div class="reply-context">
                <div class="reply-info">
                    <div class="reply-author">Replying to ${messageAuthor}</div>
                    <div class="reply-content">${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}</div>
                </div>
                <button class="cancel-reply">×</button>
            </div>
        `);
        
        // Insert before message input
        $('#messageInputContainer').prepend(replyContext);
        
        // Focus message input
        $('#messageInput').focus();
        
        // Store reply data
        this.replyingTo = messageId;
        
        // Handle cancel reply
        replyContext.find('.cancel-reply').on('click', () => {
            replyContext.remove();
            this.replyingTo = null;
        });
    }

    copyMessage(messageId) {
        const messageElement = $(`.message-item[data-message-id="${messageId}"]`);
        const messageContent = messageElement.find('.message-content').text().trim();
        
        // Copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(messageContent).then(() => {
                this.showToast('Message copied to clipboard', 'success');
            }).catch(() => {
                this.fallbackCopyText(messageContent);
            });
        } else {
            this.fallbackCopyText(messageContent);
        }
    }

    fallbackCopyText(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            this.showToast('Message copied to clipboard', 'success');
        } catch (err) {
            this.showToast('Failed to copy message', 'error');
        }
        document.body.removeChild(textArea);
    }

    async toggleReaction(messageId, emoji) {
        try {
            // Check if user already reacted with this emoji
            const messageElement = $(`.message-item[data-message-id="${messageId}"]`);
            const existingReaction = messageElement.find(`.reaction-item[data-emoji="${emoji}"]`);
            const hasUserReaction = existingReaction.hasClass('user-reacted');
            
            const action = hasUserReaction ? 'removeReaction' : 'addReaction';
            const formData = new FormData();
            formData.append('action', action);
            formData.append('messageId', messageId);
            formData.append('emoji', emoji);

            const response = await fetch('api/channels.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // Reload messages to show the updated reactions
                this.loadChannelMessages();
            } else {
                this.showToast(data.message || `Failed to ${action.replace('R', ' r')}`, 'error');
            }
        } catch (error) {
            console.error('Error toggling reaction:', error);
            this.showToast('Failed to update reaction', 'error');
        }
    }

    async editMessage(messageId) {
        const messageElement = $(`.message-item[data-message-id="${messageId}"]`);
        const messageContent = messageElement.find('.message-content').clone();
        
        // Remove edited indicator and attachments for editing
        messageContent.find('.edited-indicator, .message-attachment').remove();
        const currentText = messageContent.text().trim();
        
        // Create edit interface
        const editForm = $(`
            <div class="message-edit-form">
                <textarea class="edit-textarea" rows="1">${currentText}</textarea>
                <div class="edit-actions">
                    <button class="save-edit-btn">Save</button>
                    <button class="cancel-edit-btn">Cancel</button>
                </div>
            </div>
        `);
        
        // Replace message content with edit form
        messageElement.find('.message-content').hide();
        messageElement.find('.message-actions').hide();
        messageElement.append(editForm);
        
        // Focus and select text
        const textarea = editForm.find('.edit-textarea');
        textarea.focus().select();
        
        // Auto resize textarea
        const autoResize = () => {
            textarea.css('height', 'auto');
            textarea.css('height', textarea[0].scrollHeight + 'px');
        };
        textarea.on('input', autoResize);
        autoResize();
        
        // Handle save
        editForm.find('.save-edit-btn').on('click', async () => {
            const newContent = textarea.val().trim();
            if (!newContent) {
                this.showToast('Message cannot be empty', 'error');
                return;
            }
            
            try {
                const formData = new FormData();
                formData.append('action', 'editMessage');
                formData.append('messageId', messageId);
                formData.append('content', newContent);

                const response = await fetch('api/channels.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    this.showToast('Message updated', 'success');
                    this.loadChannelMessages();
                } else {
                    this.showToast(data.message || 'Failed to edit message', 'error');
                }
            } catch (error) {
                console.error('Error editing message:', error);
                this.showToast('Failed to edit message', 'error');
            }
        });
        
        // Handle cancel
        editForm.find('.cancel-edit-btn').on('click', () => {
            editForm.remove();
            messageElement.find('.message-content, .message-actions').show();
        });
        
        // Handle Enter to save, Escape to cancel
        textarea.on('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                editForm.find('.save-edit-btn').click();
            } else if (e.key === 'Escape') {
                editForm.find('.cancel-edit-btn').click();
            }
        });
    }

    async deleteMessage(messageId) {
        // Show custom confirmation modal instead of browser alert
        this.showDeleteConfirmation(messageId);
    }

    showDeleteConfirmation(messageId) {
        // Create custom modal
        const modal = $(`
            <div class="delete-modal-overlay">
                <div class="delete-modal">
                    <div class="delete-modal-header">
                        <h3>Delete Message</h3>
                    </div>
                    <div class="delete-modal-content">
                        <p>Are you sure you want to delete this message?</p>
                        <p class="delete-warning">This cannot be undone.</p>
                    </div>
                    <div class="delete-modal-actions">
                        <button class="cancel-delete-btn">Cancel</button>
                        <button class="confirm-delete-btn">Delete</button>
                    </div>
                </div>
            </div>
        `);

        // Add to body
        $('body').append(modal);

        // Handle cancel
        modal.find('.cancel-delete-btn').on('click', () => {
            modal.remove();
        });

        // Handle confirm delete
        modal.find('.confirm-delete-btn').on('click', async () => {
            modal.remove();
            await this.performDeleteMessage(messageId);
        });

        // Close on overlay click
        modal.on('click', (e) => {
            if (e.target === modal[0]) {
                modal.remove();
            }
        });

        // Close on Escape key
        $(document).on('keydown.deleteModal', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                $(document).off('keydown.deleteModal');
            }
        });
    }

    async performDeleteMessage(messageId) {
        try {
            const formData = new FormData();
            formData.append('action', 'deleteMessage');
            formData.append('messageId', messageId);

            const response = await fetch('api/channels.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Message deleted', 'success');
                this.loadChannelMessages();
            } else {
                this.showToast(data.message || 'Failed to delete message', 'error');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            this.showToast('Failed to delete message', 'error');
        }
    }

    async addReaction(messageId, emoji) {
        try {
            const formData = new FormData();
            formData.append('action', 'addReaction');
            formData.append('messageId', messageId);
            formData.append('emoji', emoji);

            const response = await fetch('api/channels.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // Reload messages to show the new reaction
                this.loadChannelMessages();
            } else {
                this.showToast(data.message || 'Failed to add reaction', 'error');
            }
        } catch (error) {
            console.error('Error adding reaction:', error);
            this.showToast('Failed to add reaction', 'error');
        }
    }

    groupMessages(messages) {
        const groups = [];
        let currentGroup = null;
        
        messages.forEach(message => {
            const messageTime = new Date(message.SentAt);
            const shouldGroup = currentGroup && 
                               currentGroup.user_id === message.UserID &&
                               (messageTime - currentGroup.lastTime) < 5 * 60 * 1000; // 5 minutes
            
            if (shouldGroup) {
                currentGroup.messages.push(message);
                currentGroup.lastTime = messageTime;
            } else {
                if (currentGroup) {
                    groups.push(currentGroup.messages.length > 1 ? 
                               { type: 'group', ...currentGroup } : 
                               { type: 'single', message: currentGroup.messages[0] });
                }
                
                currentGroup = {
                    user_id: message.UserID,
                    username: message.Username,
                    display_name: message.DisplayName || message.Username,
                    avatar: message.ProfilePictureUrl,
                    messages: [message],
                    lastTime: messageTime
                };
            }
        });
        
        // Don't forget the last group
        if (currentGroup) {
            groups.push(currentGroup.messages.length > 1 ? 
                       { type: 'group', ...currentGroup } : 
                       { type: 'single', message: currentGroup.messages[0] });
        }
        
        return groups;
    }

    renderMessageGroup(group) {
        const firstMessage = group.messages[0];
        return `
            <div class="message-group" data-user-id="${group.user_id}">
                <div class="message-header">
                    <img src="${group.avatar || '/assets/images/default-avatar.png'}" 
                         alt="${group.display_name}" class="message-avatar">
                    <span class="message-author">${group.display_name}</span>
                    <span class="message-timestamp">${this.formatMessageTime(firstMessage.SentAt)}</span>
                </div>
                ${group.messages.map(msg => this.renderMessageContent(msg)).join('')}
            </div>
        `;
    }

    renderSingleMessage(message) {
        return `
            <div class="message-group" data-user-id="${message.UserID}">
                <div class="message-header">
                    <img src="${message.ProfilePictureUrl || '/assets/images/default-avatar.png'}" 
                         alt="${message.DisplayName || message.Username}" class="message-avatar">
                    <span class="message-author">${message.DisplayName || message.Username}</span>
                    <span class="message-timestamp">${this.formatMessageTime(message.SentAt)}</span>
                </div>
                ${this.renderMessageContent(message)}
            </div>
        `;
    }

    renderReplyContext(message) {
        return `
            <div class="reply-context-display">
                <div class="reply-line"></div>
                <div class="reply-info-display">
                    <span class="reply-author-display">${message.ReplyUsername}</span>
                    <span class="reply-content-display">${this.formatMessageContent(message.ReplyContent.substring(0, 100))}${message.ReplyContent.length > 100 ? '...' : ''}</span>
                </div>
            </div>
        `;
    }

    renderMessageContent(message) {
        // Check if current user owns this message (convert both to numbers for comparison)
        const isOwner = this.currentUser && parseInt(message.UserID) === parseInt(this.currentUser.ID);
        return `
            <div class="message-item" data-message-id="${message.ID}">
                ${message.ReplyContent ? this.renderReplyContext(message) : ''}
                <div class="message-content">
                    ${this.formatMessageContent(message.Content)}
                    ${message.AttachmentURL ? this.renderAttachment(message.AttachmentURL) : ''}
                    ${message.EditedAt ? '<span class="edited-indicator">(edited)</span>' : ''}
                </div>
                ${message.reactions && message.reactions.length > 0 ? this.renderReactions(message.reactions) : ''}
                <div class="message-actions">
                    <button class="message-action-btn" data-action="react" data-message-id="${message.ID}" title="Add Reaction">
                        <i class="fas fa-smile"></i>
                    </button>
                    <button class="message-action-btn" data-action="reply" data-message-id="${message.ID}" title="Reply">
                        <i class="fas fa-reply"></i>
                    </button>
                    <button class="message-action-btn" data-action="copy" data-message-id="${message.ID}" title="Copy Message">
                        <i class="fas fa-copy"></i>
                    </button>
                    ${isOwner ? `
                        <button class="message-action-btn" data-action="edit" data-message-id="${message.ID}" title="Edit Message">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="message-action-btn" data-action="delete" data-message-id="${message.ID}" title="Delete Message">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderAttachment(attachmentUrl) {
        if (!attachmentUrl) return '';
        
        const fileName = attachmentUrl.split('/').pop();
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        // Check if it's an image
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
            return `
                <div class="message-attachment image-attachment">
                    <img src="${attachmentUrl}" alt="${fileName}" class="attached-image" 
                         style="max-width: 300px; max-height: 300px; border-radius: 8px; cursor: pointer;"
                         onclick="window.open('${attachmentUrl}', '_blank')">
                    <div class="attachment-info">
                        <span class="attachment-name">${fileName}</span>
                    </div>
                </div>
            `;
        } 
        // Check if it's a video
        else if (['mp4', 'webm', 'mov'].includes(fileExtension)) {
            return `
                <div class="message-attachment video-attachment">
                    <video controls style="max-width: 400px; max-height: 300px; border-radius: 8px;">
                        <source src="${attachmentUrl}" type="video/${fileExtension}">
                        Your browser does not support the video tag.
                    </video>
                    <div class="attachment-info">
                        <span class="attachment-name">${fileName}</span>
                    </div>
                </div>
            `;
        }
        // Check if it's audio
        else if (['mp3', 'wav', 'ogg'].includes(fileExtension)) {
            return `
                <div class="message-attachment audio-attachment">
                    <audio controls style="width: 100%; max-width: 300px;">
                        <source src="${attachmentUrl}" type="audio/${fileExtension}">
                        Your browser does not support the audio tag.
                    </audio>
                    <div class="attachment-info">
                        <span class="attachment-name">${fileName}</span>
                    </div>
                </div>
            `;
        } 
        // For other file types
        else {
            return `
                <div class="message-attachment file-attachment">
                    <div class="file-info">
                        <i class="fas fa-file"></i>
                        <span class="file-name">${fileName}</span>
                        <a href="${attachmentUrl}" target="_blank" class="download-btn">Download</a>
                    </div>
                </div>
            `;
        }
    }

    formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        if (messageDate.getTime() === today.getTime()) {
            // Today - show time only
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (messageDate.getTime() === today.getTime() - 86400000) {
            // Yesterday
            return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            // Other days - show date
            return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }

    formatMessageContent(content) {
        // Basic formatting - can be expanded
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    renderReactions(reactions) {
        if (!reactions || reactions.length === 0) return '';
        
        return `
            <div class="message-reactions">
                ${reactions.map(reaction => {
                    const userReacted = this.currentUser && reaction.users.includes(this.currentUser.Username);
                    return `
                        <div class="reaction-item clickable-reaction ${userReacted ? 'user-reacted' : ''}" 
                             data-emoji="${reaction.emoji}" 
                             title="${reaction.users.join(', ')}">
                            <span class="reaction-emoji">${reaction.emoji}</span>
                            <span class="reaction-count">${reaction.count}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
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
                this.currentUser = data.user; // Store current user data
                $('#currentUsername').text(data.user.Username);
                $('#currentDiscriminator').text(`#${data.user.Discriminator}`);
                $('#userAvatar').attr('src', data.user.ProfilePictureUrl || '/assets/images/default-avatar.png');
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

    handleFileSelection(files) {
        if (!files || files.length === 0) return;

        // Validate file sizes and types
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/mov',
            'audio/mp3', 'audio/wav', 'audio/ogg',
            'text/plain', 'application/pdf',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        for (let file of files) {
            // Check file size
            if (file.size > maxSize) {
                this.showToast(`File "${file.name}" is too large. Maximum size is 10MB.`, 'error');
                continue;
            }

            // Check file type
            if (!allowedTypes.includes(file.type)) {
                this.showToast(`File type "${file.type}" is not supported.`, 'error');
                continue;
            }

            // Add to selected files
            this.selectedFiles.push(file);
        }

        if (this.selectedFiles.length > 0) {
            this.showFilePreview();
        }

        // Reset file input
        $('#fileInput').val('');
    }

    showFilePreview() {
        const container = $('#filePreviewContainer');
        const previews = $('#filePreviews');
        
        // Show the container
        container.removeClass('hidden').show();
        previews.empty();

        // Create preview grid
        const grid = $('<div class="file-preview-grid"></div>');
        
        this.selectedFiles.forEach((file, index) => {
            const preview = this.createFilePreview(file, index);
            grid.append(preview);
        });
        
        previews.append(grid);
        
        // Add upload info
        const info = $('<div class="file-upload-info">You can add more files or send your message</div>');
        previews.append(info);
    }

    createFilePreview(file, index) {
        const fileSize = this.formatFileSize(file.size);
        const fileName = file.name;
        const fileType = file.type;

        let previewContent = '';
        
        // Create different previews based on file type
        if (fileType.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            previewContent = `
                <div class="file-preview-thumbnail">
                    <img src="${url}" alt="${fileName}" class="preview-image">
                </div>
            `;
        } else if (fileType.startsWith('video/')) {
            previewContent = `
                <div class="file-preview-thumbnail">
                    <i class="fas fa-video file-icon"></i>
                </div>
            `;
        } else if (fileType.startsWith('audio/')) {
            previewContent = `
                <div class="file-preview-thumbnail">
                    <i class="fas fa-music file-icon"></i>
                </div>
            `;
        } else {
            previewContent = `
                <div class="file-preview-thumbnail">
                    <i class="fas fa-file file-icon"></i>
                </div>
            `;
        }

        return $(`
            <div class="file-preview-item" data-file-index="${index}">
                ${previewContent}
                <div class="file-preview-info">
                    <div class="file-preview-name">${fileName}</div>
                    <div class="file-preview-size">${fileSize}</div>
                </div>
                <button class="file-preview-remove" onclick="serverApp.removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `);
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        
        if (this.selectedFiles.length === 0) {
            $('#filePreviewContainer').addClass('hidden').hide();
        } else {
            this.showFilePreview();
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async uploadFiles() {
        if (this.selectedFiles.length === 0) return null;

        const formData = new FormData();
        formData.append('action', 'uploadFiles');
        
        // Add all selected files
        this.selectedFiles.forEach((file, index) => {
            formData.append(`files[${index}]`, file);
        });

        try {
            const response = await fetch('api/upload.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                return data.fileUrls; // Array of uploaded file URLs
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch (error) {
            console.error('File upload error:', error);
            this.showToast('Failed to upload files', 'error');
            return null;
        }
    }

    async sendMessage() {
        if (!this.currentChannel) {
            this.showToast('No channel selected', 'error');
            return;
        }

        const messageInput = $('#messageInput');
        const content = messageInput.val().trim();
        
        // Allow sending if there's either content or files
        if (!content && this.selectedFiles.length === 0) {
            return;
        }

        try {
            let attachmentUrls = null;

            // Upload files first if any are selected
            if (this.selectedFiles.length > 0) {
                attachmentUrls = await this.uploadFiles();
                if (!attachmentUrls) {
                    return; // Upload failed
                }
            }

            const formData = new FormData();
            formData.append('action', 'sendMessage');
            formData.append('channelId', this.currentChannel.ID);
            formData.append('content', content || ''); // Allow empty content if there are attachments
            
            // Add attachment URLs if any
            if (attachmentUrls && attachmentUrls.length > 0) {
                formData.append('attachmentUrls', JSON.stringify(attachmentUrls));
            }
            
            // Add reply information if replying
            if (this.replyingTo) {
                formData.append('replyTo', this.replyingTo);
            }

            const response = await fetch('api/channels.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                messageInput.val('');
                
                // Clear file selection
                this.selectedFiles = [];
                $('#filePreviewContainer').addClass('hidden').hide();
                
                // Clear reply context if it exists
                if (this.replyingTo) {
                    $('.reply-context').remove();
                    this.replyingTo = null;
                }
                
                // Emit new message via socket for real-time updates
                if (data.messageData) {
                    this.emitNewMessage(data.messageData);
                }
                
                this.loadChannelMessages(); // Reload messages to show the new one
            } else {
                this.showToast(data.message || 'Failed to send message', 'error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showToast('Failed to send message', 'error');
        }
    }

    // Socket event handlers
    handleServerUpdate(data) {
        // Refresh server data if it's the current server
        if (this.currentServer && this.currentServer.ID === data.serverId) {
            this.loadServerData(data.serverId);
        }
    }

    handleChannelCreated(data) {
        // Refresh channels if it's in the current server
        if (this.currentServer && this.currentServer.ID === data.serverId) {
            this.loadServerChannels(data.serverId);
        }
    }

    handleChannelUpdated(data) {
        // Update channel info if it's the current channel
        if (this.currentChannel && this.currentChannel.ID === data.channelId) {
            this.loadChannelMessages();
        }
    }

    handleChannelDeleted(data) {
        // If current channel was deleted, clear it
        if (this.currentChannel && this.currentChannel.ID === data.channelId) {
            this.currentChannel = null;
            $('#messagesList').html('<div class="no-messages">Channel no longer exists</div>');
        }
        // Refresh channels list
        if (this.currentServer) {
            this.loadServerChannels(this.currentServer.ID);
        }
    }

    handleMemberJoined(data) {
        // Refresh members list if it's the current server
        if (this.currentServer && this.currentServer.ID === data.serverId) {
            this.loadServerMembers(data.serverId);
        }
    }

    handleMemberLeft(data) {
        // Refresh members list if it's the current server
        if (this.currentServer && this.currentServer.ID === data.serverId) {
            this.loadServerMembers(data.serverId);
        }
    }

    handleMemberUpdated(data) {
        // Refresh members list if it's the current server
        if (this.currentServer && this.currentServer.ID === data.serverId) {
            this.loadServerMembers(data.serverId);
        }
    }

    // Real-time message handling
    addMessageToUI(message) {
        const messageElement = this.renderMessageContent(message);
        $('#messagesList').append(`
            <div class="message-group">
                <div class="message-author">
                    <img src="${message.ProfilePictureUrl || '/assets/images/default-avatar.png'}" class="author-avatar">
                    <span class="author-name">${message.DisplayName || message.Username}</span>
                    <span class="message-timestamp">${this.formatMessageTime(message.CreatedAt)}</span>
                </div>
                ${messageElement}
            </div>
        `);
        this.scrollToBottom();
    }

    updateMessageInUI(messageId, newContent, editedAt) {
        const messageElement = $(`.message-item[data-message-id="${messageId}"]`);
        if (messageElement.length > 0) {
            messageElement.find('.message-content').html(this.formatMessageContent(newContent) + 
                '<span class="edited-indicator">(edited)</span>');
        }
    }

    removeMessageFromUI(messageId) {
        const messageElement = $(`.message-item[data-message-id="${messageId}"]`);
        messageElement.closest('.message-group').fadeOut(300, function() {
            $(this).remove();
        });
    }

    addReactionToUI(messageId, emoji, userId) {
        // Implementation for adding reactions in real-time
        this.loadChannelMessages(); // For now, just refresh messages
    }

    removeReactionFromUI(messageId, emoji, userId) {
        // Implementation for removing reactions in real-time
        this.loadChannelMessages(); // For now, just refresh messages
    }

    updateTypingIndicator(username, isTyping) {
        const indicator = $('#typingIndicator');
        const text = $('#typingText');
        
        if (isTyping) {
            text.text(`${username} is typing...`);
            indicator.removeClass('hidden').show();
        } else {
            indicator.addClass('hidden').hide();
        }
    }

    // Emit socket events for real-time communication
    emitNewMessage(messageData) {
        if (this.socket && this.socket.connected && this.currentChannel) {
            console.log('Emitting new message via WebSocket:', messageData);
            this.socket.emit('new_message', {
                channelId: this.currentChannel.ID,
                messageData: messageData
            });
        } else {
            console.log('WebSocket not connected - message sent via HTTP only');
        }
    }

    emitTypingStart() {
        if (this.socket && this.socket.connected && this.currentChannel) {
            this.socket.emit('typing_start', {
                channelId: this.currentChannel.ID,
                username: window.currentUser?.username
            });
        }
    }

    emitTypingStop() {
        if (this.socket && this.socket.connected && this.currentChannel) {
            this.socket.emit('typing_stop', {
                channelId: this.currentChannel.ID,
                username: window.currentUser?.username
            });
        }
    }
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
    // Get form elements with proper validation
    const channelNameInput = document.getElementById('channelNameInput');
    const channelTypeInput = document.querySelector('input[name="channelType"]:checked');
    
    // Validate elements exist
    if (!channelNameInput) {
        console.error('Channel name input not found');
        serverApp.showToast('Channel name input not found', 'error');
        return;
    }
    
    if (!channelTypeInput) {
        console.error('Channel type not selected');
        serverApp.showToast('Please select a channel type', 'error');
        return;
    }
    
    if (!serverApp.currentServer) {
        serverApp.showToast('No server selected', 'error');
        return;
    }
    
    // Get values
    const channelName = channelNameInput.value.trim();
    const channelType = channelTypeInput.value;
    
    if (!channelName) {
        serverApp.showToast('Channel name is required', 'error');
        return;
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('action', 'createChannel');
    formData.append('name', channelName);
    formData.append('type', channelType);
    formData.append('serverId', serverApp.currentServer.ID);
    
    fetch('api/channels.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            closeCreateChannelModal();
            serverApp.loadServerChannels();
            serverApp.showToast('Channel created successfully!', 'success');
        } else {
            serverApp.showToast(data.error || 'Failed to create channel', 'error');
        }
    })
    .catch(error => {
        console.error('Error creating channel:', error);
        serverApp.showToast('Failed to create channel', 'error');
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