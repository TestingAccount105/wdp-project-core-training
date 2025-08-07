class ModalManager {
    constructor() {
        this.currentCropper = null;
        this.init();
    }

    init() {
        this.bindEventListeners();
        this.initializeImageCutters();
    }

    bindEventListeners() {
        // Modal close buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-close, .modal-cancel')) {
                this.closeModal(e.target.closest('.modal'));
            }
            
            // Close modal when clicking backdrop
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // Create Server Modal
        this.bindCreateServerEvents();
        
        // User Settings Modal
        this.bindUserSettingsEvents();
        
        // Server Settings Modal
        this.bindServerSettingsEvents();
        
        // Invite People Modal
        this.bindInvitePeopleEvents();
        
        // Create Channel Modal
        this.bindCreateChannelEvents();
        
        // Leave Server Modal
        this.bindLeaveServerEvents();
    }

    bindCreateServerEvents() {
        const modal = document.getElementById('createServerModal');
        const form = modal.querySelector('form');
        const publicToggle = modal.querySelector('#serverPublic');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateServer(form);
        });

        // Server name input validation
        const nameInput = modal.querySelector('#serverName');
        nameInput.addEventListener('input', () => {
            this.validateServerName(nameInput);
        });
        
        // Bind image upload handlers
        this.bindImageUploadHandlers();
    }
    
    bindImageUploadHandlers() {
        // Server icon upload
        const iconInput = document.getElementById('serverIconInput');
        const iconPreview = document.getElementById('serverIconPreview');
        
        if (iconInput && iconPreview) {
            iconInput.addEventListener('change', (e) => {
                this.handleImagePreview(e.target, iconPreview, 'icon');
            });
        }
        
        // Server banner upload
        const bannerInput = document.getElementById('serverBannerInput');
        const bannerPreview = document.getElementById('serverBannerPreview');
        
        if (bannerInput && bannerPreview) {
            bannerInput.addEventListener('change', (e) => {
                this.handleImagePreview(e.target, bannerPreview, 'banner');
            });
        }
    }
    
    handleImagePreview(input, preview, type) {
        const file = input.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            serverApp.showToast('Please select a valid image file', 'error');
            input.value = '';
            return;
        }
        
        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            serverApp.showToast('Image file size must be less than 5MB', 'error');
            input.value = '';
            return;
        }
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            if (type === 'icon') {
                preview.innerHTML = `<img src="${e.target.result}" alt="Server Icon Preview" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">`;
            } else if (type === 'banner') {
                preview.innerHTML = `<img src="${e.target.result}" alt="Server Banner Preview" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;">`;
            }
        };
        reader.readAsDataURL(file);
    }

    bindUserSettingsEvents() {
        const modal = document.getElementById('userSettingsModal');
        
        // Tab switching
        const navItems = modal.querySelectorAll('.settings-nav-item');
        navItems.forEach(navItem => {
            navItem.addEventListener('click', () => {
                if (navItem.onclick) return; // Skip if it has onclick handler (like logout)
                const targetTab = navItem.dataset.tab;
                this.switchUserSettingsTab(targetTab);
            });
        });

        // Form field change detection
        this.bindFieldChangeDetection();

        // Image upload handlers
        this.bindImageUploadHandlers();

        // Email reveal toggle
        const emailRevealBtn = modal.querySelector('#revealEmailBtn');
        if (emailRevealBtn) {
            emailRevealBtn.addEventListener('click', () => {
                this.toggleEmailReveal();
            });
        }

        // Character count for about me
        const aboutMeField = modal.querySelector('#aboutMeField');
        if (aboutMeField) {
            aboutMeField.addEventListener('input', () => {
                this.updateCharacterCount(aboutMeField, 'aboutMeCount');
                this.showSaveButton('saveAboutMeBtn');
            });
        }

        // Device testing
        this.bindDeviceTestingEvents(modal);

        // Voice & Video subtabs
        const voiceVideoTabs = modal.querySelectorAll('.tab-btn');
        voiceVideoTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchVoiceVideoTab(tab.dataset.subtab);
            });
        });
    }

    bindServerSettingsEvents() {
        const modal = document.getElementById('serverSettingsModal');
        
        // Tab switching
        const tabs = modal.querySelectorAll('.settings-tab');
        const contents = modal.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                this.switchSettingsTab(targetTab, tabs, contents);
            });
        });

        // Server profile form
        const profileForm = modal.querySelector('#serverProfileForm');
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleServerProfileUpdate(profileForm);
        });

        // Channel management
        this.bindChannelManagementEvents(modal);
        
        // Member management
        this.bindMemberManagementEvents(modal);
        
        // Server deletion
        const deleteForm = modal.querySelector('#deleteServerForm');
        deleteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleServerDeletion(deleteForm);
        });
    }

    bindInvitePeopleEvents() {
        const modal = document.getElementById('invitePeopleModal');
        
        // Generate invite
        const generateBtn = modal.querySelector('.generate-invite');
        generateBtn.addEventListener('click', () => {
            this.generateInvite();
        });

        // Copy invite links
        modal.addEventListener('click', (e) => {
            if (e.target.matches('.copy-invite')) {
                this.copyInviteLink(e.target);
            }
            
            if (e.target.matches('.delete-invite')) {
                this.deleteInvite(e.target.dataset.inviteId);
            }
        });

        // Invite Titibot
        const titibotBtn = modal.querySelector('.invite-titibot');
        titibotBtn.addEventListener('click', () => {
            this.inviteTitibot();
        });
    }

    bindCreateChannelEvents() {
        const modal = document.getElementById('createChannelModal');
        const form = modal.querySelector('form');
        const nameInput = modal.querySelector('#channelName');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateChannel(form);
        });

        // Channel name formatting
        nameInput.addEventListener('input', () => {
            this.formatChannelName(nameInput);
        });
    }

    bindLeaveServerEvents() {
        const modal = document.getElementById('leaveServerModal');
        const form = modal.querySelector('form');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLeaveServer(form);
        });
    }

    bindDeviceTestingEvents(modal) {
        // Volume sliders
        const inputVolumeSlider = modal.querySelector('#inputVolumeSlider');
        const outputVolumeSlider = modal.querySelector('#outputVolumeSlider');
        
        if (inputVolumeSlider) {
            inputVolumeSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                const valueDisplay = e.target.parentNode.querySelector('.volume-value');
                if (valueDisplay) {
                    valueDisplay.textContent = value + '%';
                }
                this.updateVolumeIndicator('inputVolumeIndicator', value);
            });
        }
        
        if (outputVolumeSlider) {
            outputVolumeSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                const valueDisplay = e.target.parentNode.querySelector('.volume-value');
                if (valueDisplay) {
                    valueDisplay.textContent = value + '%';
                }
                this.updateVolumeIndicator('outputVolumeIndicator', value);
            });
        }
    }

    updateVolumeIndicator(indicatorId, value) {
        const indicator = document.getElementById(indicatorId);
        if (indicator) {
            const bar = indicator.querySelector('.volume-bar');
            if (bar) {
                bar.style.width = value + '%';
            }
        }
    }

    bindChannelManagementEvents(modal) {
        const channelFilter = modal.querySelector('.channel-filter');
        const channelSearch = modal.querySelector('.channel-search');
        
        channelFilter.addEventListener('change', () => {
            this.filterChannels(channelFilter.value);
        });
        
        channelSearch.addEventListener('input', () => {
            this.searchChannels(channelSearch.value);
        });

        // Channel actions
        modal.addEventListener('click', (e) => {
            if (e.target.matches('.edit-channel')) {
                this.editChannel(e.target.dataset.channelId);
            }
            
            if (e.target.matches('.delete-channel')) {
                this.deleteChannel(e.target.dataset.channelId);
            }
        });
    }

    bindMemberManagementEvents(modal) {
        const memberFilter = modal.querySelector('.member-filter');
        const memberSearch = modal.querySelector('.member-search');
        
        memberFilter.addEventListener('change', () => {
            this.filterMembers(memberFilter.value);
        });
        
        memberSearch.addEventListener('input', () => {
            this.searchMembers(memberSearch.value);
        });

        // Member actions
        modal.addEventListener('click', (e) => {
            if (e.target.matches('.promote-member')) {
                this.promoteMember(e.target.dataset.memberId);
            }
            
            if (e.target.matches('.demote-member')) {
                this.demoteMember(e.target.dataset.memberId);
            }
            
            if (e.target.matches('.kick-member')) {
                this.kickMember(e.target.dataset.memberId);
            }
            
            if (e.target.matches('.transfer-ownership')) {
                this.transferOwnership(e.target.dataset.memberId);
            }
        });
    }

    initializeImageCutters() {
        // Initialize Cropper.js for image cutting
        const imageInputs = document.querySelectorAll('.image-upload-input');
        
        imageInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleImageUpload(e.target);
            });
        });
    }

    // Modal Management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Load modal data if needed
            this.loadModalData(modalId);
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            
            // Cleanup cropper if exists
            if (this.currentCropper) {
                this.currentCropper.destroy();
                this.currentCropper = null;
            }
            
            // Reset forms
            const forms = modal.querySelectorAll('form');
            forms.forEach(form => form.reset());
        }
    }

    loadModalData(modalId) {
        switch (modalId) {
            case 'userSettingsModal':
                this.loadUserSettings();
                break;
            case 'serverSettingsModal':
                this.loadServerSettings();
                break;
            case 'invitePeopleModal':
                this.loadInvites();
                break;
        }
    }

    // Create Server Modal
    async handleCreateServer(form) {
        const formData = new FormData(form);
        formData.append('action', 'createServer');
        
        try {
            const response = await fetch('/user/user-server/api/servers.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                serverApp.showToast('Server created successfully!', 'success');
                this.closeModal(form.closest('.modal'));
                serverApp.loadUserServers();
                form.reset();
                // Reset image previews
                this.resetImagePreviews();
            } else {
                serverApp.showToast(data.error || 'Failed to create server', 'error');
            }
        } catch (error) {
            console.error('Error creating server:', error);
            serverApp.showToast('Failed to create server', 'error');
        }
    }
    
    resetImagePreviews() {
        const iconPreview = document.getElementById('serverIconPreview');
        const bannerPreview = document.getElementById('serverBannerPreview');
        
        if (iconPreview) {
            iconPreview.innerHTML = `
                <i class="fas fa-camera"></i>
                <span>Upload Icon</span>
            `;
        }
        
        if (bannerPreview) {
            bannerPreview.innerHTML = `
                <i class="fas fa-image"></i>
                <span>Upload Banner</span>
            `;
        }
    }

    validateServerName(input) {
        const value = input.value.trim();
        const feedback = input.parentNode.querySelector('.validation-feedback');
        
        if (value.length < 2) {
            feedback.textContent = 'Server name must be at least 2 characters';
            feedback.style.color = '#ed4245';
        } else if (value.length > 100) {
            feedback.textContent = 'Server name must be less than 100 characters';
            feedback.style.color = '#ed4245';
        } else {
            feedback.textContent = 'Looks good!';
            feedback.style.color = '#57f287';
        }
    }

    // User Settings Modal
    async loadUserSettings() {
        try {
            const response = await fetch('/user/user-server/api/user.php?action=getCurrentUser');
            const data = await response.json();
            
            if (data.success) {
                this.populateUserSettings(data.user);
            }
        } catch (error) {
            console.error('Error loading user settings:', error);
        }
    }

    populateUserSettings(user) {
        const modal = document.getElementById('userSettingsModal');
        
        // Populate form fields
        modal.querySelector('#username').value = user.Username || '';
        modal.querySelector('#displayName').value = user.DisplayName || '';
        modal.querySelector('#aboutMe').value = user.Bio || '';
        modal.querySelector('.masked-email').textContent = user.MaskedEmail || '';
        
        // Update avatar and banner previews
        if (user.ProfilePictureUrl) {
            modal.querySelector('.avatar-preview').src = user.ProfilePictureUrl;
        }
        
        if (user.BannerProfile) {
            modal.querySelector('.banner-preview').src = user.BannerProfile;
        }
    }

    switchSettingsTab(targetTab, tabs, contents) {
        tabs.forEach(tab => tab.classList.remove('active'));
        contents.forEach(content => content.classList.remove('active'));
        
        const activeTab = document.querySelector(`[data-tab="${targetTab}"]`);
        const activeContent = document.getElementById(targetTab);
        
        if (activeTab && activeContent) {
            activeTab.classList.add('active');
            activeContent.classList.add('active');
        }
    }

    async handleProfileUpdate(form) {
        const formData = new FormData(form);
        
        try {
            const response = await fetch('/user/user-server/api/user.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                serverApp.showToast('Profile updated successfully!', 'success');
                serverApp.loadCurrentUser();
            } else {
                serverApp.showToast(data.error || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            serverApp.showToast('Failed to update profile', 'error');
        }
    }

    async handlePasswordChange(form) {
        const formData = new FormData(form);
        formData.append('action', 'changePassword');
        
        try {
            const response = await fetch('/user/user-server/api/user.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                serverApp.showToast('Password changed successfully!', 'success');
                form.reset();
            } else {
                serverApp.showToast(data.error || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            serverApp.showToast('Failed to change password', 'error');
        }
    }

    toggleEmailReveal(toggle) {
        const emailElement = toggle.previousElementSibling;
        const isRevealed = toggle.dataset.revealed === 'true';
        
        if (isRevealed) {
            // Hide email
            emailElement.textContent = emailElement.dataset.masked;
            toggle.textContent = 'Reveal';
            toggle.dataset.revealed = 'false';
        } else {
            // Show email
            emailElement.textContent = emailElement.dataset.full;
            toggle.textContent = 'Hide';
            toggle.dataset.revealed = 'true';
        }
    }

    // Image Upload and Cropping
    handleImageUpload(input) {
        const file = input.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.initializeCropper(e.target.result, input.dataset.type);
        };
        reader.readAsDataURL(file);
    }

    initializeCropper(imageSrc, type) {
        const cropperModal = document.getElementById('cropperModal');
        const cropperImage = cropperModal.querySelector('#cropperImage');
        
        cropperImage.src = imageSrc;
        this.openModal('cropperModal');
        
        // Destroy existing cropper
        if (this.currentCropper) {
            this.currentCropper.destroy();
        }
        
        // Initialize new cropper
        const aspectRatio = type === 'banner' ? 16/9 : 1;
        
        this.currentCropper = new Cropper(cropperImage, {
            aspectRatio: aspectRatio,
            viewMode: 1,
            autoCropArea: 0.8,
            responsive: true,
            restore: false,
            guides: false,
            center: false,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false
        });
        
        // Bind cropper buttons
        const saveBtn = cropperModal.querySelector('.save-crop');
        const cancelBtn = cropperModal.querySelector('.cancel-crop');
        
        saveBtn.onclick = () => this.saveCroppedImage(type);
        cancelBtn.onclick = () => this.closeModal(cropperModal);
    }

    async saveCroppedImage(type) {
        if (!this.currentCropper) return;
        
        const canvas = this.currentCropper.getCroppedCanvas({
            width: type === 'banner' ? 1920 : 512,
            height: type === 'banner' ? 480 : 512
        });
        
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('file', blob, `${type}.png`);
            formData.append('type', type);
            
            try {
                const response = await fetch('/user/user-server/api/upload.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Update preview
                    this.updateImagePreview(type, data.url);
                    
                    // Save to profile
                    await this.saveImageToProfile(type, data.url);
                    
                    serverApp.showToast('Image updated successfully!', 'success');
                    this.closeModal(document.getElementById('cropperModal'));
                } else {
                    serverApp.showToast(data.error || 'Failed to upload image', 'error');
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                serverApp.showToast('Failed to upload image', 'error');
            }
        });
    }

    updateImagePreview(type, url) {
        const preview = document.querySelector(`.${type}-preview`);
        if (preview) {
            preview.src = url;
        }
    }

    async saveImageToProfile(type, url) {
        const formData = new FormData();
        formData.append('action', type === 'avatar' ? 'updateAvatar' : 'updateBanner');
        formData.append(type === 'avatar' ? 'avatarUrl' : 'bannerUrl', url);
        
        await fetch('/user/user-server/api/user.php', {
            method: 'POST',
            body: formData
        });
    }

    // Channel Management
    formatChannelName(input) {
        let value = input.value.toLowerCase();
        value = value.replace(/\s+/g, '-');
        value = value.replace(/[^a-z0-9\-_]/g, '');
        input.value = value;
    }

    async handleCreateChannel(form) {
        const formData = new FormData(form);
        formData.append('action', 'createChannel');
        formData.append('serverId', serverApp.currentServerId);
        
        try {
            const response = await fetch('/user/user-server/api/channels.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                serverApp.showToast('Channel created successfully!', 'success');
                this.closeModal(form.closest('.modal'));
                serverApp.loadChannels(serverApp.currentServerId);
            } else {
                serverApp.showToast(data.error || 'Failed to create channel', 'error');
            }
        } catch (error) {
            console.error('Error creating channel:', error);
            serverApp.showToast('Failed to create channel', 'error');
        }
    }

    // Device Testing
    async testMicrophone() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            
            microphone.connect(analyser);
            analyser.fftSize = 256;
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            const volumeBar = document.querySelector('.volume-bar-fill');
            
            const updateVolume = () => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((sum, value) => sum + value) / bufferLength;
                const percentage = (average / 255) * 100;
                
                volumeBar.style.width = `${percentage}%`;
                
                if (stream.active) {
                    requestAnimationFrame(updateVolume);
                }
            };
            
            updateVolume();
            
            // Stop after 5 seconds
            setTimeout(() => {
                stream.getTracks().forEach(track => track.stop());
                volumeBar.style.width = '0%';
            }, 5000);
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            serverApp.showToast('Failed to access microphone', 'error');
        }
    }

    async testCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const videoPreview = document.querySelector('.camera-preview');
            
            videoPreview.srcObject = stream;
            videoPreview.style.display = 'block';
            
            // Stop after 10 seconds
            setTimeout(() => {
                stream.getTracks().forEach(track => track.stop());
                videoPreview.style.display = 'none';
            }, 10000);
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            serverApp.showToast('Failed to access camera', 'error');
        }
    }

    updateVolumeDisplay(slider) {
        const display = slider.parentNode.querySelector('.volume-display');
        if (display) {
            display.textContent = `${slider.value}%`;
        }
    }

    // Invite Management
    async loadInvites() {
        if (!serverApp.currentServerId) return;
        
        try {
            const response = await fetch(`/user/user-server/api/invites.php?action=getInvites&serverId=${serverApp.currentServerId}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderInvites(data.invites);
            }
        } catch (error) {
            console.error('Error loading invites:', error);
        }
    }

    renderInvites(invites) {
        const container = document.querySelector('.invites-list');
        
        if (invites.length === 0) {
            container.innerHTML = '<div class="no-invites">No active invites</div>';
            return;
        }
        
        container.innerHTML = invites.map(invite => `
            <div class="invite-item">
                <div class="invite-info">
                    <div class="invite-code">${invite.InviteLink}</div>
                    <div class="invite-details">
                        Created by ${invite.CreatedByUsername} • 
                        ${invite.Uses || 0} uses
                        ${invite.ExpiresAt ? `• Expires ${new Date(invite.ExpiresAt).toLocaleDateString()}` : '• Never expires'}
                    </div>
                </div>
                <div class="invite-actions">
                    <button class="btn-secondary copy-invite" data-code="${invite.InviteLink}">Copy</button>
                    <button class="btn-danger delete-invite" data-invite-id="${invite.ID}">Delete</button>
                </div>
            </div>
        `).join('');
    }

    async generateInvite() {
        const formData = new FormData();
        formData.append('action', 'createInvite');
        formData.append('serverId', serverApp.currentServerId);
        
        try {
            const response = await fetch('/user/user-server/api/invites.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                serverApp.showToast('Invite created successfully!', 'success');
                this.loadInvites();
            } else {
                serverApp.showToast(data.error || 'Failed to create invite', 'error');
            }
        } catch (error) {
            console.error('Error creating invite:', error);
            serverApp.showToast('Failed to create invite', 'error');
        }
    }

    copyInviteLink(button) {
        const code = button.dataset.code;
        const fullLink = `${window.location.origin}/user/user-server/invite.php?code=${code}`;
        
        navigator.clipboard.writeText(fullLink).then(() => {
            serverApp.showToast('Invite link copied!', 'success');
        }).catch(() => {
            serverApp.showToast('Failed to copy invite link', 'error');
        });
    }

    async deleteInvite(inviteId) {
        const formData = new FormData();
        formData.append('action', 'deleteInvite');
        formData.append('inviteId', inviteId);
        
        try {
            const response = await fetch('/user/user-server/api/invites.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                serverApp.showToast('Invite deleted successfully!', 'success');
                this.loadInvites();
            } else {
                serverApp.showToast(data.error || 'Failed to delete invite', 'error');
            }
        } catch (error) {
            console.error('Error deleting invite:', error);
            serverApp.showToast('Failed to delete invite', 'error');
        }
    }

    async inviteTitibot() {
        const formData = new FormData();
        formData.append('action', 'inviteTitibot');
        formData.append('serverId', serverApp.currentServerId);
        
        try {
            const response = await fetch('/user/user-server/api/invites.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                serverApp.showToast('Titibot invited successfully!', 'success');
                serverApp.loadMembers(serverApp.currentServerId);
            } else {
                serverApp.showToast(data.error || 'Failed to invite Titibot', 'error');
            }
        } catch (error) {
            console.error('Error inviting Titibot:', error);
            serverApp.showToast('Failed to invite Titibot', 'error');
        }
    }

    // User Settings Functions
    switchUserSettingsTab(tabName) {
        const modal = document.getElementById('userSettingsModal');
        const navItems = modal.querySelectorAll('.settings-nav-item');
        const tabs = modal.querySelectorAll('.settings-tab');

        // Update navigation
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabName);
        });

        // Update tab content
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.id === tabName + 'Tab');
        });

        // Load tab-specific data
        if (tabName === 'my-account') {
            this.loadUserAccountData();
        } else if (tabName === 'voice-video') {
            this.loadVoiceVideoSettings();
        } else if (tabName === 'delete-account') {
            this.checkOwnedServers();
        }
    }

    bindFieldChangeDetection() {
        const modal = document.getElementById('userSettingsModal');
        
        // Username field
        const usernameField = modal.querySelector('#usernameField');
        if (usernameField) {
            usernameField.addEventListener('input', () => {
                this.showSaveButton('saveUsernameBtn');
            });
        }

        // Display name field
        const displayNameField = modal.querySelector('#displayNameField');
        if (displayNameField) {
            displayNameField.addEventListener('input', () => {
                this.showSaveButton('saveDisplayNameBtn');
            });
        }
    }

    bindImageUploadHandlers() {
        const modal = document.getElementById('userSettingsModal');
        
        // Avatar upload
        const avatarInput = modal.querySelector('#avatarInput');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => {
                this.handleAvatarUpload(e.target);
            });
        }

        // Banner upload
        const bannerInput = modal.querySelector('#bannerInput');
        if (bannerInput) {
            bannerInput.addEventListener('change', (e) => {
                this.handleBannerUpload(e.target);
            });
        }
    }

    showSaveButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.remove('hidden');
        }
    }

    hideSaveButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.add('hidden');
        }
    }

    updateCharacterCount(field, counterId) {
        const counter = document.getElementById(counterId);
        if (counter) {
            counter.textContent = field.value.length;
        }
    }

    async loadUserAccountData() {
        try {
            const response = await fetch('/user/user-server/api/user.php?action=getCurrentUser');
            const data = await response.json();
            
            if (data.success) {
                const user = data.user;
                
                // Update form fields
                document.getElementById('usernameField').value = user.Username || '';
                document.getElementById('displayNameField').value = user.DisplayName || '';
                document.getElementById('aboutMeField').value = user.Bio || '';
                document.getElementById('userTag').textContent = '#' + (user.Discriminator || '0000');
                document.getElementById('emailMasked').textContent = user.MaskedEmail || '';
                
                // Update preview
                document.getElementById('accountDisplayName').textContent = user.DisplayName || user.Username;
                document.getElementById('accountUsername').textContent = user.Username + '#' + (user.Discriminator || '0000');
                
                // Update character count
                this.updateCharacterCount(document.getElementById('aboutMeField'), 'aboutMeCount');
                
                // Update avatar and banner
                if (user.ProfilePictureUrl) {
                    document.getElementById('userAvatarPreview').style.backgroundImage = `url(${user.ProfilePictureUrl})`;
                }
                if (user.BannerProfile) {
                    document.getElementById('userBannerPreview').style.backgroundImage = `url(${user.BannerProfile})`;
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            serverApp.showToast('Failed to load user data', 'error');
        }
    }

    async toggleEmailReveal() {
        const emailMasked = document.getElementById('emailMasked');
        const revealBtn = document.getElementById('revealEmailBtn');
        
        if (revealBtn.textContent === 'Reveal') {
            try {
                const response = await fetch('/user/user-server/api/user.php?action=getCurrentUser');
                const data = await response.json();
                
                if (data.success) {
                    emailMasked.textContent = data.user.Email;
                    revealBtn.textContent = 'Hide';
                }
            } catch (error) {
                console.error('Error revealing email:', error);
                serverApp.showToast('Failed to reveal email', 'error');
            }
        } else {
            try {
                const response = await fetch('/user/user-server/api/user.php?action=getCurrentUser');
                const data = await response.json();
                
                if (data.success) {
                    emailMasked.textContent = data.user.MaskedEmail;
                    revealBtn.textContent = 'Reveal';
                }
            } catch (error) {
                console.error('Error hiding email:', error);
            }
        }
    }

    handleAvatarUpload(input) {
        const file = input.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            serverApp.showToast('Please select a valid image file', 'error');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('avatarCropperImage');
            img.src = e.target.result;
            this.openAvatarCropper();
        };
        reader.readAsDataURL(file);
    }

    handleBannerUpload(input) {
        const file = input.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            serverApp.showToast('Please select a valid image file', 'error');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('bannerCropperImage');
            img.src = e.target.result;
            this.openBannerCropper();
        };
        reader.readAsDataURL(file);
    }

    openAvatarCropper() {
        const modal = document.getElementById('avatarCropperModal');
        modal.classList.remove('hidden');
        
        const img = document.getElementById('avatarCropperImage');
        this.currentCropper = new Cropper(img, {
            aspectRatio: 1,
            viewMode: 1,
            minCropBoxWidth: 100,
            minCropBoxHeight: 100
        });
    }

    closeAvatarCropper() {
        const modal = document.getElementById('avatarCropperModal');
        modal.classList.add('hidden');
        
        if (this.currentCropper) {
            this.currentCropper.destroy();
            this.currentCropper = null;
        }
        
        // Reset file input
        document.getElementById('avatarInput').value = '';
    }

    openBannerCropper() {
        const modal = document.getElementById('bannerCropperModal');
        modal.classList.remove('hidden');
        
        const img = document.getElementById('bannerCropperImage');
        this.currentCropper = new Cropper(img, {
            aspectRatio: 960/240,
            viewMode: 1,
            minCropBoxWidth: 300,
            minCropBoxHeight: 75
        });
    }

    closeBannerCropper() {
        const modal = document.getElementById('bannerCropperModal');
        modal.classList.add('hidden');
        
        if (this.currentCropper) {
            this.currentCropper.destroy();
            this.currentCropper = null;
        }
        
        // Reset file input
        document.getElementById('bannerInput').value = '';
    }

    async cropAndSaveAvatar() {
        if (!this.currentCropper) return;

        const canvas = this.currentCropper.getCroppedCanvas({
            width: 512,
            height: 512,
            imageSmoothingQuality: 'high'
        });

        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('action', 'updateAvatar');
            formData.append('avatar', blob, 'avatar.png');

            try {
                const response = await fetch('/user/user-server/api/user.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                if (data.success) {
                    serverApp.showToast('Avatar updated successfully', 'success');
                    this.closeAvatarCropper();
                    this.loadUserAccountData(); // Refresh data
                } else {
                    serverApp.showToast(data.error || 'Failed to update avatar', 'error');
                }
            } catch (error) {
                console.error('Error updating avatar:', error);
                serverApp.showToast('Failed to update avatar', 'error');
            }
        }, 'image/png', 0.9);
    }

    async cropAndSaveBanner() {
        if (!this.currentCropper) return;

        const canvas = this.currentCropper.getCroppedCanvas({
            width: 960,
            height: 240,
            imageSmoothingQuality: 'high'
        });

        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('action', 'updateBanner');
            formData.append('banner', blob, 'banner.png');

            try {
                const response = await fetch('/user/user-server/api/user.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                if (data.success) {
                    serverApp.showToast('Banner updated successfully', 'success');
                    this.closeBannerCropper();
                    this.loadUserAccountData(); // Refresh data
                } else {
                    serverApp.showToast(data.error || 'Failed to update banner', 'error');
                }
            } catch (error) {
                console.error('Error updating banner:', error);
                serverApp.showToast('Failed to update banner', 'error');
            }
        }, 'image/png', 0.9);
    }

    switchVoiceVideoTab(subtab) {
        const modal = document.getElementById('userSettingsModal');
        const tabs = modal.querySelectorAll('.tab-btn');
        const subtabs = modal.querySelectorAll('.settings-subtab');

        // Update tab buttons
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.subtab === subtab);
        });

        // Update subtab content
        subtabs.forEach(tab => {
            tab.classList.toggle('active', tab.id === subtab + 'Settings');
        });
    }

    async loadVoiceVideoSettings() {
        try {
            // Get available devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            // Populate input devices
            const inputSelect = document.getElementById('inputDeviceSelect');
            const outputSelect = document.getElementById('outputDeviceSelect');
            const cameraSelect = document.getElementById('cameraDeviceSelect');
            
            if (inputSelect) {
                inputSelect.innerHTML = '';
                devices.filter(device => device.kind === 'audioinput').forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.textContent = device.label || `Microphone ${inputSelect.options.length + 1}`;
                    inputSelect.appendChild(option);
                });
            }
            
            if (outputSelect) {
                outputSelect.innerHTML = '';
                devices.filter(device => device.kind === 'audiooutput').forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.textContent = device.label || `Speaker ${outputSelect.options.length + 1}`;
                    outputSelect.appendChild(option);
                });
            }
            
            if (cameraSelect) {
                cameraSelect.innerHTML = '';
                devices.filter(device => device.kind === 'videoinput').forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.textContent = device.label || `Camera ${cameraSelect.options.length + 1}`;
                    cameraSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading devices:', error);
            serverApp.showToast('Failed to load audio/video devices', 'error');
        }
    }

    async checkOwnedServers() {
        try {
            const response = await fetch('/user/user-server/api/user.php?action=checkOwnedServers');
            const data = await response.json();
            
            const warning = document.getElementById('serverOwnershipWarning');
            const deleteBtn = document.getElementById('deleteAccountBtn');
            
            if (data.hasOwnedServers) {
                warning.classList.remove('hidden');
                deleteBtn.disabled = true;
                
                const serversList = document.getElementById('ownedServersList');
                serversList.innerHTML = data.servers.map(server => 
                    `<div class="owned-server">
                        <strong>${server.Name}</strong> - Transfer ownership first
                    </div>`
                ).join('');
            } else {
                warning.classList.add('hidden');
                deleteBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error checking owned servers:', error);
        }
    }
}

// Initialize modal manager
const modalManager = new ModalManager();

// Export for global access
window.modalManager = modalManager;

// Global functions for HTML onclick handlers
function editAvatar() {
    document.getElementById('avatarInput').click();
}

function editBanner() {
    document.getElementById('bannerInput').click();
}

function closeAvatarCropper() {
    modalManager.closeAvatarCropper();
}

function closeBannerCropper() {
    modalManager.closeBannerCropper();
}

function cropAndSaveAvatar() {
    modalManager.cropAndSaveAvatar();
}

function cropAndSaveBanner() {
    modalManager.cropAndSaveBanner();
}

async function saveUsername() {
    const username = document.getElementById('usernameField').value.trim();
    if (!username) {
        serverApp.showToast('Username cannot be empty', 'error');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('action', 'updateProfile');
        formData.append('field', 'Username');
        formData.append('value', username);

        const response = await fetch('/user/user-server/api/user.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            serverApp.showToast('Username updated successfully', 'success');
            modalManager.hideSaveButton('saveUsernameBtn');
            modalManager.loadUserAccountData(); // Refresh data
        } else {
            serverApp.showToast(data.error || 'Failed to update username', 'error');
        }
    } catch (error) {
        console.error('Error updating username:', error);
        serverApp.showToast('Failed to update username', 'error');
    }
}

async function saveDisplayName() {
    const displayName = document.getElementById('displayNameField').value.trim();

    try {
        const formData = new FormData();
        formData.append('action', 'updateProfile');
        formData.append('field', 'DisplayName');
        formData.append('value', displayName);

        const response = await fetch('/user/user-server/api/user.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            serverApp.showToast('Display name updated successfully', 'success');
            modalManager.hideSaveButton('saveDisplayNameBtn');
            modalManager.loadUserAccountData(); // Refresh data
        } else {
            serverApp.showToast(data.error || 'Failed to update display name', 'error');
        }
    } catch (error) {
        console.error('Error updating display name:', error);
        serverApp.showToast('Failed to update display name', 'error');
    }
}

async function saveAboutMe() {
    const aboutMe = document.getElementById('aboutMeField').value.trim();

    try {
        const formData = new FormData();
        formData.append('action', 'updateProfile');
        formData.append('field', 'Bio');
        formData.append('value', aboutMe);

        const response = await fetch('/user/user-server/api/user.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            serverApp.showToast('About me updated successfully', 'success');
            modalManager.hideSaveButton('saveAboutMeBtn');
        } else {
            serverApp.showToast(data.error || 'Failed to update about me', 'error');
        }
    } catch (error) {
        console.error('Error updating about me:', error);
        serverApp.showToast('Failed to update about me', 'error');
    }
}

function resetAccountForm() {
    modalManager.loadUserAccountData();
    modalManager.hideSaveButton('saveUsernameBtn');
    modalManager.hideSaveButton('saveDisplayNameBtn');
    modalManager.hideSaveButton('saveAboutMeBtn');
}

function openPasswordChangeModal() {
    document.getElementById('passwordChangeModal').classList.remove('hidden');
    loadSecurityQuestion();
}

function closePasswordChangeModal() {
    document.getElementById('passwordChangeModal').classList.add('hidden');
    // Reset form
    document.getElementById('securityAnswerInput').value = '';
    document.getElementById('newPasswordInput').value = '';
    document.getElementById('confirmPasswordInput').value = '';
    // Show security step
    document.getElementById('securityStep').classList.add('active');
    document.getElementById('passwordStep').classList.remove('active');
}

async function loadSecurityQuestion() {
    try {
        const response = await fetch('/user/user-server/api/user.php?action=getCurrentUser');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('securityQuestionLabel').textContent = 
                data.user.SecurityQuestion || 'What is your favorite color?';
        }
    } catch (error) {
        console.error('Error loading security question:', error);
    }
}

async function verifySecurityAnswer() {
    const answer = document.getElementById('securityAnswerInput').value.trim();
    if (!answer) {
        serverApp.showToast('Please enter your security answer', 'error');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('action', 'verifySecurityQuestion');
        formData.append('answer', answer);

        const response = await fetch('/user/user-server/api/user.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById('securityStep').classList.remove('active');
            document.getElementById('passwordStep').classList.add('active');
        } else {
            serverApp.showToast(data.error || 'Incorrect security answer', 'error');
        }
    } catch (error) {
        console.error('Error verifying security answer:', error);
        serverApp.showToast('Failed to verify security answer', 'error');
    }
}

async function changePassword() {
    const newPassword = document.getElementById('newPasswordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;

    if (!newPassword || !confirmPassword) {
        serverApp.showToast('Please fill in both password fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        serverApp.showToast('Passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 6) {
        serverApp.showToast('Password must be at least 6 characters long', 'error');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('action', 'changePassword');
        formData.append('newPassword', newPassword);

        const response = await fetch('/user/user-server/api/user.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            serverApp.showToast('Password changed successfully', 'success');
            closePasswordChangeModal();
        } else {
            serverApp.showToast(data.error || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        serverApp.showToast('Failed to change password', 'error');
    }
}

async function initiateAccountDeletion() {
    if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch('/user/user-server/api/user.php?action=checkOwnedServers');
        const data = await response.json();
        
        if (data.hasOwnedServers) {
            serverApp.showToast('You must transfer ownership of all servers before deleting your account', 'error');
            return;
        }

        // Proceed with deletion
        const deleteResponse = await fetch('/user/user-server/api/user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=deleteAccount'
        });

        const deleteData = await deleteResponse.json();
        if (deleteData.success) {
            serverApp.showToast('Account deleted successfully', 'success');
            setTimeout(() => {
                window.location.href = '/auth/login.php';
            }, 2000);
        } else {
            serverApp.showToast(deleteData.error || 'Failed to delete account', 'error');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        serverApp.showToast('Failed to delete account', 'error');
    }
}

// Voice & Video functions
let micTestStream = null;
let micTestAnalyzer = null;
let micTestAnimationId = null;

async function startMicTest() {
    const testBtn = document.getElementById('micTestBtn');
    const indicator = document.getElementById('micTestIndicator');
    
    if (micTestStream) {
        stopMicTest();
        return;
    }

    try {
        micTestStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(micTestStream);
        micTestAnalyzer = audioContext.createAnalyser();
        
        source.connect(micTestAnalyzer);
        micTestAnalyzer.fftSize = 256;
        
        const bufferLength = micTestAnalyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        indicator.classList.remove('hidden');
        testBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Test';
        
        function updateBars() {
            micTestAnalyzer.getByteFrequencyData(dataArray);
            
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            const percentage = (average / 255) * 100;
            
            const bars = indicator.querySelectorAll('.test-bar');
            bars.forEach((bar, index) => {
                const threshold = (index + 1) * 20;
                bar.classList.toggle('active', percentage > threshold);
            });
            
            micTestAnimationId = requestAnimationFrame(updateBars);
        }
        
        updateBars();
    } catch (error) {
        console.error('Error accessing microphone:', error);
        serverApp.showToast('Failed to access microphone', 'error');
    }
}

function stopMicTest() {
    const testBtn = document.getElementById('micTestBtn');
    const indicator = document.getElementById('micTestIndicator');
    
    if (micTestStream) {
        micTestStream.getTracks().forEach(track => track.stop());
        micTestStream = null;
    }
    
    if (micTestAnimationId) {
        cancelAnimationFrame(micTestAnimationId);
        micTestAnimationId = null;
    }
    
    indicator.classList.add('hidden');
    testBtn.innerHTML = '<i class="fas fa-play"></i> Start Test';
}

let cameraTestStream = null;

async function testCamera() {
    const testBtn = document.getElementById('testCameraBtn');
    const video = document.getElementById('cameraVideo');
    const preview = document.getElementById('cameraPreview');
    
    if (cameraTestStream) {
        stopCamera();
        return;
    }

    try {
        const deviceSelect = document.getElementById('cameraDeviceSelect');
        const deviceId = deviceSelect ? deviceSelect.value : undefined;
        
        cameraTestStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: deviceId ? { exact: deviceId } : undefined }
        });
        
        video.srcObject = cameraTestStream;
        preview.classList.add('active');
        testBtn.textContent = 'Stop Camera';
    } catch (error) {
        console.error('Error accessing camera:', error);
        serverApp.showToast('Failed to access camera', 'error');
    }
}

function stopCamera() {
    const testBtn = document.getElementById('testCameraBtn');
    const video = document.getElementById('cameraVideo');
    const preview = document.getElementById('cameraPreview');
    
    if (cameraTestStream) {
        cameraTestStream.getTracks().forEach(track => track.stop());
        cameraTestStream = null;
    }
    
    video.srcObject = null;
    preview.classList.remove('active');
    testBtn.textContent = 'Test Camera';
}

// Invite People Functions
function openInvitePeopleModal() {
    const modal = document.getElementById('invitePeopleModal');
    modal.classList.remove('hidden');
    generateInviteLink();
    loadRecentInvites();
}

function closeInvitePeopleModal() {
    const modal = document.getElementById('invitePeopleModal');
    modal.classList.add('hidden');
}

async function generateInviteLink() {
    const serverId = serverApp.currentServerId;
    if (!serverId) return;

    try {
        const expiration = document.getElementById('inviteExpiration').value;
        
        const formData = new FormData();
        formData.append('action', 'createInvite');
        formData.append('serverId', serverId);
        formData.append('expiresIn', expiration);

        const response = await fetch('/user/user-server/api/invites.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            const inviteLink = window.location.origin + '/invite/' + data.invite.InviteLink;
            document.getElementById('inviteLinkText').textContent = inviteLink;
            serverApp.showToast('Invite link generated', 'success');
        } else {
            serverApp.showToast(data.error || 'Failed to generate invite', 'error');
        }
    } catch (error) {
        console.error('Error generating invite:', error);
        serverApp.showToast('Failed to generate invite', 'error');
    }
}

function copyInviteLink() {
    const linkText = document.getElementById('inviteLinkText').textContent;
    if (linkText && linkText !== 'Generating...') {
        navigator.clipboard.writeText(linkText).then(() => {
            serverApp.showToast('Invite link copied to clipboard', 'success');
            
            // Update button icon temporarily
            const copyBtn = document.getElementById('copyInviteBtn');
            const icon = copyBtn.querySelector('i');
            const originalClass = icon.className;
            icon.className = 'fas fa-check';
            
            setTimeout(() => {
                icon.className = originalClass;
            }, 2000);
        }).catch(err => {
            console.error('Error copying to clipboard:', err);
            serverApp.showToast('Failed to copy invite link', 'error');
        });
    }
}

function regenerateInviteLink() {
    generateInviteLink();
}

async function inviteTitibot() {
    const serverId = serverApp.currentServerId;
    if (!serverId) return;

    const btn = document.getElementById('inviteTitibotBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('action', 'inviteTitibot');
        formData.append('serverId', serverId);

        const response = await fetch('/user/user-server/api/invites.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            serverApp.showToast('Titibot has been added to your server!', 'success');
            btn.innerHTML = '<i class="fas fa-check"></i> Added';
            
            // Refresh server members if needed
            if (typeof serverApp.loadServerMembers === 'function') {
                serverApp.loadServerMembers();
            }
        } else {
            serverApp.showToast(data.error || 'Failed to invite Titibot', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error inviting Titibot:', error);
        serverApp.showToast('Failed to invite Titibot', 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function loadRecentInvites() {
    const serverId = serverApp.currentServerId;
    if (!serverId) return;

    try {
        const response = await fetch(`/user/user-server/api/invites.php?action=getInvites&serverId=${serverId}`);
        const data = await response.json();
        
        const invitesList = document.getElementById('recentInvitesList');
        
        if (data.success && data.invites.length > 0) {
            invitesList.innerHTML = data.invites.map(invite => `
                <div class="recent-invite">
                    <div class="invite-info">
                        <div class="invite-code">${invite.InviteLink}</div>
                        <div class="invite-meta">
                            Created by ${invite.CreatedByUsername}
                            ${invite.ExpiresAt ? `• Expires ${new Date(invite.ExpiresAt).toLocaleDateString()}` : '• Never expires'}
                        </div>
                    </div>
                    <div class="invite-actions">
                        <button class="btn-icon" onclick="copyInviteCode('${invite.InviteLink}')" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn-icon" onclick="deleteInvite(${invite.ID})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            invitesList.innerHTML = '<div class="no-invites">No recent invites</div>';
        }
    } catch (error) {
        console.error('Error loading recent invites:', error);
    }
}

