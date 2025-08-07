<!-- User Settings Modal -->
<div class="modal hidden" id="userSettingsModal">
    <div class="modal-overlay" onclick="closeUserSettingsModal()"></div>
    <div class="modal-content extra-large">
        <div class="modal-header">
            <h2>User Settings</h2>
            <button class="modal-close" onclick="closeUserSettingsModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body settings-modal">
            <!-- Settings Sidebar -->
            <div class="settings-sidebar">
                <div class="settings-section">
                    <h4>USER SETTINGS</h4>
                    <div class="settings-nav-item active" data-tab="my-account">
                        <i class="fas fa-user"></i>
                        <span>My Account</span>
                    </div>
                </div>
                <div class="settings-section">
                    <h4>APP SETTINGS</h4>
                    <div class="settings-nav-item" data-tab="voice-video">
                        <i class="fas fa-headphones"></i>
                        <span>Voice & Video</span>
                    </div>
                </div>
                <div class="settings-section">
                    <h4>USER ACTIONS</h4>
                    <div class="settings-nav-item danger" data-tab="delete-account">
                        <i class="fas fa-trash"></i>
                        <span>Delete Account</span>
                    </div>
                    <div class="settings-nav-item" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Log Out</span>
                    </div>
                </div>
            </div>

            <!-- Settings Content -->
            <div class="settings-content">
                <!-- My Account Tab -->
                <div class="settings-tab active" id="myAccountTab">
                    <div class="settings-header">
                        <h3>My Account</h3>
                        <p>Manage your account information and settings</p>
                    </div>
                    
                    <div class="account-preview">
                        <div class="account-banner" id="userBannerPreview">
                            <button class="banner-edit-btn" onclick="editBanner()">
                                <i class="fas fa-camera"></i>
                            </button>
                        </div>
                        <div class="account-info">
                            <div class="account-avatar" id="userAvatarPreview">
                                <button class="avatar-edit-btn" onclick="editAvatar()">
                                    <i class="fas fa-camera"></i>
                                </button>
                            </div>
                            <div class="account-details">
                                <h4 id="accountDisplayName">Loading...</h4>
                                <p id="accountUsername">Loading...</p>
                            </div>
                        </div>
                    </div>

                    <form id="accountForm">
                        <div class="form-section">
                            <h4>PROFILE PICTURE</h4>
                            <p>We recommend an image of at least 512×512.</p>
                            <input type="file" id="avatarInput" accept="image/*" style="display: none;">
                        </div>

                        <div class="form-section">
                            <h4>PROFILE BANNER</h4>
                            <p>Express yourself with a banner image. Recommended size: 960×240.</p>
                            <input type="file" id="bannerInput" accept="image/*" style="display: none;">
                        </div>

                        <div class="form-group">
                            <label for="usernameField">USERNAME</label>
                            <div class="input-with-tag">
                                <input type="text" id="usernameField" maxlength="32">
                                <span class="user-tag" id="userTag">#0000</span>
                            </div>
                            <button type="button" class="btn-primary hidden" id="saveUsernameBtn" onclick="saveUsername()">Save</button>
                        </div>

                        <div class="form-group">
                            <label for="displayNameField">DISPLAY NAME</label>
                            <input type="text" id="displayNameField" placeholder="This is how others see you. You can use any name you'd like." maxlength="32">
                            <button type="button" class="btn-primary hidden" id="saveDisplayNameBtn" onclick="saveDisplayName()">Save</button>
                        </div>

                        <div class="form-group">
                            <label for="aboutMeField">ABOUT ME</label>
                            <textarea id="aboutMeField" placeholder="Tell us about yourself" maxlength="1000" rows="3"></textarea>
                            <div class="character-count">
                                <span id="aboutMeCount">0</span>/1000
                            </div>
                            <button type="button" class="btn-primary hidden" id="saveAboutMeBtn" onclick="saveAboutMe()">Save</button>
                        </div>

                        <div class="form-section">
                            <h4>CONTACT INFORMATION</h4>
                            <div class="form-group">
                                <label for="emailField">EMAIL</label>
                                <div class="email-reveal">
                                    <span id="emailMasked">Loading...</span>
                                    <button type="button" class="btn-link" id="revealEmailBtn">Reveal</button>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h4>PASSWORD AND AUTHENTICATION</h4>
                            <button type="button" class="btn-secondary" onclick="openPasswordChangeModal()">Change Password</button>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="resetAccountForm()">Reset</button>
                            <button type="button" class="btn-primary hidden" id="saveAccountBtn" onclick="saveAccountChanges()">Save Changes</button>
                        </div>
                    </form>
                </div>

                <!-- Voice & Video Tab -->
                <div class="settings-tab" id="voiceVideoTab">
                    <div class="settings-header">
                        <h3>Voice & Video</h3>
                        <p>Configure your audio and video settings for the best communication experience</p>
                    </div>

                    <div class="settings-tabs">
                        <button class="tab-btn active" data-subtab="voice">Voice</button>
                        <button class="tab-btn" data-subtab="video">Video</button>
                    </div>

                    <!-- Voice Settings -->
                    <div class="settings-subtab active" id="voiceSettings">
                        <div class="device-section">
                            <div class="device-group">
                                <h4><i class="fas fa-microphone"></i> Input Device</h4>
                                <select id="inputDeviceSelect">
                                    <option>Default - Microphone Array (3- Intel® Smart Sound Technology for Digital Microphones)</option>
                                </select>
                            </div>

                            <div class="device-group">
                                <h4><i class="fas fa-headphones"></i> Output Device</h4>
                                <select id="outputDeviceSelect">
                                    <option>Speaker (3- Realtek(R) Audio)</option>
                                </select>
                            </div>
                        </div>

                        <div class="volume-section">
                            <div class="volume-group">
                                <h4>Input Volume</h4>
                                <div class="volume-control">
                                    <input type="range" id="inputVolumeSlider" min="0" max="100" value="50">
                                    <span class="volume-value">50%</span>
                                </div>
                                <div class="volume-indicator" id="inputVolumeIndicator">
                                    <div class="volume-bar"></div>
                                </div>
                            </div>

                            <div class="volume-group">
                                <h4>Output Volume</h4>
                                <div class="volume-control">
                                    <input type="range" id="outputVolumeSlider" min="0" max="100" value="75">
                                    <span class="volume-value">75%</span>
                                </div>
                                <div class="volume-indicator" id="outputVolumeIndicator">
                                    <div class="volume-bar"></div>
                                </div>
                            </div>
                        </div>

                        <div class="microphone-test">
                            <h4>Microphone Test</h4>
                            <p>Test your microphone to ensure it's working properly</p>
                            <button class="btn-primary" id="micTestBtn" onclick="startMicTest()">
                                <i class="fas fa-play"></i> Start Test
                            </button>
                            <div class="mic-test-indicator hidden" id="micTestIndicator">
                                <div class="test-bars">
                                    <div class="test-bar"></div>
                                    <div class="test-bar"></div>
                                    <div class="test-bar"></div>
                                    <div class="test-bar"></div>
                                    <div class="test-bar"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Video Settings -->
                    <div class="settings-subtab" id="videoSettings">
                        <div class="device-section">
                            <div class="device-group">
                                <h4><i class="fas fa-video"></i> Camera Device</h4>
                                <select id="cameraDeviceSelect">
                                    <option>Default Camera</option>
                                </select>
                            </div>
                        </div>

                        <div class="camera-preview-section">
                            <h4>Camera Preview</h4>
                            <div class="camera-preview" id="cameraPreview">
                                <video id="cameraVideo" autoplay muted></video>
                                <div class="camera-overlay">
                                    <button class="btn-danger" id="stopCameraBtn" onclick="stopCamera()">
                                        <i class="fas fa-stop"></i> Stop Camera
                                    </button>
                                </div>
                            </div>
                            <button class="btn-primary" id="testCameraBtn" onclick="testCamera()">
                                Test Camera
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Delete Account Tab -->
                <div class="settings-tab" id="deleteAccountTab">
                    <div class="settings-header danger">
                        <h3>Delete Account</h3>
                        <p>Permanently delete your account and all associated data</p>
                    </div>

                    <div class="warning-section">
                        <div class="warning-box">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div>
                                <h4>This action cannot be undone</h4>
                                <p>Deleting your account will permanently remove all your data, including messages, server memberships, and settings.</p>
                            </div>
                        </div>
                    </div>

                    <div id="serverOwnershipWarning" class="warning-section hidden">
                        <div class="warning-box error">
                            <i class="fas fa-crown"></i>
                            <div>
                                <h4>Server Ownership Transfer Required</h4>
                                <p>You currently own servers. You must transfer ownership of all your servers before deleting your account.</p>
                                <div id="ownedServersList"></div>
                            </div>
                        </div>
                    </div>

                    <button class="btn-danger" id="deleteAccountBtn" onclick="initiateAccountDeletion()">
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Password Change Modal -->
<div class="modal hidden" id="passwordChangeModal">
    <div class="modal-overlay" onclick="closePasswordChangeModal()"></div>
    <div class="modal-content">
        <div class="modal-header">
            <h3>Change Password</h3>
            <button class="modal-close" onclick="closePasswordChangeModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="password-change-steps">
                <!-- Step 1: Security Question -->
                <div class="password-step active" id="securityStep">
                    <h4>Security Verification</h4>
                    <p>Please answer your security question to continue.</p>
                    <div class="form-group">
                        <label id="securityQuestionLabel">Loading...</label>
                        <input type="text" id="securityAnswerInput" placeholder="Enter your answer">
                    </div>
                    <button class="btn-primary" onclick="verifySecurityAnswer()">Verify</button>
                </div>

                <!-- Step 2: New Password -->
                <div class="password-step" id="passwordStep">
                    <h4>Set New Password</h4>
                    <div class="form-group">
                        <label for="newPasswordInput">New Password</label>
                        <input type="password" id="newPasswordInput" placeholder="Enter new password">
                    </div>
                    <div class="form-group">
                        <label for="confirmPasswordInput">Confirm Password</label>
                        <input type="password" id="confirmPasswordInput" placeholder="Confirm new password">
                    </div>
                    <button class="btn-primary" onclick="changePassword()">Change Password</button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Avatar Cropper Modal -->
<div class="modal hidden" id="avatarCropperModal">
    <div class="modal-overlay"></div>
    <div class="modal-content large">
        <div class="modal-header">
            <h3>Crop Profile Picture</h3>
            <button class="modal-close" onclick="closeAvatarCropper()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="cropper-container">
                <img id="avatarCropperImage" src="" alt="Avatar to crop">
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeAvatarCropper()">Cancel</button>
            <button type="button" class="btn-primary" onclick="cropAndSaveAvatar()">Save Avatar</button>
        </div>
    </div>
</div>

<!-- Banner Cropper Modal -->
<div class="modal hidden" id="bannerCropperModal">
    <div class="modal-overlay"></div>
    <div class="modal-content large">
        <div class="modal-header">
            <h3>Crop Profile Banner</h3>
            <button class="modal-close" onclick="closeBannerCropper()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="cropper-container">
                <img id="bannerCropperImage" src="" alt="Banner to crop">
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeBannerCropper()">Cancel</button>
            <button type="button" class="btn-primary" onclick="cropAndSaveBanner()">Save Banner</button>
        </div>
    </div>
</div>