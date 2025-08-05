<!-- Invite People Modal -->
<div class="modal hidden" id="invitePeopleModal">
    <div class="modal-overlay" onclick="closeInvitePeopleModal()"></div>
    <div class="modal-content">
        <div class="modal-header">
            <h2>Invite People</h2>
            <button class="modal-close" onclick="closeInvitePeopleModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="invite-section">
                <h3>Invite with Link</h3>
                <p>Share this link with others to grant access to this server!</p>
                
                <div class="invite-link-container">
                    <div class="invite-link" id="inviteLink">
                        <span id="inviteLinkText">Generating...</span>
                        <div class="invite-actions">
                            <button class="btn-icon" id="copyInviteBtn" onclick="copyInviteLink()" title="Copy">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button class="btn-icon" id="regenerateInviteBtn" onclick="regenerateInviteLink()" title="Generate New Link">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="invite-settings">
                    <div class="setting-group">
                        <label for="inviteExpiration">Link Expiration</label>
                        <select id="inviteExpiration">
                            <option value="30">30 minutes</option>
                            <option value="60">1 hour</option>
                            <option value="360">6 hours</option>
                            <option value="720">12 hours</option>
                            <option value="1440" selected>1 day</option>
                            <option value="10080">7 days</option>
                            <option value="0">Never</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="invite-section">
                <h3>Invite Titibot</h3>
                <p>Add our helpful bot to your server for moderation and fun features!</p>
                
                <div class="titibot-invite">
                    <div class="bot-info">
                        <div class="bot-avatar">
                            <img src="assets/images/titibot-avatar.png" alt="Titibot" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="bot-avatar-fallback" style="display: none;">
                                <i class="fas fa-robot"></i>
                            </div>
                        </div>
                        <div class="bot-details">
                            <h4>Titibot <span class="bot-badge">BOT</span></h4>
                            <p>Moderation, music, games, and more!</p>
                        </div>
                    </div>
                    <button class="btn-primary" id="inviteTitibotBtn" onclick="inviteTitibot()">
                        <i class="fas fa-plus"></i> Add to Server
                    </button>
                </div>
            </div>

            <div class="invite-section">
                <h3>Recent Invites</h3>
                <div class="recent-invites" id="recentInvitesList">
                    <!-- Recent invites will be loaded here -->
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeInvitePeopleModal()">Close</button>
        </div>
    </div>
</div>

<!-- Accept Invite Modal (for when users click invite links) -->
<div class="modal hidden" id="acceptInviteModal">
    <div class="modal-overlay"></div>
    <div class="modal-content">
        <div class="modal-header">
            <h2>Join Server</h2>
        </div>
        <div class="modal-body">
            <div class="server-invite-preview" id="serverInvitePreview">
                <!-- Server preview will be loaded here -->
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="declineInvite()">Decline</button>
            <button type="button" class="btn-primary" onclick="acceptInvite()">Join Server</button>
        </div>
    </div>
</div>