function copyInviteCode(code) {
    const inviteLink = window.location.origin + '/invite/' + code;
    navigator.clipboard.writeText(inviteLink).then(() => {
        serverApp.showToast('Invite link copied to clipboard', 'success');
    }).catch(err => {
        console.error('Error copying to clipboard:', err);
        serverApp.showToast('Failed to copy invite link', 'error');
    });
}

async function deleteInvite(inviteId) {
    if (!confirm('Are you sure you want to delete this invite?')) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('action', 'deleteInvite');
        formData.append('inviteId', inviteId);

        const response = await fetch('/user/user-server/api/invites.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            serverApp.showToast('Invite deleted successfully', 'success');
            loadRecentInvites(); // Refresh the list
        } else {
            serverApp.showToast(data.error || 'Failed to delete invite', 'error');
        }
    } catch (error) {
        console.error('Error deleting invite:', error);
        serverApp.showToast('Failed to delete invite', 'error');
    }
}

// Server Settings Functions
function openServerSettingsModal() {
    const modal = document.getElementById('serverSettingsModal');
    modal.classList.remove('hidden');
    loadServerSettingsData();
}

function closeServerSettingsModal() {
    const modal = document.getElementById('serverSettingsModal');
    modal.classList.add('hidden');
}

async function loadServerSettingsData() {
    const serverId = serverApp.currentServerId;
    if (!serverId) return;

    try {
        const response = await fetch(`/user/user-server/api/servers.php?action=getServer&serverId=${serverId}`);
        const data = await response.json();
        
        if (data.success) {
            const server = data.server;
            
            // Update form fields
            document.getElementById('serverNameSettings').value = server.Name || '';
            document.getElementById('serverDescriptionSettings').value = server.Description || '';
            document.getElementById('serverCategorySettings').value = server.Category || 'Other';
            document.getElementById('serverPublicSettingsToggle').checked = !server.IsPrivate;
            
            // Update preview
            document.getElementById('serverNamePreview').textContent = server.Name;
            document.getElementById('serverDescriptionPreview').textContent = server.Description || 'No description set';
            
            // Update character count
            modalManager.updateCharacterCount(document.getElementById('serverDescriptionSettings'), 'serverDescriptionCount');
            
            // Update images
            if (server.IconServer) {
                document.getElementById('serverIconSettingsPreview').style.backgroundImage = `url(${server.IconServer})`;
            }
            if (server.BannerServer) {
                document.getElementById('serverBannerSettingsPreview').style.backgroundImage = `url(${server.BannerServer})`;
            }
        }
    } catch (error) {
        console.error('Error loading server settings:', error);
        serverApp.showToast('Failed to load server settings', 'error');
    }
}

