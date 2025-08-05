class VoiceManager {
    constructor() {
        this.localStream = null;
        this.peerConnections = new Map();
        this.currentChannelId = null;
        this.isInVoice = false;
        this.isMuted = false;
        this.isDeafened = false;
        this.isVideoEnabled = false;
        this.isScreenSharing = false;
        this.participants = new Set();
        
        this.init();
    }

    init() {
        this.bindEventListeners();
        this.setupWebRTCConfig();
    }

    setupWebRTCConfig() {
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
    }

    bindEventListeners() {
        // Voice control buttons
        const joinVoiceBtn = document.querySelector('.join-voice-btn');
        const leaveVoiceBtn = document.querySelector('.leave-voice-btn');
        const muteBtn = document.querySelector('.mute-btn');
        const deafenBtn = document.querySelector('.deafen-btn');
        const videoBtn = document.querySelector('.video-btn');
        const screenShareBtn = document.querySelector('.screen-share-btn');
        const activitiesBtn = document.querySelector('.activities-btn');

        joinVoiceBtn?.addEventListener('click', () => this.joinVoiceChannel());
        leaveVoiceBtn?.addEventListener('click', () => this.leaveVoiceChannel());
        muteBtn?.addEventListener('click', () => this.toggleMute());
        deafenBtn?.addEventListener('click', () => this.toggleDeafen());
        videoBtn?.addEventListener('click', () => this.toggleVideo());
        screenShareBtn?.addEventListener('click', () => this.toggleScreenShare());
        activitiesBtn?.addEventListener('click', () => this.showActivities());

        // Socket events for WebRTC signaling
        if (window.socket) {
            window.socket.on('user_joined_voice', (data) => this.onUserJoinedVoice(data));
            window.socket.on('user_left_voice', (data) => this.onUserLeftVoice(data));
            window.socket.on('webrtc_offer', (data) => this.onWebRTCOffer(data));
            window.socket.on('webrtc_answer', (data) => this.onWebRTCAnswer(data));
            window.socket.on('webrtc_ice_candidate', (data) => this.onWebRTCIceCandidate(data));
        }

        // Double-click for fullscreen
        document.addEventListener('dblclick', (e) => {
            if (e.target.matches('.participant-video, .screen-share-video')) {
                this.toggleFullscreen(e.target);
            }
        });
    }

    async joinVoiceChannel(channelId = null) {
        if (this.isInVoice) return;

        const targetChannelId = channelId || channelManager.currentChannelId;
        if (!targetChannelId) return;

        try {
            // Get user media
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });

            this.currentChannelId = targetChannelId;
            this.isInVoice = true;

            // Join voice channel via socket
            window.socket.emit('join_voice', { channelId: targetChannelId });

            // Update UI
            this.updateVoiceUI();
            this.showVoiceControls();
            this.addLocalParticipant();

            serverApp.showToast('Joined voice channel', 'success');
        } catch (error) {
            console.error('Error joining voice channel:', error);
            serverApp.showToast('Failed to access microphone', 'error');
        }
    }

    async leaveVoiceChannel() {
        if (!this.isInVoice) return;

        try {
            // Stop local stream
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }

            // Close all peer connections
            this.peerConnections.forEach((pc, userId) => {
                pc.close();
            });
            this.peerConnections.clear();

            // Leave voice channel via socket
            window.socket.emit('leave_voice', { channelId: this.currentChannelId });

            this.currentChannelId = null;
            this.isInVoice = false;
            this.isVideoEnabled = false;
            this.isScreenSharing = false;
            this.participants.clear();

            // Update UI
            this.updateVoiceUI();
            this.hideVoiceControls();
            this.clearParticipants();

            serverApp.showToast('Left voice channel', 'info');
        } catch (error) {
            console.error('Error leaving voice channel:', error);
        }
    }

    async onUserJoinedVoice(data) {
        const { userId, channelId } = data;
        
        if (channelId !== this.currentChannelId || userId === window.currentUser?.id) return;

        this.participants.add(userId);
        this.addParticipant(userId);

        // Create peer connection for new user
        await this.createPeerConnection(userId);
        
        // Create and send offer
        const offer = await this.peerConnections.get(userId).createOffer();
        await this.peerConnections.get(userId).setLocalDescription(offer);
        
        window.socket.emit('webrtc_offer', {
            channelId: channelId,
            to: userId,
            offer: offer
        });
    }

    async onUserLeftVoice(data) {
        const { userId, channelId } = data;
        
        if (channelId !== this.currentChannelId) return;

        this.participants.delete(userId);
        this.removeParticipant(userId);

        // Close peer connection
        const pc = this.peerConnections.get(userId);
        if (pc) {
            pc.close();
            this.peerConnections.delete(userId);
        }
    }

    async onWebRTCOffer(data) {
        const { from, offer } = data;
        
        if (!this.isInVoice) return;

        // Create peer connection if doesn't exist
        if (!this.peerConnections.has(from)) {
            await this.createPeerConnection(from);
        }

        const pc = this.peerConnections.get(from);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Create and send answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        window.socket.emit('webrtc_answer', {
            channelId: this.currentChannelId,
            to: from,
            answer: answer
        });
    }

    async onWebRTCAnswer(data) {
        const { from, answer } = data;
        
        const pc = this.peerConnections.get(from);
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }

    async onWebRTCIceCandidate(data) {
        const { from, candidate } = data;
        
        const pc = this.peerConnections.get(from);
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }

    async createPeerConnection(userId) {
        const pc = new RTCPeerConnection(this.rtcConfig);
        
        // Add local stream tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream);
            });
        }

        // Handle remote stream
        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            this.handleRemoteStream(userId, remoteStream);
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                window.socket.emit('webrtc_ice_candidate', {
                    channelId: this.currentChannelId,
                    to: userId,
                    candidate: event.candidate
                });
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${userId}:`, pc.connectionState);
            if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                this.handleConnectionFailure(userId);
            }
        };

        this.peerConnections.set(userId, pc);
        return pc;
    }

    handleRemoteStream(userId, stream) {
        const participantElement = document.querySelector(`[data-user-id="${userId}"]`);
        if (participantElement) {
            const audioElement = participantElement.querySelector('.participant-audio');
            const videoElement = participantElement.querySelector('.participant-video');
            
            if (audioElement) {
                audioElement.srcObject = stream;
                audioElement.play();
            }
            
            // Handle video tracks
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length > 0 && videoElement) {
                videoElement.srcObject = stream;
                videoElement.style.display = 'block';
            }
        }
    }

    handleConnectionFailure(userId) {
        console.warn(`Connection failed with user ${userId}, attempting to reconnect...`);
        
        // Attempt to reconnect
        setTimeout(async () => {
            if (this.isInVoice && this.participants.has(userId)) {
                const pc = this.peerConnections.get(userId);
                if (pc) {
                    pc.close();
                    this.peerConnections.delete(userId);
                }
                
                // Recreate connection
                await this.createPeerConnection(userId);
            }
        }, 2000);
    }

    toggleMute() {
        if (!this.localStream) return;

        this.isMuted = !this.isMuted;
        
        const audioTracks = this.localStream.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !this.isMuted;
        });

        this.updateMuteButton();
        
        const status = this.isMuted ? 'Muted' : 'Unmuted';
        serverApp.showToast(status, 'info');
    }

    toggleDeafen() {
        this.isDeafened = !this.isDeafened;
        
        // Mute when deafened
        if (this.isDeafened && !this.isMuted) {
            this.toggleMute();
        }

        // Mute/unmute all remote audio
        document.querySelectorAll('.participant-audio').forEach(audio => {
            audio.muted = this.isDeafened;
        });

        this.updateDeafenButton();
        
        const status = this.isDeafened ? 'Deafened' : 'Undeafened';
        serverApp.showToast(status, 'info');
    }

    async toggleVideo() {
        if (!this.isInVoice) return;

        try {
            if (!this.isVideoEnabled) {
                // Enable video
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const videoTrack = videoStream.getVideoTracks()[0];
                
                // Add video track to all peer connections
                this.peerConnections.forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    } else {
                        pc.addTrack(videoTrack, this.localStream);
                    }
                });

                // Add to local stream
                this.localStream.addTrack(videoTrack);
                this.isVideoEnabled = true;
                
                // Show local video
                this.showLocalVideo();
                
            } else {
                // Disable video
                const videoTracks = this.localStream.getVideoTracks();
                videoTracks.forEach(track => {
                    track.stop();
                    this.localStream.removeTrack(track);
                });
                
                this.isVideoEnabled = false;
                this.hideLocalVideo();
            }

            this.updateVideoButton();
            
        } catch (error) {
            console.error('Error toggling video:', error);
            serverApp.showToast('Failed to access camera', 'error');
        }
    }

    async toggleScreenShare() {
        if (!this.isInVoice) return;

        try {
            if (!this.isScreenSharing) {
                // Start screen sharing
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
                    video: true, 
                    audio: true 
                });
                
                const videoTrack = screenStream.getVideoTracks()[0];
                
                // Replace video track in all peer connections
                this.peerConnections.forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    } else {
                        pc.addTrack(videoTrack, screenStream);
                    }
                });

                // Handle screen share end
                videoTrack.onended = () => {
                    this.stopScreenShare();
                };

                this.isScreenSharing = true;
                this.showScreenShare();
                
            } else {
                this.stopScreenShare();
            }

            this.updateScreenShareButton();
            
        } catch (error) {
            console.error('Error toggling screen share:', error);
            serverApp.showToast('Failed to start screen sharing', 'error');
        }
    }

    stopScreenShare() {
        if (!this.isScreenSharing) return;

        // Stop screen sharing tracks
        this.localStream.getVideoTracks().forEach(track => {
            if (track.label.includes('screen')) {
                track.stop();
                this.localStream.removeTrack(track);
            }
        });

        this.isScreenSharing = false;
        this.hideScreenShare();
        this.updateScreenShareButton();
    }

    showActivities() {
        const activitiesModal = document.getElementById('activitiesModal');
        if (activitiesModal) {
            modalManager.openModal('activitiesModal');
        }
    }

    // UI Update Methods
    updateVoiceUI() {
        const voiceInterface = document.querySelector('.voice-interface');
        const chatInterface = document.querySelector('.chat-interface');
        
        if (this.isInVoice) {
            voiceInterface.style.display = 'flex';
            chatInterface.style.display = 'none';
        } else {
            voiceInterface.style.display = 'none';
            chatInterface.style.display = 'flex';
        }
    }

    showVoiceControls() {
        const voiceControls = document.querySelector('.voice-controls');
        if (voiceControls) {
            voiceControls.style.display = 'flex';
        }
    }

    hideVoiceControls() {
        const voiceControls = document.querySelector('.voice-controls');
        if (voiceControls) {
            voiceControls.style.display = 'none';
        }
    }

    updateMuteButton() {
        const muteBtn = document.querySelector('.mute-btn');
        if (muteBtn) {
            muteBtn.classList.toggle('active', this.isMuted);
            muteBtn.title = this.isMuted ? 'Unmute' : 'Mute';
        }
    }

    updateDeafenButton() {
        const deafenBtn = document.querySelector('.deafen-btn');
        if (deafenBtn) {
            deafenBtn.classList.toggle('active', this.isDeafened);
            deafenBtn.title = this.isDeafened ? 'Undeafen' : 'Deafen';
        }
    }

    updateVideoButton() {
        const videoBtn = document.querySelector('.video-btn');
        if (videoBtn) {
            videoBtn.classList.toggle('active', this.isVideoEnabled);
            videoBtn.title = this.isVideoEnabled ? 'Turn off camera' : 'Turn on camera';
        }
    }

    updateScreenShareButton() {
        const screenShareBtn = document.querySelector('.screen-share-btn');
        if (screenShareBtn) {
            screenShareBtn.classList.toggle('active', this.isScreenSharing);
            screenShareBtn.title = this.isScreenSharing ? 'Stop sharing' : 'Share screen';
        }
    }

    addLocalParticipant() {
        const participantsContainer = document.querySelector('.voice-participants');
        if (!participantsContainer) return;

        const localParticipant = document.createElement('div');
        localParticipant.className = 'participant local-participant';
        localParticipant.dataset.userId = window.currentUser?.id;
        
        localParticipant.innerHTML = `
            <div class="participant-avatar">
                <img src="${window.currentUser?.avatar || '/assets/images/default-avatar.png'}" alt="You">
                <div class="speaking-indicator"></div>
            </div>
            <div class="participant-name">${window.currentUser?.username || 'You'}</div>
            <div class="participant-controls">
                <button class="participant-mute" title="Mute">
                    <i class="fas fa-microphone"></i>
                </button>
            </div>
            <video class="participant-video local-video" autoplay muted style="display: none;"></video>
        `;

        participantsContainer.appendChild(localParticipant);
    }

    addParticipant(userId) {
        const participantsContainer = document.querySelector('.voice-participants');
        if (!participantsContainer) return;

        // Get user info (you'd typically fetch this from your user data)
        const participant = document.createElement('div');
        participant.className = 'participant';
        participant.dataset.userId = userId;
        
        participant.innerHTML = `
            <div class="participant-avatar">
                <img src="/assets/images/default-avatar.png" alt="User ${userId}">
                <div class="speaking-indicator"></div>
            </div>
            <div class="participant-name">User ${userId}</div>
            <div class="participant-controls">
                <button class="participant-mute" title="Mute">
                    <i class="fas fa-microphone"></i>
                </button>
            </div>
            <audio class="participant-audio" autoplay></audio>
            <video class="participant-video" autoplay style="display: none;"></video>
        `;

        participantsContainer.appendChild(participant);
    }

    removeParticipant(userId) {
        const participant = document.querySelector(`[data-user-id="${userId}"]`);
        if (participant) {
            participant.remove();
        }
    }

    clearParticipants() {
        const participantsContainer = document.querySelector('.voice-participants');
        if (participantsContainer) {
            participantsContainer.innerHTML = '';
        }
    }

    showLocalVideo() {
        const localVideo = document.querySelector('.local-video');
        if (localVideo && this.localStream) {
            localVideo.srcObject = this.localStream;
            localVideo.style.display = 'block';
        }
    }

    hideLocalVideo() {
        const localVideo = document.querySelector('.local-video');
        if (localVideo) {
            localVideo.style.display = 'none';
        }
    }

    showScreenShare() {
        const screenShareContainer = document.querySelector('.screen-share-container');
        if (screenShareContainer) {
            screenShareContainer.style.display = 'block';
        }
    }

    hideScreenShare() {
        const screenShareContainer = document.querySelector('.screen-share-container');
        if (screenShareContainer) {
            screenShareContainer.style.display = 'none';
        }
    }

    toggleFullscreen(element) {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            element.requestFullscreen();
        }
    }

    // Utility Methods
    async getDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return {
                audioInputs: devices.filter(device => device.kind === 'audioinput'),
                audioOutputs: devices.filter(device => device.kind === 'audiooutput'),
                videoInputs: devices.filter(device => device.kind === 'videoinput')
            };
        } catch (error) {
            console.error('Error getting devices:', error);
            return { audioInputs: [], audioOutputs: [], videoInputs: [] };
        }
    }

    async switchAudioInput(deviceId) {
        if (!this.localStream) return;

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: deviceId } },
                video: this.isVideoEnabled
            });

            const audioTrack = newStream.getAudioTracks()[0];
            
            // Replace audio track in all peer connections
            this.peerConnections.forEach(pc => {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
                if (sender) {
                    sender.replaceTrack(audioTrack);
                }
            });

            // Replace in local stream
            const oldAudioTrack = this.localStream.getAudioTracks()[0];
            if (oldAudioTrack) {
                this.localStream.removeTrack(oldAudioTrack);
                oldAudioTrack.stop();
            }
            this.localStream.addTrack(audioTrack);

        } catch (error) {
            console.error('Error switching audio input:', error);
            serverApp.showToast('Failed to switch microphone', 'error');
        }
    }

    async switchVideoInput(deviceId) {
        if (!this.isVideoEnabled) return;

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { deviceId: { exact: deviceId } }
            });

            const videoTrack = newStream.getVideoTracks()[0];
            
            // Replace video track in all peer connections
            this.peerConnections.forEach(pc => {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            });

            // Replace in local stream
            const oldVideoTrack = this.localStream.getVideoTracks()[0];
            if (oldVideoTrack) {
                this.localStream.removeTrack(oldVideoTrack);
                oldVideoTrack.stop();
            }
            this.localStream.addTrack(videoTrack);

            // Update local video
            this.showLocalVideo();

        } catch (error) {
            console.error('Error switching video input:', error);
            serverApp.showToast('Failed to switch camera', 'error');
        }
    }
}

// Initialize voice manager
const voiceManager = new VoiceManager();

// Export for global access
window.voiceManager = voiceManager;