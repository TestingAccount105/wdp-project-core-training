class ChannelManager {
    constructor() {
        this.currentChannelId = null;
        this.messages = [];
        this.messageContainer = null;
        this.messageInput = null;
        this.isLoadingMessages = false;
        this.lastMessageId = null;
        this.init();
    }

    init() {
        this.messageContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.bindEventListeners();
        this.initializeEmojiPicker();
    }

    bindEventListeners() {
        // Message input
        if (this.messageInput) {
            this.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Auto-resize textarea
            this.messageInput.addEventListener('input', () => {
                this.autoResizeTextarea(this.messageInput);
            });
        }

        // Send button
        const sendButton = document.querySelector('.send-message');
        if (sendButton) {
            sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        // File upload
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files);
            });
        }

        // Emoji button
        const emojiButton = document.querySelector('.emoji-button');
        if (emojiButton) {
            emojiButton.addEventListener('click', () => {
                this.toggleEmojiPicker();
            });
        }

        // Message actions
        this.messageContainer?.addEventListener('click', (e) => {
            this.handleMessageAction(e);
        });

        // Scroll to load more messages
        this.messageContainer?.addEventListener('scroll', () => {
            if (this.messageContainer.scrollTop === 0 && !this.isLoadingMessages) {
                this.loadMoreMessages();
            }
        });

        // Message search
        const searchInput = document.querySelector('.message-search input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchMessages(e.target.value);
            });
        }
    }

    initializeEmojiPicker() {
        // Simple emoji picker - in a real app you'd use a library like emoji-mart
        const emojiPicker = document.querySelector('.emoji-picker');
        if (emojiPicker) {
            const emojis = ['😀', '😂', '😍', '🤔', '😢', '😡', '👍', '👎', '❤️', '🎉', '🔥', '💯'];
            
            emojiPicker.innerHTML = emojis.map(emoji => 
                `<span class="emoji-option" data-emoji="${emoji}">${emoji}</span>`
            ).join('');

            emojiPicker.addEventListener('click', (e) => {
                if (e.target.classList.contains('emoji-option')) {
                    this.insertEmoji(e.target.dataset.emoji);
                }
            });
        }
    }

    async switchToChannel(channelId, channelType = 'Text') {
        if (this.currentChannelId === channelId) return;

        this.currentChannelId = channelId;
        
        // Update UI
        this.updateChannelHeader(channelId);
        this.updateActiveChannel(channelId);
        
        // Show appropriate interface
        if (channelType === 'Text') {
            this.showTextInterface();
            await this.loadMessages(channelId);
        } else if (channelType === 'Voice') {
            this.showVoiceInterface();
        }

        // Join channel room for real-time updates
        if (window.socket) {
            window.socket.emit('join_channel', { channelId });
        }
    }

    updateChannelHeader(channelId) {
        const channel = serverApp.channels.find(c => c.ID == channelId);
        if (!channel) return;

        const headerName = document.querySelector('.channel-header .channel-name');
        const headerIcon = document.querySelector('.channel-header .channel-icon');
        
        if (headerName) {
            headerName.textContent = channel.Name;
        }
        
        if (headerIcon) {
            headerIcon.innerHTML = channel.Type === 'Voice' ? 
                '<i class="fas fa-volume-up"></i>' : 
                '<i class="fas fa-hashtag"></i>';
        }
    }

    updateActiveChannel(channelId) {
        // Remove active class from all channels
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current channel
        const activeChannel = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (activeChannel) {
            activeChannel.classList.add('active');
        }
    }

    showTextInterface() {
        const chatInterface = document.querySelector('.chat-interface');
        const voiceInterface = document.querySelector('.voice-interface');
        
        if (chatInterface) chatInterface.style.display = 'flex';
        if (voiceInterface) voiceInterface.style.display = 'none';
    }

    showVoiceInterface() {
        const chatInterface = document.querySelector('.chat-interface');
        const voiceInterface = document.querySelector('.voice-interface');
        
        if (chatInterface) chatInterface.style.display = 'none';
        if (voiceInterface) voiceInterface.style.display = 'flex';
    }

    async loadMessages(channelId, before = null) {
        if (this.isLoadingMessages) return;
        
        this.isLoadingMessages = true;
        
        try {
            const url = `/user/user-server/api/channels.php?action=getMessages&channelId=${channelId}&limit=50${before ? `&before=${before}` : ''}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                if (before) {
                    // Prepend older messages
                    this.messages = [...data.messages, ...this.messages];
                    this.prependMessages(data.messages);
                } else {
                    // Load initial messages
                    this.messages = data.messages;
                    this.renderMessages();
                    this.scrollToBottom();
                }
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            this.isLoadingMessages = false;
        }
    }

    async loadMoreMessages() {
        if (this.messages.length === 0) return;
        
        const oldestMessage = this.messages[0];
        if (oldestMessage) {
            await this.loadMessages(this.currentChannelId, oldestMessage.SentAt);
        }
    }

    renderMessages() {
        if (!this.messageContainer) return;

        this.messageContainer.innerHTML = this.messages.map(message => 
            this.createMessageElement(message)
        ).join('');

        // Add timestamp separators
        this.addTimestampSeparators();
    }

    prependMessages(messages) {
        if (!this.messageContainer || messages.length === 0) return;

        const scrollHeight = this.messageContainer.scrollHeight;
        const scrollTop = this.messageContainer.scrollTop;

        const messagesHtml = messages.map(message => 
            this.createMessageElement(message)
        ).join('');

        this.messageContainer.insertAdjacentHTML('afterbegin', messagesHtml);

        // Maintain scroll position
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight - scrollHeight + scrollTop;
    }

    createMessageElement(message) {
        const timestamp = new Date(message.SentAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        const isEdited = message.EditedAt && message.EditedAt !== message.SentAt;
        const avatar = message.ProfilePictureUrl || '/assets/images/default-avatar.png';
        
        const reactions = message.reactions ? message.reactions.map(reaction => 
            `<span class="reaction" data-emoji="${reaction.emoji}" data-message-id="${message.ID}">
                ${reaction.emoji} ${reaction.count}
            </span>`
        ).join('') : '';

        const replyHtml = message.ReplyContent ? `
            <div class="message-reply">
                <i class="fas fa-reply"></i>
                <span class="reply-author">${message.ReplyUsername}</span>
                <span class="reply-content">${this.truncateText(message.ReplyContent, 50)}</span>
            </div>
        ` : '';

        return `
            <div class="message" data-message-id="${message.ID}" data-user-id="${message.UserID}">
                <div class="message-avatar">
                    <img src="${avatar}" alt="${message.Username}">
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">${message.DisplayName || message.Username}</span>
                        <span class="message-timestamp">${timestamp}</span>
                        ${isEdited ? '<span class="message-edited">(edited)</span>' : ''}
                    </div>
                    ${replyHtml}
                    <div class="message-text">${this.formatMessageContent(message.Content)}</div>
                    ${message.AttachmentURL ? `<div class="message-attachment">
                        ${this.renderAttachment(message.AttachmentURL)}
                    </div>` : ''}
                    ${reactions ? `<div class="message-reactions">${reactions}</div>` : ''}
                </div>
                <div class="message-actions">
                    <button class="action-btn reaction-btn" data-action="react" title="Add Reaction">
                        <i class="far fa-smile"></i>
                    </button>
                    <button class="action-btn reply-btn" data-action="reply" title="Reply">
                        <i class="fas fa-reply"></i>
                    </button>
                    ${message.UserID == window.currentUser?.id ? `
                        <button class="action-btn edit-btn" data-action="edit" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" data-action="delete" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    formatMessageContent(content) {
        if (!content) return '';

        // Format mentions
        content = content.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
        
        // Format links
        content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        
        // Format basic markdown
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        content = content.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Convert line breaks
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }

    renderAttachment(url) {
        const extension = url.split('.').pop().toLowerCase();
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const videoExtensions = ['mp4', 'webm', 'ogg'];
        const audioExtensions = ['mp3', 'wav', 'ogg'];

        if (imageExtensions.includes(extension)) {
            return `<img src="${url}" alt="Image attachment" class="attachment-image">`;
        } else if (videoExtensions.includes(extension)) {
            return `<video src="${url}" controls class="attachment-video"></video>`;
        } else if (audioExtensions.includes(extension)) {
            return `<audio src="${url}" controls class="attachment-audio"></audio>`;
        } else {
            const filename = url.split('/').pop();
            return `<a href="${url}" target="_blank" class="attachment-file">
                <i class="fas fa-file"></i> ${filename}
            </a>`;
        }
    }

    addTimestampSeparators() {
        const messages = this.messageContainer.querySelectorAll('.message');
        let lastDate = null;

        messages.forEach((message, index) => {
            const messageId = message.dataset.messageId;
            const messageData = this.messages.find(m => m.ID == messageId);
            
            if (messageData) {
                const messageDate = new Date(messageData.SentAt).toDateString();
                
                if (messageDate !== lastDate) {
                    const separator = document.createElement('div');
                    separator.className = 'timestamp-separator';
                    separator.innerHTML = `<span>${this.formatDate(messageDate)}</span>`;
                    
                    message.parentNode.insertBefore(separator, message);
                    lastDate = messageDate;
                }
            }
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (dateString === today) {
            return 'Today';
        } else if (dateString === yesterday) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    async sendMessage() {
        const content = this.messageInput.value.trim();
        if (!content && !this.selectedFile) return;

        const formData = new FormData();
        formData.append('action', 'sendMessage');
        formData.append('channelId', this.currentChannelId);
        formData.append('content', content);

        if (this.replyingTo) {
            formData.append('replyTo', this.replyingTo);
        }

        if (this.selectedFile) {
            formData.append('attachment', this.selectedFile);
        }

        try {
            const response = await fetch('/user/user-server/api/channels.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.messageInput.value = '';
                this.clearReply();
                this.clearFileSelection();
                this.autoResizeTextarea(this.messageInput);

                // Message will be added via socket event
            } else {
                serverApp.showToast(data.error || 'Failed to send message', 'error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            serverApp.showToast('Failed to send message', 'error');
        }
    }

    handleMessageAction(e) {
        const actionBtn = e.target.closest('.action-btn');
        if (!actionBtn) return;

        const messageElement = actionBtn.closest('.message');
        const messageId = messageElement.dataset.messageId;
        const action = actionBtn.dataset.action;

        switch (action) {
            case 'react':
                this.showReactionPicker(messageId, actionBtn);
                break;
            case 'reply':
                this.replyToMessage(messageId);
                break;
            case 'edit':
                this.editMessage(messageId);
                break;
            case 'delete':
                this.deleteMessage(messageId);
                break;
        }
    }

    showReactionPicker(messageId, button) {
        const picker = document.querySelector('.reaction-picker');
        if (!picker) return;

        // Position picker near the button
        const rect = button.getBoundingClientRect();
        picker.style.top = `${rect.top - picker.offsetHeight - 5}px`;
        picker.style.left = `${rect.left}px`;
        picker.style.display = 'block';

        // Set current message for reactions
        picker.dataset.messageId = messageId;

        // Hide picker when clicking outside
        const hidePickerHandler = (e) => {
            if (!picker.contains(e.target) && !button.contains(e.target)) {
                picker.style.display = 'none';
                document.removeEventListener('click', hidePickerHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', hidePickerHandler), 100);
    }

    async addReaction(messageId, emoji) {
        const formData = new FormData();
        formData.append('action', 'addReaction');
        formData.append('messageId', messageId);
        formData.append('emoji', emoji);

        try {
            const response = await fetch('/user/user-server/api/channels.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (!data.success) {
                serverApp.showToast(data.error || 'Failed to add reaction', 'error');
            }
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    }

    replyToMessage(messageId) {
        const message = this.messages.find(m => m.ID == messageId);
        if (!message) return;

        this.replyingTo = messageId;
        this.showReplyPreview(message);
        this.messageInput.focus();
    }

    showReplyPreview(message) {
        const replyPreview = document.querySelector('.reply-preview');
        if (!replyPreview) return;

        replyPreview.innerHTML = `
            <div class="reply-info">
                <i class="fas fa-reply"></i>
                <span>Replying to <strong>${message.DisplayName || message.Username}</strong></span>
                <button class="cancel-reply" onclick="channelManager.clearReply()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="reply-content">${this.truncateText(message.Content, 100)}</div>
        `;
        replyPreview.style.display = 'block';
    }

    clearReply() {
        this.replyingTo = null;
        const replyPreview = document.querySelector('.reply-preview');
        if (replyPreview) {
            replyPreview.style.display = 'none';
        }
    }

    async editMessage(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        const messageText = messageElement.querySelector('.message-text');
        const originalContent = messageText.textContent;

        // Create edit input
        const editInput = document.createElement('textarea');
        editInput.className = 'edit-message-input';
        editInput.value = originalContent;
        editInput.rows = 1;

        // Replace message text with input
        messageText.style.display = 'none';
        messageText.parentNode.insertBefore(editInput, messageText.nextSibling);

        // Auto-resize and focus
        this.autoResizeTextarea(editInput);
        editInput.focus();
        editInput.setSelectionRange(editInput.value.length, editInput.value.length);

        // Handle save/cancel
        const saveEdit = async () => {
            const newContent = editInput.value.trim();
            if (newContent && newContent !== originalContent) {
                await this.saveMessageEdit(messageId, newContent);
            }
            this.cancelEdit(editInput, messageText);
        };

        const cancelEdit = () => {
            this.cancelEdit(editInput, messageText);
        };

        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                cancelEdit();
            }
        });

        editInput.addEventListener('blur', saveEdit);
    }

    cancelEdit(editInput, messageText) {
        editInput.remove();
        messageText.style.display = 'block';
    }

    async saveMessageEdit(messageId, content) {
        const formData = new FormData();
        formData.append('action', 'editMessage');
        formData.append('messageId', messageId);
        formData.append('content', content);

        try {
            const response = await fetch('/user/user-server/api/channels.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (!data.success) {
                serverApp.showToast(data.error || 'Failed to edit message', 'error');
            }
        } catch (error) {
            console.error('Error editing message:', error);
        }
    }

    async deleteMessage(messageId) {
        if (!confirm('Are you sure you want to delete this message?')) return;

        const formData = new FormData();
        formData.append('action', 'deleteMessage');
        formData.append('messageId', messageId);

        try {
            const response = await fetch('/user/user-server/api/channels.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (!data.success) {
                serverApp.showToast(data.error || 'Failed to delete message', 'error');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    }

    handleFileUpload(files) {
        if (files.length === 0) return;

        const file = files[0];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (file.size > maxSize) {
            serverApp.showToast('File size must be less than 10MB', 'error');
            return;
        }

        this.selectedFile = file;
        this.showFilePreview(file);
    }

    showFilePreview(file) {
        const preview = document.querySelector('.file-preview');
        if (!preview) return;

        const fileIcon = this.getFileIcon(file.type);
        
        preview.innerHTML = `
            <div class="file-info">
                <i class="${fileIcon}"></i>
                <span class="file-name">${file.name}</span>
                <span class="file-size">(${this.formatFileSize(file.size)})</span>
                <button class="remove-file" onclick="channelManager.clearFileSelection()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        preview.style.display = 'block';
    }

    clearFileSelection() {
        this.selectedFile = null;
        const preview = document.querySelector('.file-preview');
        const fileInput = document.getElementById('fileInput');
        
        if (preview) preview.style.display = 'none';
        if (fileInput) fileInput.value = '';
    }

    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return 'fas fa-image';
        if (mimeType.startsWith('video/')) return 'fas fa-video';
        if (mimeType.startsWith('audio/')) return 'fas fa-music';
        if (mimeType.includes('pdf')) return 'fas fa-file-pdf';
        if (mimeType.includes('word')) return 'fas fa-file-word';
        return 'fas fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    toggleEmojiPicker() {
        const picker = document.querySelector('.emoji-picker');
        if (picker) {
            picker.style.display = picker.style.display === 'block' ? 'none' : 'block';
        }
    }

    insertEmoji(emoji) {
        const cursorPos = this.messageInput.selectionStart;
        const textBefore = this.messageInput.value.substring(0, cursorPos);
        const textAfter = this.messageInput.value.substring(cursorPos);
        
        this.messageInput.value = textBefore + emoji + textAfter;
        this.messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        this.messageInput.focus();
        
        this.toggleEmojiPicker();
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }

    scrollToBottom() {
        if (this.messageContainer) {
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        }
    }

    // Socket event handlers
    onNewMessage(messageData) {
        if (messageData.channelId == this.currentChannelId) {
            this.messages.push(messageData);
            const messageHtml = this.createMessageElement(messageData);
            this.messageContainer.insertAdjacentHTML('beforeend', messageHtml);
            this.scrollToBottom();
        }
    }

    onMessageUpdated(messageData) {
        const messageElement = document.querySelector(`[data-message-id="${messageData.ID}"]`);
        if (messageElement) {
            const messageText = messageElement.querySelector('.message-text');
            messageText.innerHTML = this.formatMessageContent(messageData.Content);
            
            // Add edited indicator
            const header = messageElement.querySelector('.message-header');
            if (!header.querySelector('.message-edited')) {
                header.insertAdjacentHTML('beforeend', '<span class="message-edited">(edited)</span>');
            }
        }

        // Update in messages array
        const messageIndex = this.messages.findIndex(m => m.ID == messageData.ID);
        if (messageIndex !== -1) {
            this.messages[messageIndex] = { ...this.messages[messageIndex], ...messageData };
        }
    }

    onMessageDeleted(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
        }

        // Remove from messages array
        this.messages = this.messages.filter(m => m.ID != messageId);
    }

    onReactionAdded(data) {
        const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
        if (messageElement) {
            let reactionsContainer = messageElement.querySelector('.message-reactions');
            
            if (!reactionsContainer) {
                reactionsContainer = document.createElement('div');
                reactionsContainer.className = 'message-reactions';
                messageElement.querySelector('.message-content').appendChild(reactionsContainer);
            }

            // Update or add reaction
            const existingReaction = reactionsContainer.querySelector(`[data-emoji="${data.emoji}"]`);
            if (existingReaction) {
                const count = parseInt(existingReaction.textContent.split(' ')[1]) + 1;
                existingReaction.textContent = `${data.emoji} ${count}`;
            } else {
                const reactionElement = document.createElement('span');
                reactionElement.className = 'reaction';
                reactionElement.dataset.emoji = data.emoji;
                reactionElement.dataset.messageId = data.messageId;
                reactionElement.textContent = `${data.emoji} 1`;
                reactionsContainer.appendChild(reactionElement);
            }
        }
    }

    async searchMessages(query) {
        if (!query.trim()) {
            this.clearSearchResults();
            return;
        }

        try {
            const response = await fetch(`/user/user-server/api/channels.php?action=searchMessages&serverId=${serverApp.currentServerId}&query=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.success) {
                this.displaySearchResults(data.messages);
            }
        } catch (error) {
            console.error('Error searching messages:', error);
        }
    }

    displaySearchResults(messages) {
        const resultsContainer = document.querySelector('.search-results');
        if (!resultsContainer) return;

        if (messages.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No messages found</div>';
            return;
        }

        resultsContainer.innerHTML = messages.map(message => `
            <div class="search-result" data-message-id="${message.ID}" data-channel-id="${message.ChannelID}">
                <div class="result-channel">#${message.ChannelName}</div>
                <div class="result-message">
                    <span class="result-author">${message.Username}</span>
                    <span class="result-content">${this.highlightSearchTerm(message.Content, query)}</span>
                    <span class="result-date">${new Date(message.SentAt).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');

        // Add click handlers to jump to messages
        resultsContainer.addEventListener('click', (e) => {
            const result = e.target.closest('.search-result');
            if (result) {
                this.jumpToMessage(result.dataset.channelId, result.dataset.messageId);
            }
        });
    }

    highlightSearchTerm(text, term) {
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    async jumpToMessage(channelId, messageId) {
        // Switch to channel if different
        if (channelId != this.currentChannelId) {
            await this.switchToChannel(channelId);
        }

        // Find and highlight message
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlighted');
            
            setTimeout(() => {
                messageElement.classList.remove('highlighted');
            }, 3000);
        }
    }

    clearSearchResults() {
        const resultsContainer = document.querySelector('.search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
    }
}

// Initialize channel manager
const channelManager = new ChannelManager();

// Export for global access
window.channelManager = channelManager;