function editServerIcon() {
    document.getElementById('serverIconSettingsInput').click();
}

function editServerBanner() {
    document.getElementById('serverBannerSettingsInput').click();
}

async function saveServerName() {
    const serverId = serverApp.currentServerId;
    const name = document.getElementById('serverNameSettings').value.trim();
    
    if (!name) {
        serverApp.showToast('Server name cannot be empty', 'error');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('action', 'updateServer');
        formData.append('serverId', serverId);
        formData.append('field', 'Name');
        formData.append('value', name);

        const response = await fetch('/user/user-server/api/servers.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            serverApp.showToast('Server name updated successfully', 'success');
            document.getElementById('saveServerNameBtn').classList.add('hidden');
            document.getElementById('serverNamePreview').textContent = name;
            // Update main server name if needed
            if (typeof serverApp.updateServerName === 'function') {
                serverApp.updateServerName(name);
            }
        } else {
            serverApp.showToast(data.error || 'Failed to update server name', 'error');
        }
    } catch (error) {
        console.error('Error updating server name:', error);
        serverApp.showToast('Failed to update server name', 'error');
    }
}

async function saveServerDescription() {
    const serverId = serverApp.currentServerId;
    const description = document.getElementById('serverDescriptionSettings').value.trim();

    try {
        const formData = new FormData();
        formData.append('action', 'updateServer');
        formData.append('serverId', serverId);
        formData.append('field', 'Description');
        formData.append('value', description);

        const response = await fetch('/user/user-server/api/servers.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            serverApp.showToast('Server description updated successfully', 'success');
            document.getElementById('saveServerDescriptionBtn').classList.add('hidden');
            document.getElementById('serverDescriptionPreview').textContent = description || 'No description set';
        } else {
            serverApp.showToast(data.error || 'Failed to update server description', 'error');
        }
    } catch (error) {
        console.error('Error updating server description:', error);
        serverApp.showToast('Failed to update server description', 'error');
    }
}

