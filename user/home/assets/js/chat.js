// Chat management functionality
class ChatManager {
    constructor() {
        this.currentRoomId = null;
        this.conversations = [];
        this.messages = [];
        this.replyingTo = null;
        this.selectedFiles = [];
        this.lastMessageTime = null;
        this.editingMessageId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadConversations();
    }

    setupEventListeners() {
        // Message input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('input', () => {
                this.autoResizeTextarea(messageInput);
                this.handleTyping();
            });

            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                } else if (e.key === 'Escape') {
                    this.cancelReply();
                    this.cancelEdit();
                }
            });
        }

        // Send button
        document.getElementById('sendBtn')?.addEventListener('click', () => {
            this.sendMessage();
        });

        // Attachment button
        document.getElementById('attachmentBtn')?.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        // File input
        document.getElementById('fileInput')?.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        // Emoji button
        document.getElementById('emojiBtn')?.addEventListener('click', (e) => {
            this.toggleEmojiPicker(e);
        });

        // Reply cancel button
        document.getElementById('cancelReply')?.addEventListener('click', () => {
            this.cancelReply();
        });

        // Create DM button
        document.getElementById('createDMBtn')?.addEventListener('click', () => {
            this.showCreateDMModal();
        });

        // DM Modal functionality
        this.setupDMModalListeners();
    }

    setupDMModalListeners() {
        // Close modal
        document.getElementById('closeDMModal')?.addEventListener('click', () => {
            this.hideCreateDMModal();
        });

        document.getElementById('cancelDM')?.addEventListener('click', () => {
            this.hideCreateDMModal();
        });

        // User search in modal
        document.getElementById('dmUserSearch')?.addEventListener('input', (e) => {
            this.searchDMUsers(e.target.value);
        });

        // Create DM/Group
        document.getElementById('createDMBtn')?.addEventListener('click', () => {
            this.createDirectMessage();
        });

        // Group image upload
        document.getElementById('groupImagePlaceholder')?.addEventListener('click', () => {
            document.getElementById('groupImageInput').click();
        });

        document.getElementById('groupImageInput')?.addEventListener('change', (e) => {
            this.handleGroupImageSelection(e.target.files[0]);
        });
    }

    async loadConversations() {
        try {
            const response = await fetch('/user/home/api/chat.php?action=conversations');
            const data = await response.json();
            
            if (data.conversations) {
                this.conversations = data.conversations;
                this.renderConversationsList(data.conversations);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    renderConversationsList(conversations) {
        const container = document.getElementById('directMessagesList');
        if (!container) return;

        if (conversations.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No conversations yet.</p></div>';
            return;
        }

        container.innerHTML = conversations.map(conv => `
            <div class="dm-item ${conv.id === this.currentRoomId ? 'active' : ''}" 
                 data-room-id="${conv.id}" 
                 onclick="window.chatManager.openChat(${conv.id})">
                <div class="dm-avatar">
                    <img src="${conv.avatar || '/assets/images/default-avatar.png'}" alt="${conv.name}">
                    ${conv.type === 'group' ? '<div class="group-indicator"></div>' : ''}
                    ${conv.unread_count > 0 ? `<div class="unread-badge">${conv.unread_count}</div>` : ''}
                </div>
                <div class="dm-info">
                    <div class="dm-name">${conv.name}</div>
                    <div class="dm-status">${this.getLastMessagePreview(conv)}</div>
                </div>
            </div>
        `).join('');
    }

    async openChat(roomId) {
        if (this.currentRoomId === roomId) return;

        // Leave current room if any
        if (this.currentRoomId) {
            window.socketClient?.leaveRoom(this.currentRoomId);
        }

        this.currentRoomId = roomId;
        
        // Join new room
        window.socketClient?.joinRoom(roomId);

        // Update UI
        this.showChatSection();
        this.updateActiveConversation();
        
        // Load messages
        await this.loadMessages(roomId);
        
        // Update chat header
        this.updateChatHeader();
    }

    async loadMessages(roomId) {
        try {
            const response = await fetch(`/user/home/api/chat.php?action=messages&room_id=${roomId}`);
            const data = await response.json();
            
            if (data.messages) {
                this.messages = data.messages;
                this.renderMessages(data.messages);
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    renderMessages(messages) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        if (messages.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No messages yet. Start the conversation!</p></div>';
            return;
        }

        // Group messages by user and time
        const groupedMessages = this.groupMessages(messages);
        
        container.innerHTML = groupedMessages.map(group => {
            if (group.type === 'single') {
                return this.renderMessageGroup(group);
            } else {
                return this.renderSingleMessage(group.message);
            }
        }).join('');

        // Add event listeners to message actions
        this.setupMessageActionListeners(container);
    }

    groupMessages(messages) {
        const groups = [];
        let currentGroup = null;
        
        messages.forEach(message => {
            const messageTime = new Date(message.sent_at);
            const shouldGroup = currentGroup && 
                               currentGroup.user_id === message.user_id &&
                               (messageTime - currentGroup.lastTime) < 2 * 60 * 60 * 1000; // 2 hours
            
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
                    user_id: message.user_id,
                    username: message.username,
                    display_name: message.display_name,
                    avatar: message.avatar,
                    messages: [message],
                    lastTime: messageTime
                };
            }
        });
        
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
                    <span class="message-timestamp">${this.formatMessageTime(firstMessage.sent_at)}</span>
                </div>
                ${group.messages.map(msg => this.renderMessageContent(msg)).join('')}
            </div>
        `;
    }

    renderSingleMessage(message) {
        return `
            <div class="message-group" data-user-id="${message.user_id}">
                <div class="message-header">
                    <img src="${message.avatar || '/assets/images/default-avatar.png'}" 
                         alt="${message.display_name}" class="message-avatar">
                    <span class="message-author">${message.display_name}</span>
                    <span class="message-timestamp">${this.formatMessageTime(message.sent_at)}</span>
                </div>
                ${this.renderMessageContent(message)}
            </div>
        `;
    }

    renderMessageContent(message) {
        return `
            <div class="message-item" data-message-id="${message.id}">
                ${message.reply_to ? this.renderReplyReference(message.reply_to) : ''}
                <div class="message-content">
                    ${this.processMessageContent(message.content)}
                    ${message.edited_at ? '<span class="edited-indicator">(edited)</span>' : ''}
                </div>
                ${message.reactions.length > 0 ? this.renderMessageReactions(message.reactions) : ''}
                <div class="message-actions">
                    <button class="message-action-btn" data-action="react" title="Add Reaction">
                        <i class="fas fa-smile"></i>
                    </button>
                    <button class="message-action-btn" data-action="reply" title="Reply">
                        <i class="fas fa-reply"></i>
                    </button>
                    ${message.user_id === window.socketClient?.currentUser?.id ? `
                        <button class="message-action-btn" data-action="edit" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="message-action-btn" data-action="delete" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderReplyReference(replyTo) {
        return `
            <div class="reply-reference" data-reply-to="${replyTo.id}">
                <i class="fas fa-reply"></i>
                <span class="reply-author">${replyTo.username}</span>
                <span class="reply-content">${replyTo.content}</span>
            </div>
        `;
    }

    renderMessageReactions(reactions) {
        return `
            <div class="message-reactions">
                ${reactions.map(reaction => `
                    <button class="reaction-btn ${reaction.user_reacted ? 'user-reacted' : ''}" 
                            data-emoji="${reaction.emoji}" 
                            title="${reaction.users.join(', ')}">
                        <span class="reaction-emoji">${reaction.emoji}</span>
                        <span class="reaction-count">${reaction.count}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    processMessageContent(content) {
        // Process mentions
        content = content.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
        
        // Process basic markdown
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        content = content.replace(/~~(.*?)~~/g, '<del>$1</del>');
        content = content.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Process URLs
        content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        
        return content;
    }

    setupMessageActionListeners(container) {
        container.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.message-action-btn');
            if (actionBtn) {
                const messageItem = actionBtn.closest('.message-item');
                const messageId = messageItem.dataset.messageId;
                const action = actionBtn.dataset.action;

                switch (action) {
                    case 'react':
                        this.showEmojiPickerForMessage(messageId, actionBtn);
                        break;
                    case 'reply':
                        this.startReply(messageId);
                        break;
                    case 'edit':
                        this.startEdit(messageId);
                        break;
                    case 'delete':
                        this.deleteMessage(messageId);
                        break;
                }
            }

            // Handle reaction clicks
            const reactionBtn = e.target.closest('.reaction-btn');
            if (reactionBtn) {
                const messageItem = reactionBtn.closest('.message-item');
                const messageId = messageItem.dataset.messageId;
                const emoji = reactionBtn.dataset.emoji;
                this.toggleReaction(messageId, emoji);
            }

            // Handle reply reference clicks
            const replyRef = e.target.closest('.reply-reference');
            if (replyRef) {
                const replyToId = replyRef.dataset.replyTo;
                this.scrollToMessage(replyToId);
            }
        });
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();

        if (!content && this.selectedFiles.length === 0) return;
        if (!this.currentRoomId) return;

        // Handle file uploads first
        let attachmentUrl = null;
        if (this.selectedFiles.length > 0) {
            attachmentUrl = await this.uploadFiles();
            if (!attachmentUrl) {
                console.error('File upload failed');
                return;
            }
        }

        const messageData = {
            room_id: this.currentRoomId,
            content: content,
            reply_to: this.replyingTo,
            attachment_url: attachmentUrl
        };

        if (this.editingMessageId) {
            // Edit message
            await this.editMessage(this.editingMessageId, content);
        } else {
            // Send new message
            try {
                const response = await fetch('/user/home/api/chat.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'send_message',
                        ...messageData
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // Message sent successfully
                    messageInput.value = '';
                    this.autoResizeTextarea(messageInput);
                    this.cancelReply();
                    this.clearSelectedFiles();
                    
                    // Add message via socket for real-time update
                    window.socketClient?.sendMessage(this.currentRoomId, content, this.replyingTo);
                } else {
                    console.error('Failed to send message:', data.error);
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    }

    async editMessage(messageId, content) {
        try {
            const response = await fetch('/user/home/api/chat.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'edit_message',
                    message_id: messageId,
                    content: content
                })
            });

            const data = await response.json();

            if (data.success) {
                this.cancelEdit();
                // Update message via socket
                window.socketClient?.editMessage(messageId, content);
            } else {
                console.error('Failed to edit message:', data.error);
            }
        } catch (error) {
            console.error('Error editing message:', error);
        }
    }

    async deleteMessage(messageId) {
        const modal = document.getElementById('deleteMessageModal');
        modal.classList.remove('hidden');

        const confirmBtn = document.getElementById('confirmDelete');
        const cancelBtn = document.getElementById('cancelDelete');

        const handleConfirm = async () => {
            try {
                const response = await fetch('/user/home/api/chat.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'delete_message',
                        message_id: messageId
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // Delete message via socket
                    window.socketClient?.deleteMessage(messageId);
                } else {
                    console.error('Failed to delete message:', data.error);
                }
            } catch (error) {
                console.error('Error deleting message:', error);
            } finally {
                modal.classList.add('hidden');
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
            }
        };

        const handleCancel = () => {
            modal.classList.add('hidden');
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
    }

    async toggleReaction(messageId, emoji) {
        try {
            const response = await fetch('/user/home/api/chat.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'react_message',
                    message_id: messageId,
                    emoji: emoji
                })
            });

            const data = await response.json();

            if (data.success) {
                // Update reaction via socket
                window.socketClient?.reactToMessage(messageId, emoji);
            } else {
                console.error('Failed to react to message:', data.error);
            }
        } catch (error) {
            console.error('Error reacting to message:', error);
        }
    }

    startReply(messageId) {
        const message = this.messages.find(m => m.id == messageId);
        if (!message) return;

        this.replyingTo = messageId;
        
        const replyContext = document.getElementById('replyContext');
        const replyUsername = document.getElementById('replyUsername');
        const replyContent = document.getElementById('replyContent');

        replyUsername.textContent = message.display_name;
        replyContent.textContent = message.content;
        replyContext.classList.remove('hidden');

        // Focus message input
        document.getElementById('messageInput').focus();
    }

    startEdit(messageId) {
        const message = this.messages.find(m => m.id == messageId);
        if (!message) return;

        this.editingMessageId = messageId;
        
        const messageInput = document.getElementById('messageInput');
        messageInput.value = message.content;
        this.autoResizeTextarea(messageInput);
        messageInput.focus();

        // Change send button to save
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.innerHTML = '<i class="fas fa-save"></i>';
        sendBtn.title = 'Save changes';
    }

    cancelReply() {
        this.replyingTo = null;
        document.getElementById('replyContext').classList.add('hidden');
    }

    cancelEdit() {
        this.editingMessageId = null;
        const messageInput = document.getElementById('messageInput');
        messageInput.value = '';
        this.autoResizeTextarea(messageInput);

        // Reset send button
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        sendBtn.title = 'Send message';
    }

    handleFileSelection(files) {
        this.selectedFiles = Array.from(files);
        this.showFilePreview();
    }

    showFilePreview() {
        const container = document.getElementById('filePreviewContainer');
        const previews = document.getElementById('filePreviews');

        if (this.selectedFiles.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');
        
        previews.innerHTML = this.selectedFiles.map((file, index) => {
            const isImage = file.type.startsWith('image/');
            const fileURL = URL.createObjectURL(file);

            return `
                <div class="file-preview" data-index="${index}">
                    ${isImage ? 
                        `<img src="${fileURL}" alt="${file.name}">` :
                        `<div class="file-icon"><i class="fas fa-file"></i></div>`
                    }
                    <button class="file-remove" onclick="window.chatManager.removeFile(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.showFilePreview();
    }

    clearSelectedFiles() {
        this.selectedFiles = [];
        document.getElementById('filePreviewContainer').classList.add('hidden');
        document.getElementById('fileInput').value = '';
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }

    handleTyping() {
        if (this.currentRoomId) {
            window.socketClient?.startTyping(this.currentRoomId);
        }
    }

    // Real-time message handlers
    addMessage(message) {
        this.messages.push(message);
        // Re-render messages to maintain grouping
        this.renderMessages(this.messages);
        this.scrollToBottom();
    }

    updateMessage(message) {
        const index = this.messages.findIndex(m => m.id === message.id);
        if (index !== -1) {
            this.messages[index] = message;
            this.renderMessages(this.messages);
        }
    }

    removeMessage(messageId) {
        this.messages = this.messages.filter(m => m.id !== messageId);
        this.renderMessages(this.messages);
    }

    updateMessageReactions(messageId, reactions) {
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            message.reactions = reactions;
            // Update just the reactions for this message
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                const reactionsContainer = messageElement.querySelector('.message-reactions');
                if (reactionsContainer) {
                    reactionsContainer.outerHTML = this.renderMessageReactions(reactions);
                } else if (reactions.length > 0) {
                    const content = messageElement.querySelector('.message-content');
                    content.insertAdjacentHTML('afterend', this.renderMessageReactions(reactions));
                }
            }
        }
    }

    updateConversationList() {
        this.loadConversations();
    }

    showChatSection() {
        document.getElementById('friendsSection').classList.add('hidden');
        document.getElementById('chatSection').classList.remove('hidden');
    }

    showFriendsSection() {
        document.getElementById('chatSection').classList.add('hidden');
        document.getElementById('friendsSection').classList.remove('hidden');
        
        if (this.currentRoomId) {
            window.socketClient?.leaveRoom(this.currentRoomId);
            this.currentRoomId = null;
        }
    }

    updateActiveConversation() {
        // Update active state in conversation list
        document.querySelectorAll('.dm-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-room-id="${this.currentRoomId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    updateChatHeader() {
        const conversation = this.conversations.find(c => c.id === this.currentRoomId);
        if (!conversation) return;

        const chatName = document.getElementById('chatName');
        const chatStatus = document.getElementById('chatStatus');

        chatName.textContent = conversation.name;
        
        if (conversation.type === 'direct') {
            const participant = conversation.participants[0];
            chatStatus.textContent = participant ? this.getStatusText(participant.status) : '';
        } else {
            chatStatus.textContent = `${conversation.participants.length} members`;
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'online': return 'Online';
            case 'away': return 'Away';
            case 'busy': return 'Do Not Disturb';
            case 'offline': return 'Offline';
            default: return '';
        }
    }

    formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString();
        }
    }

    getLastMessagePreview(conversation) {
        if (!conversation.last_message) return 'No messages yet';
        
        let preview = conversation.last_message;
        if (preview.length > 50) {
            preview = preview.substring(0, 50) + '...';
        }
        
        return preview;
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    scrollToMessage(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlighted');
            setTimeout(() => {
                messageElement.classList.remove('highlighted');
            }, 2000);
        }
    }

    // Create DM Modal functionality
    showCreateDMModal() {
        const modal = document.getElementById('createDMModal');
        modal.classList.remove('hidden');
        this.loadFriendsForDM();
    }

    hideCreateDMModal() {
        const modal = document.getElementById('createDMModal');
        modal.classList.add('hidden');
        this.resetDMModal();
    }

    async loadFriendsForDM() {
        try {
            const response = await fetch('/user/home/api/friends.php?action=all');
            const data = await response.json();
            
            if (data.friends) {
                this.renderDMUserList(data.friends);
            }
        } catch (error) {
            console.error('Error loading friends for DM:', error);
        }
    }

    renderDMUserList(friends) {
        const container = document.getElementById('dmUserList');
        
        container.innerHTML = friends.map(friend => `
            <div class="user-item" data-user-id="${friend.id}">
                <div class="user-checkbox">
                    <i class="fas fa-check hidden"></i>
                </div>
                <img src="${friend.avatar || '/assets/images/default-avatar.png'}" 
                     alt="${friend.display_name}" class="user-avatar-small">
                <div class="user-info">
                    <div class="user-name">${friend.display_name}</div>
                    <div class="user-status-text">${this.getStatusText(friend.status)}</div>
                </div>
            </div>
        `).join('');

        // Add click listeners for user selection
        container.addEventListener('click', (e) => {
            const userItem = e.target.closest('.user-item');
            if (userItem) {
                this.toggleUserSelection(userItem);
            }
        });
    }

    toggleUserSelection(userItem) {
        const isSelected = userItem.classList.contains('selected');
        
        if (isSelected) {
            userItem.classList.remove('selected');
            userItem.querySelector('.fa-check').classList.add('hidden');
        } else {
            userItem.classList.add('selected');
            userItem.querySelector('.fa-check').classList.remove('hidden');
        }

        this.updateSelectedUsersDisplay();
    }

    updateSelectedUsersDisplay() {
        const selectedItems = document.querySelectorAll('#dmUserList .user-item.selected');
        const selectedCount = document.querySelector('.selected-count');
        const selectedTags = document.getElementById('selectedUserTags');
        const groupSettings = document.getElementById('groupSettings');

        selectedCount.textContent = `SELECTED USERS (${selectedItems.length}):`;

        // Show group settings if more than 1 user selected
        if (selectedItems.length > 1) {
            groupSettings.classList.remove('hidden');
        } else {
            groupSettings.classList.add('hidden');
        }

        // Render selected user tags
        selectedTags.innerHTML = Array.from(selectedItems).map(item => {
            const userId = item.dataset.userId;
            const userName = item.querySelector('.user-name').textContent;
            
            return `
                <div class="user-tag" data-user-id="${userId}">
                    <span>${userName}</span>
                    <button class="user-tag-remove" onclick="window.chatManager.removeSelectedUser('${userId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    removeSelectedUser(userId) {
        const userItem = document.querySelector(`#dmUserList [data-user-id="${userId}"]`);
        if (userItem) {
            this.toggleUserSelection(userItem);
        }
    }

    async createDirectMessage() {
        const selectedItems = document.querySelectorAll('#dmUserList .user-item.selected');
        
        if (selectedItems.length === 0) {
            alert('Please select at least one user');
            return;
        }

        const userIds = Array.from(selectedItems).map(item => parseInt(item.dataset.userId));
        const groupName = selectedItems.length > 1 ? 
                         document.getElementById('groupNameInput').value.trim() : null;

        try {
            const response = await fetch('/user/home/api/chat.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create_dm',
                    user_ids: userIds,
                    group_name: groupName
                })
            });

            const data = await response.json();

            if (data.room_id) {
                this.hideCreateDMModal();
                this.loadConversations(); // Refresh conversation list
                this.openChat(data.room_id); // Open the new chat
            } else {
                alert(data.error || 'Failed to create conversation');
            }
        } catch (error) {
            console.error('Error creating direct message:', error);
            alert('Network error. Please try again.');
        }
    }

    resetDMModal() {
        // Clear selections
        document.querySelectorAll('#dmUserList .user-item.selected').forEach(item => {
            this.toggleUserSelection(item);
        });

        // Clear group settings
        document.getElementById('groupNameInput').value = '';
        document.getElementById('groupSettings').classList.add('hidden');

        // Clear search
        document.getElementById('dmUserSearch').value = '';
    }

         searchDMUsers(query) {
        const userItems = document.querySelectorAll('#dmUserList .user-item');
        
        userItems.forEach(item => {
            const userName = item.querySelector('.user-name').textContent.toLowerCase();
            const isVisible = userName.includes(query.toLowerCase());
            item.style.display = isVisible ? 'flex' : 'none';
        });
    }

    // File upload functionality
    async uploadFiles() {
        if (this.selectedFiles.length === 0) return null;

        const formData = new FormData();
        this.selectedFiles.forEach(file => {
            formData.append('files[]', file);
        });

        try {
            const response = await fetch('/user/home/api/upload.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.uploaded_files && data.uploaded_files.length > 0) {
                // Return the first file URL for now
                // In a more advanced implementation, you might handle multiple files differently
                return data.uploaded_files[0].url;
            } else {
                console.error('Upload failed:', data.errors || 'Unknown error');
                return null;
            }
        } catch (error) {
            console.error('Upload error:', error);
            return null;
        }
    }

    handleGroupImageSelection(file) {
        if (!file) return;

        const placeholder = document.getElementById('groupImagePlaceholder');
        const fileURL = URL.createObjectURL(file);

        placeholder.innerHTML = `<img src="${fileURL}" alt="Group Image" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    }
}

// Initialize chat manager
window.chatManager = new ChatManager();