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
        this.currentUserId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadConversations();
        this.getCurrentUserId();
    }

    async getCurrentUserId() {
        try {
            const response = await fetch('/user/home/api/user.php?action=current');
            const data = await response.json();
            if (data.user) {
                this.currentUserId = data.user.id;
            }
        } catch (error) {
            console.error('Error getting current user ID:', error);
        }
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

        // Create DM button (sidebar)
        document.getElementById('openDMModalBtn')?.addEventListener('click', () => {
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

        // Create DM/Group (modal submit button)
        document.getElementById('createDMSubmitBtn')?.addEventListener('click', () => {
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
            // Show loading state
            const container = document.getElementById('chatMessages');
            if (container) {
                container.innerHTML = '<div class="loading-state"><p>Loading messages...</p></div>';
            }
            
            const response = await fetch(`/user/home/api/chat.php?action=messages&room_id=${roomId}`);
            const data = await response.json();
            
            if (data.messages) {
                this.messages = data.messages;
                this.renderMessages(data.messages);
                // Ensure we scroll to bottom after loading messages
                setTimeout(() => this.scrollToBottom(), 100);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            const container = document.getElementById('chatMessages');
            if (container) {
                container.innerHTML = '<div class="error-state"><p>Failed to load messages. Please try again.</p></div>';
            }
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
            if (group.type === 'group') {
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
        const isCurrentUser = this.currentUserId && message.user_id === this.currentUserId;
        
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
                    ${isCurrentUser ? `
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
        // Safety checks for missing data
        if (!replyTo) return '';
        
        const username = replyTo.username || replyTo.display_name || 'Unknown User';
        const content = replyTo.content || 'Message not found';
        
        return `
            <div class="reply-reference" data-reply-to="${replyTo.id}">
                <i class="fas fa-reply"></i>
                <span class="reply-author">${username}</span>
                <span class="reply-content">${content}</span>
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
                console.log('Sending message to room:', this.currentRoomId, 'Content:', content);
                console.log('Message data:', messageData);
                
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

                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseText = await response.text();
                console.log('Raw response:', responseText);

                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    console.error('Response text:', responseText);
                    throw new Error('Invalid JSON response from server');
                }

                console.log('Send message response:', data);

                if (data.success) {
                    // Message sent successfully
                    messageInput.value = '';
                    this.autoResizeTextarea(messageInput);
                    this.cancelReply();
                    this.clearSelectedFiles();
                    
                    // Add message to UI immediately
                    if (data.message) {
                        console.log('Adding message to UI:', data.message);
                        this.addMessage(data.message);
                    } else {
                        console.log('No message data returned, reloading messages');
                        // Fallback: reload messages if no message data returned
                        this.loadMessages(this.currentRoomId);
                    }
                    
                    // Also try to send via socket for real-time update to other users
                    window.socketClient?.sendMessage(this.currentRoomId, content, this.replyingTo);
                } else {
                    console.error('Failed to send message:', data.error);
                    this.showErrorNotification('Failed to send message: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error sending message:', error);
                this.showErrorNotification('Network error while sending message: ' + error.message);
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
                // Update the message in our local array
                const messageIndex = this.messages.findIndex(m => m.id == messageId);
                if (messageIndex !== -1) {
                    this.messages[messageIndex].content = content;
                    this.messages[messageIndex].edited_at = new Date().toISOString();
                    // Re-render messages to show the edit immediately
                    this.renderMessages(this.messages);
                }
                
                this.cancelEdit();
                
                // Update message via socket for other users
                window.socketClient?.editMessage(messageId, content);
                
                this.showSuccessNotification('Message edited successfully');
            } else {
                console.error('Failed to edit message:', data.error);
                this.showErrorNotification('Failed to edit message: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error editing message:', error);
            this.showErrorNotification('Network error while editing message');
        }
    }

    async deleteMessage(messageId) {
        const modal = document.getElementById('deleteMessageModal');
        if (!modal) {
            console.error('Delete message modal not found');
            return;
        }

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
                    // Reload messages to show updated list
                    this.loadMessages(this.currentRoomId);
                } else {
                    console.error('Failed to delete message:', data.error);
                    // this.showErrorNotification('Failed to delete message: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error deleting message:', error);
                // this.showErrorNotification('Network error while deleting message');
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

        // Close modal when clicking outside
        const handleClickOutside = (e) => {
            if (e.target === modal) {
                handleCancel();
                modal.removeEventListener('click', handleClickOutside);
            }
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleClickOutside);
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

            const responseText = await response.text();
            console.log('Raw toggle reaction response:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text:', responseText);
                this.showErrorNotification('Server returned invalid response. Please check console for details.');
                return;
            }

            if (data.success) {
                console.log('Reaction successful, updating UI for message:', messageId);
                console.log('Reactions data:', data.reactions);
                
                // Update reactions immediately in the UI
                if (data.reactions) {
                    this.updateMessageReactions(messageId, data.reactions);
                } else {
                    console.log('No reactions data, refreshing from server');
                    // Fallback: reload just the reactions for this message
                    await this.refreshMessageReactions(messageId);
                }
                
                // Update reaction via socket for other users
                window.socketClient?.reactToMessage(messageId, emoji);
            } else {
                console.error('Failed to react to message:', data.error);
                this.showErrorNotification('Failed to add reaction: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error reacting to message:', error);
            this.showErrorNotification('Network error while adding reaction');
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

        // Show edit context with cancel option
        this.showEditContext(message);
    }

    showEditContext(message) {
        // Create or get edit context element
        let editContext = document.getElementById('editContext');
        if (!editContext) {
            editContext = document.createElement('div');
            editContext.id = 'editContext';
            editContext.className = 'edit-context';
            editContext.innerHTML = `
                <div class="edit-indicator">
                    <i class="fas fa-edit"></i>
                    <span>Editing message</span>
                    <button id="cancelEdit" class="cancel-edit-btn" title="Cancel Edit">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="edit-original">
                    <span id="editOriginalContent"></span>
                </div>
            `;
            
            // Insert before message input area
            const messageInputContainer = document.querySelector('.message-input-container') || 
                                        document.querySelector('.message-input') || 
                                        document.getElementById('messageInput').parentElement;
            if (messageInputContainer) {
                messageInputContainer.insertBefore(editContext, messageInputContainer.firstChild);
            }

            // Add cancel event listener
            document.getElementById('cancelEdit').addEventListener('click', () => {
                this.cancelEdit();
            });
        }

        // Update content
        document.getElementById('editOriginalContent').textContent = message.content;
        editContext.classList.remove('hidden');
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

        // Hide edit context
        const editContext = document.getElementById('editContext');
        if (editContext) {
            editContext.classList.add('hidden');
        }
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

    showEmojiPickerForMessage(messageId, button) {
        // Simple emoji picker - you can replace this with a more sophisticated one
        const emojis = ['👍', '👎', '❤️', '😂', '😮', '😢', '😡', '👏', '🙏', '🔥'];
        
        // Create emoji picker container
        let picker = document.getElementById('emojiPicker');
        if (!picker) {
            picker = document.createElement('div');
            picker.id = 'emojiPicker';
            picker.className = 'emoji-picker';
            document.body.appendChild(picker);
        }

        // Position the picker near the button
        const rect = button.getBoundingClientRect();
        picker.style.left = rect.left + 'px';
        picker.style.top = (rect.top - 60) + 'px';
        picker.style.display = 'flex';

        // Populate with emojis
        picker.innerHTML = emojis.map(emoji => 
            `<button class="emoji-btn" data-emoji="${emoji}">${emoji}</button>`
        ).join('');

        // Add click handlers
        picker.addEventListener('click', async (e) => {
            if (e.target.classList.contains('emoji-btn')) {
                const emoji = e.target.dataset.emoji;
                await this.reactToMessage(messageId, emoji);
                picker.style.display = 'none';
            }
        });

        // Close picker when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeEmojiPicker(e) {
                if (!picker.contains(e.target) && e.target !== button) {
                    picker.style.display = 'none';
                    document.removeEventListener('click', closeEmojiPicker);
                }
            });
        }, 100);
    }

    async reactToMessage(messageId, emoji) {
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

            const responseText = await response.text();
            console.log('Raw reaction response:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text:', responseText);
                this.showErrorNotification('Server returned invalid response. Please check console for details.');
                return;
            }
            
            if (data.success) {
                // Update reactions immediately in the UI
                if (data.reactions) {
                    this.updateMessageReactions(messageId, data.reactions);
                } else {
                    // Fallback: reload just the reactions for this message
                    await this.refreshMessageReactions(messageId);
                }
                
                this.showSuccessNotification('Reaction added!');
            } else {
                console.error('Failed to react to message:', data.error);
                this.showErrorNotification('Failed to add reaction: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error reacting to message:', error);
            this.showErrorNotification('Network error while adding reaction');
        }
    }

    async refreshMessageReactions(messageId) {
        try {
            const response = await fetch(`/user/home/api/chat.php?action=get_message_reactions&message_id=${messageId}`);
            const data = await response.json();
            
            if (data.success && data.reactions) {
                this.updateMessageReactions(messageId, data.reactions);
            }
        } catch (error) {
            console.error('Error refreshing message reactions:', error);
        }
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
        // Ensure the message has all required properties
        if (!message.reactions) {
            message.reactions = [];
        }
        
        // If this message is a reply, make sure we have the complete reply reference data
        if (message.reply_to && (!message.reply_to.username || !message.reply_to.content)) {
            // Find the original message in our current messages array
            const originalMessage = this.messages.find(m => m.id == message.reply_to.id || m.id == message.reply_to);
            if (originalMessage) {
                message.reply_to = {
                    id: originalMessage.id,
                    username: originalMessage.username,
                    content: originalMessage.content
                };
            }
        }
        
        this.messages.push(message);
        // Re-render messages to maintain grouping
        this.renderMessages(this.messages);
        this.scrollToBottom();
        
        // Also update the conversation list to show the latest message
        // Use a small delay to ensure the database is updated
        setTimeout(() => {
            this.loadConversations();
        }, 100);
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
        console.log('updateMessageReactions called for message:', messageId);
        console.log('New reactions:', reactions);
        
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            message.reactions = reactions;
            // Update just the reactions for this message
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            console.log('Message element found:', !!messageElement);
            
            if (messageElement) {
                const reactionsContainer = messageElement.querySelector('.message-reactions');
                console.log('Existing reactions container found:', !!reactionsContainer);
                
                if (reactionsContainer) {
                    // Replace the entire reactions container
                    const newReactionsHTML = this.renderMessageReactions(reactions);
                    console.log('New reactions HTML:', newReactionsHTML);
                    
                    if (reactions.length > 0) {
                        reactionsContainer.outerHTML = newReactionsHTML;
                        console.log('Reactions container updated');
                    } else {
                        // If no reactions, remove the container
                        reactionsContainer.remove();
                        console.log('Reactions container removed');
                    }
                } else if (reactions.length > 0) {
                    // Add new reactions container if it doesn't exist
                    const content = messageElement.querySelector('.message-content');
                    content.insertAdjacentHTML('afterend', this.renderMessageReactions(reactions));
                    console.log('New reactions container added');
                }
            }
        } else {
            console.log('Message not found in messages array');
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
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMs = now - date;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        // Today - show time
        if (diffInDays === 0) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        // Yesterday
        else if (diffInDays === 1) {
            return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        // This year - show month and day
        else if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString([], { month: '2-digit', day: '2-digit' }) + 
                   ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        // Different year - show full date
        else {
            return date.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' }) + 
                   ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
            // Use requestAnimationFrame to ensure DOM is updated
            requestAnimationFrame(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
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

    showErrorNotification(message) {
        // Create or get existing notification container
        let container = document.getElementById('errorNotifications');
        if (!container) {
            container = document.createElement('div');
            container.id = 'errorNotifications';
            container.className = 'error-notifications';
            document.body.appendChild(container);
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    showSuccessNotification(message) {
        // Create or get existing notification container
        let container = document.getElementById('successNotifications');
        if (!container) {
            container = document.createElement('div');
            container.id = 'successNotifications';
            container.className = 'success-notifications';
            document.body.appendChild(container);
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
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
            this.showErrorNotification('Please select at least one user');
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
                
                // Wait a bit for the conversation to be fully created in the database
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Refresh conversation list and open the new chat
                await this.loadConversations();
                await this.openChat(data.room_id);
            } else {
                this.showErrorNotification(data.error || 'Failed to create conversation');
            }
        } catch (error) {
            console.error('Error creating direct message:', error);
            this.showErrorNotification('Network error. Please try again.');
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
// Fixed syntax error - reload complete