async function saveServerCategory() {
    const serverId = serverApp.currentServerId;
    const category = document.getElementById('serverCategorySettings').value;

    try {
        const formData = new FormData();
        formData.append('action', 'updateServer');
        formData.append('serverId', serverId);
        formData.append('field', 'Category');
        formData.append('value', category);

        const response = await fetch('/user/user-server/api/servers.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            serverApp.showToast('Server category updated successfully', 'success');
            document.getElementById('saveServerCategoryBtn').classList.add('hidden');
        } else {
            serverApp.showToast(data.error || 'Failed to update server category', 'error');
        }
    } catch (error) {
        console.error('Error updating server category:', error);
        serverApp.showToast('Failed to update server category', 'error');
    }
}

// Channel Management Functions
async function loadChannelManagement() {
    const serverId = serverApp.currentServerId;
    if (!serverId) return;

    try {
        const response = await fetch(`/user/user-server/api/channels.php?action=getChannels&serverId=${serverId}`);
        const data = await response.json();
        
        if (data.success) {
            displayChannelsList(data.channels);
        }
    } catch (error) {
        console.error('Error loading channels:', error);
        serverApp.showToast('Failed to load channels', 'error');
    }
}

function displayChannelsList(channels) {
    const channelsList = document.getElementById('channelsManagementList');
    if (!channelsList) return;
    
    channelsList.innerHTML = channels.map(channel => `
        <div class="channel-item" data-channel-id="${channel.ID}">
            <div class="channel-info">
                <div class="channel-icon">
                    <i class="fas fa-${channel.Type === 'voice' ? 'volume-up' : 'hashtag'}"></i>
                </div>
                <div class="channel-details">
                    <div class="channel-name">${channel.Name}</div>
                    <div class="channel-type">${channel.Type.toUpperCase()}</div>
                </div>
            </div>
            <div class="channel-actions">
                <button class="btn-icon" onclick="editChannel(${channel.ID})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="deleteChannel(${channel.ID})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function filterChannels(type) {
    const channels = document.querySelectorAll('.channel-item');
    channels.forEach(channel => {
        const channelType = channel.querySelector('.channel-type').textContent.toLowerCase();
        if (type === 'all' || channelType === type) {
            channel.style.display = 'flex';
        } else {
            channel.style.display = 'none';
        }
    });
}

function searchChannels(query) {
    const channels = document.querySelectorAll('.channel-item');
    channels.forEach(channel => {
        const channelName = channel.querySelector('.channel-name').textContent.toLowerCase();
        if (channelName.includes(query.toLowerCase())) {
            channel.style.display = 'flex';
        } else {
            channel.style.display = 'none';
        }
    });
}

async function deleteChannel(channelId) {
    if (!confirm('Are you sure you want to delete this channel?')) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('action', 'deleteChannel');
        formData.append('channelId', channelId);

        const response = await fetch('/user/user-server/api/channels.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            serverApp.showToast('Channel deleted successfully', 'success');
            loadChannelManagement(); // Refresh the list
        } else {
            serverApp.showToast(data.error || 'Failed to delete channel', 'error');
        }
    } catch (error) {
        console.error('Error deleting channel:', error);
        serverApp.showToast('Failed to delete channel', 'error');
    }
}

// Member Management Functions
async function loadMemberManagement() {
    const serverId = serverApp.currentServerId;
    if (!serverId) return;

    try {
        const response = await fetch(`/user/user-server/api/members.php?action=getMembers&serverId=${serverId}`);
        const data = await response.json();
        
        if (data.success) {
            displayMembersList(data.members);
        }
    } catch (error) {
        console.error('Error loading members:', error);
        serverApp.showToast('Failed to load members', 'error');
    }
}

function displayMembersList(members) {
    const membersList = document.getElementById('membersManagementList');
    if (!membersList) return;
    
    membersList.innerHTML = members.map(member => `
        <div class="member-item" data-member-id="${member.ID}">
            <div class="member-info">
                <div class="member-avatar">
                    <img src="${member.ProfilePictureUrl || '/assets/images/default-avatar.png'}" alt="${member.Username}">
                </div>
                <div class="member-details">
                    <div class="member-name">${member.DisplayName || member.Username}</div>
                    <div class="member-username">${member.Username}#${member.Discriminator || '0000'}</div>
                </div>
                <div class="member-role ${member.Role.toLowerCase()}">${member.Role.toUpperCase()}</div>
            </div>
            <div class="member-actions">
                ${member.Role !== 'Owner' ? `
                    <button class="btn-icon" onclick="promoteDemoteMember(${member.ID}, '${member.Role}')" title="${member.Role === 'Admin' ? 'Demote' : 'Promote'}">
                        <i class="fas fa-${member.Role === 'Admin' ? 'arrow-down' : 'arrow-up'}"></i>
                    </button>
                    <button class="btn-icon" onclick="kickMember(${member.ID})" title="Kick">
                        <i class="fas fa-user-times"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function filterMembers(role) {
    const members = document.querySelectorAll('.member-item');
    members.forEach(member => {
        const memberRole = member.querySelector('.member-role').textContent.toLowerCase();
        if (role === 'all' || memberRole === role) {
            member.style.display = 'flex';
        } else {
            member.style.display = 'none';
        }
    });
}

function searchMembers(query) {
    const members = document.querySelectorAll('.member-item');
    members.forEach(member => {
        const memberName = member.querySelector('.member-name').textContent.toLowerCase();
        const memberUsername = member.querySelector('.member-username').textContent.toLowerCase();
        if (memberName.includes(query.toLowerCase()) || memberUsername.includes(query.toLowerCase())) {
            member.style.display = 'flex';
        } else {
            member.style.display = 'none';
        }
    });
}

async function promoteDemoteMember(memberId, currentRole) {
    const newRole = currentRole === 'Admin' ? 'Member' : 'Admin';
    const action = currentRole === 'Admin' ? 'demote' : 'promote';
    
    if (!confirm(`Are you sure you want to ${action} this member?`)) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('action', 'updateMemberRole');
        formData.append('serverId', serverApp.currentServerId);
        formData.append('memberId', memberId);
        formData.append('newRole', newRole);

        const response = await fetch('/user/user-server/api/members.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            serverApp.showToast(`Member ${action}d successfully`, 'success');
            loadMemberManagement(); // Refresh the list
        } else {
            serverApp.showToast(data.error || `Failed to ${action} member`, 'error');
        }
    } catch (error) {
        console.error(`Error ${action}ing member:`, error);
        serverApp.showToast(`Failed to ${action} member`, 'error');
    }
}

async function kickMember(memberId) {
    if (!confirm('Are you sure you want to kick this member?')) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('action', 'kickMember');
        formData.append('serverId', serverApp.currentServerId);
        formData.append('memberId', memberId);

        const response = await fetch('/user/user-server/api/members.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            serverApp.showToast('Member kicked successfully', 'success');
            loadMemberManagement(); // Refresh the list
        } else {
            serverApp.showToast(data.error || 'Failed to kick member', 'error');
        }
    } catch (error) {
        console.error('Error kicking member:', error);
        serverApp.showToast('Failed to kick member', 'error');
    }
}

async function deleteServerAction() {
    const serverId = serverApp.currentServerId;
    const serverName = document.getElementById('serverNameSettings').value;
    
    const confirmation = prompt(`To confirm, type the server name: ${serverName}`);
    if (confirmation !== serverName) {
        serverApp.showToast('Server name confirmation does not match', 'error');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('action', 'deleteServer');
        formData.append('serverId', serverId);
        formData.append('confirmation', confirmation);

        const response = await fetch('/user/user-server/api/servers.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            serverApp.showToast('Server deleted successfully', 'success');
            closeServerSettingsModal();
            // Redirect to home or refresh server list
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            serverApp.showToast(data.error || 'Failed to delete server', 'error');
        }
    } catch (error) {
        console.error('Error deleting server:', error);
        serverApp.showToast('Failed to delete server', 'error');
    }
}