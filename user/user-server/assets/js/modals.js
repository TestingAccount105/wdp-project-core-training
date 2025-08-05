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
    }

    bindUserSettingsEvents() {
        const modal = document.getElementById('userSettingsModal');
        
        // Tab switching
        const tabs = modal.querySelectorAll('.settings-tab');
        const contents = modal.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                this.switchSettingsTab(targetTab, tabs, contents);
            });
        });

        // Profile form
        const profileForm = modal.querySelector('#profileForm');
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProfileUpdate(profileForm);
        });

        // Password change
        const passwordForm = modal.querySelector('#passwordForm');
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePasswordChange(passwordForm);
        });

        // Security question verification
        const securityForm = modal.querySelector('#securityForm');
        securityForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSecurityVerification(securityForm);
        });

        // Delete account
        const deleteForm = modal.querySelector('#deleteAccountForm');
        deleteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleDeleteAccount(deleteForm);
        });

        // Email reveal toggle
        const emailToggle = modal.querySelector('.email-reveal');
        emailToggle.addEventListener('click', () => {
            this.toggleEmailReveal(emailToggle);
        });

        // Device testing
        this.bindDeviceTestingEvents(modal);
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
        // Microphone test
        const micTest = modal.querySelector('.mic-test');
        micTest.addEventListener('click', () => {
            this.testMicrophone();
        });

        // Camera test
        const cameraTest = modal.querySelector('.camera-test');
        cameraTest.addEventListener('click', () => {
            this.testCamera();
        });

        // Volume sliders
        const volumeSliders = modal.querySelectorAll('input[type="range"]');
        volumeSliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                this.updateVolumeDisplay(e.target);
            });
        });
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
            } else {
                serverApp.showToast(data.error || 'Failed to create server', 'error');
            }
        } catch (error) {
            console.error('Error creating server:', error);
            serverApp.showToast('Failed to create server', 'error');
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
}

// Initialize modal manager
const modalManager = new ModalManager();

// Export for global access
window.modalManager = modalManager;