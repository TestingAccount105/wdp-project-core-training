<!-- Server Settings Modal -->
<div class="modal hidden" id="serverSettingsModal">
    <div class="modal-overlay" onclick="closeServerSettingsModal()"></div>
    <div class="modal-content extra-large">
        <div class="modal-header">
            <h2 id="serverSettingsTitle">Server Settings</h2>
            <button class="modal-close" onclick="closeServerSettingsModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body settings-modal">
            <!-- Settings Sidebar -->
            <div class="settings-sidebar">
                <div class="settings-section">
                    <h4>SERVER SETTINGS</h4>
                    <div class="settings-nav-item active" data-tab="server-profile">
                        <i class="fas fa-server"></i>
                        <span>Server Profile</span>
                    </div>
                </div>
                <div class="settings-section">
                    <h4>CHANNELS</h4>
                    <div class="settings-nav-item" data-tab="channel-management">
                        <i class="fas fa-list"></i>
                        <span>Channel Management</span>
                    </div>
                </div>
                <div class="settings-section">
                    <h4>PEOPLE</h4>
                    <div class="settings-nav-item" data-tab="members">
                        <i class="fas fa-users"></i>
                        <span>Members</span>
                    </div>
                </div>
                <div class="settings-section">
                    <h4>DANGER ZONE</h4>
                    <div class="settings-nav-item danger" data-tab="delete-server">
                        <i class="fas fa-trash"></i>
                        <span>Delete Server</span>
                    </div>
                </div>
            </div>

            <!-- Settings Content -->
            <div class="settings-content">
                <!-- Server Profile Tab -->
                <div class="settings-tab active" id="serverProfileTab">
                    <div class="settings-header">
                        <h3>Server Profile</h3>
                        <p>Customize your server's appearance and profile information</p>
                    </div>

                    <div class="server-preview">
                        <div class="server-banner-preview" id="serverBannerSettingsPreview">
                            <button class="banner-edit-btn" onclick="editServerBanner()">
                                <i class="fas fa-camera"></i>
                            </button>
                        </div>
                        <div class="server-info-preview">
                            <div class="server-icon-preview" id="serverIconSettingsPreview">
                                <button class="icon-edit-btn" onclick="editServerIcon()">
                                    <i class="fas fa-camera"></i>
                                </button>
                            </div>
                            <div class="server-details-preview">
                                <h4 id="serverNamePreview">Loading...</h4>
                                <p id="serverDescriptionPreview">Loading...</p>
                            </div>
                        </div>
                    </div>

                    <form id="serverProfileForm">
                        <div class="form-section">
                            <h4>SERVER IDENTITY</h4>
                            
                            <div class="form-group">
                                <label>Icon</label>
                                <p>Recommended: 512×512 or larger square image</p>
                                <input type="file" id="serverIconSettingsInput" accept="image/*" style="display: none;">
                            </div>

                            <div class="form-group">
                                <label>Banner</label>
                                <p>Recommended: 960×540. This will be shown at the top of your server</p>
                                <input type="file" id="serverBannerSettingsInput" accept="image/*" style="display: none;">
                            </div>

                            <div class="form-group">
                                <label for="serverNameSettings">Server Name</label>
                                <input type="text" id="serverNameSettings" maxlength="100">
                                <button type="button" class="btn-primary hidden" id="saveServerNameBtn" onclick="saveServerName()">Save</button>
                            </div>

                            <div class="form-group">
                                <label for="serverDescriptionSettings">Description</label>
                                <textarea id="serverDescriptionSettings" maxlength="1000" rows="3"></textarea>
                                <div class="character-count">
                                    <span id="serverDescriptionCount">0</span>/1000
                                </div>
                                <button type="button" class="btn-primary hidden" id="saveServerDescriptionBtn" onclick="saveServerDescription()">Save</button>
                            </div>
                        </div>

                        <div class="form-section">
                            <h4>DISCOVERY SETTINGS</h4>
                            
                            <div class="form-group">
                                <div class="toggle-group">
                                    <div class="toggle-info">
                                        <label>Make this server public</label>
                                        <p>Your server is currently private and not discoverable</p>
                                    </div>
                                    <div class="toggle-switch">
                                        <input type="checkbox" id="serverPublicSettingsToggle">
                                        <label for="serverPublicSettingsToggle" class="toggle-label">
                                            <span class="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="serverCategorySettings">Category</label>
                                <select id="serverCategorySettings">
                                    <option value="Gaming">Gaming</option>
                                    <option value="Music">Music</option>
                                    <option value="Education">Education</option>
                                    <option value="Science & Tech">Science & Tech</option>
                                    <option value="Entertainment">Entertainment</option>
                                    <option value="Art">Art</option>
                                    <option value="Fashion & Beauty">Fashion & Beauty</option>
                                    <option value="Fitness & Health">Fitness & Health</option>
                                    <option value="Travel & Places">Travel & Places</option>
                                    <option value="Food & Cooking">Food & Cooking</option>
                                    <option value="Animals & Nature">Animals & Nature</option>
                                    <option value="Anime & Manga">Anime & Manga</option>
                                    <option value="Movies & TV">Movies & TV</option>
                                    <option value="Books & Literature">Books & Literature</option>
                                    <option value="Sports">Sports</option>
                                    <option value="Business">Business</option>
                                    <option value="Cryptocurrency">Cryptocurrency</option>
                                    <option value="Other">Other</option>
                                </select>
                                <button type="button" class="btn-primary hidden" id="saveServerCategoryBtn" onclick="saveServerCategory()">Save</button>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Channel Management Tab -->
                <div class="settings-tab" id="channelManagementTab">
                    <div class="settings-header">
                        <h3>Channel Management</h3>
                        <p>Manage channel names and settings for your server</p>
                    </div>

                    <div class="channel-management-controls">
                        <div class="search-filter-controls">
                            <div class="search-container">
                                <input type="text" placeholder="Search channels" id="channelSearchInput">
                                <i class="fas fa-search"></i>
                            </div>
                            <select id="channelTypeFilter">
                                <option value="all">All Channels</option>
                                <option value="text">Text Channels</option>
                                <option value="voice">Voice Channels</option>
                            </select>
                        </div>
                    </div>

                    <div class="channels-table">
                        <div class="table-header">
                            <div class="header-cell">CHANNEL</div>
                            <div class="header-cell">TYPE</div>
                            <div class="header-cell">ACTIONS</div>
                        </div>
                        <div class="table-body" id="channelsTableBody">
                            <!-- Channels will be loaded here -->
                        </div>
                    </div>

                    <div class="management-note">
                        <i class="fas fa-info-circle"></i>
                        <span>Only server owners and admins can manage channels</span>
                    </div>
                </div>

                <!-- Members Tab -->
                <div class="settings-tab" id="membersTab">
                    <div class="settings-header">
                        <h3>Member Management</h3>
                        <p>Promote or demote server members to manage permissions and access</p>
                    </div>

                    <div class="member-management-controls">
                        <div class="search-filter-controls">
                            <div class="search-container">
                                <input type="text" placeholder="Search members" id="memberSearchInput">
                                <i class="fas fa-search"></i>
                            </div>
                            <select id="memberRoleFilter">
                                <option value="all">All Members</option>
                                <option value="Owner">Owner</option>
                                <option value="Admin">Admin</option>
                                <option value="Member">Member</option>
                                <option value="Bot">Bot</option>
                            </select>
                        </div>
                    </div>

                    <div class="members-table">
                        <div class="table-header">
                            <div class="header-cell">USER</div>
                            <div class="header-cell">ROLE</div>
                            <div class="header-cell">JOINED</div>
                            <div class="header-cell">ACTIONS</div>
                        </div>
                        <div class="table-body" id="membersTableBody">
                            <!-- Members will be loaded here -->
                        </div>
                    </div>

                    <div class="management-note">
                        <i class="fas fa-info-circle"></i>
                        <span>Only server owners can promote/demote members. Admins can kick members</span>
                    </div>
                </div>

                <!-- Delete Server Tab -->
                <div class="settings-tab" id="deleteServerTab">
                    <div class="settings-header danger">
                        <h3>Delete Server</h3>
                        <p>Permanently delete this server and all its data</p>
                    </div>

                    <div class="warning-section">
                        <div class="warning-box">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div>
                                <h4>This action cannot be undone</h4>
                                <p>Deleting this server will permanently remove all channels, messages, and member data. This action is irreversible.</p>
                            </div>
                        </div>
                    </div>

                    <div id="ownershipTransferWarning" class="warning-section hidden">
                        <div class="warning-box error">
                            <i class="fas fa-crown"></i>
                            <div>
                                <h4>Ownership Transfer Required</h4>
                                <p>As the server owner, you must transfer ownership to another admin before you can delete the server.</p>
                            </div>
                        </div>
                    </div>

                    <div class="delete-server-form">
                        <div class="form-group">
                            <label for="deleteServerConfirmation">Type the server name to confirm deletion:</label>
                            <input type="text" id="deleteServerConfirmation" placeholder="Enter server name">
                        </div>
                        <button class="btn-danger" id="deleteServerBtn" onclick="deleteServer()" disabled>
                            Delete Server
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Edit Channel Modal -->
<div class="modal hidden" id="editChannelModal">
    <div class="modal-overlay" onclick="closeEditChannelModal()"></div>
    <div class="modal-content">
        <div class="modal-header">
            <h3>Edit Channel</h3>
            <button class="modal-close" onclick="closeEditChannelModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <form id="editChannelForm">
                <div class="form-group">
                    <label for="editChannelName">Channel Name</label>
                    <div class="channel-name-input">
                        <span class="channel-prefix" id="editChannelPrefix">#</span>
                        <input type="text" id="editChannelName" maxlength="100">
                    </div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeEditChannelModal()">Cancel</button>
            <button type="button" class="btn-primary" onclick="saveChannelEdit()">Save Changes</button>
        </div>
    </div>
</div>

<!-- Transfer Ownership Modal -->
<div class="modal hidden" id="transferOwnershipModal">
    <div class="modal-overlay" onclick="closeTransferOwnershipModal()"></div>
    <div class="modal-content">
        <div class="modal-header">
            <h3>Transfer Ownership</h3>
            <button class="modal-close" onclick="closeTransferOwnershipModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="warning-section">
                <div class="warning-box">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <h4>Transfer Server Ownership</h4>
                        <p>You are about to transfer ownership of this server. This action cannot be undone.</p>
                    </div>
                </div>
            </div>
            <form id="transferOwnershipForm">
                <div class="form-group">
                    <label for="newOwnerSelect">Select New Owner</label>
                    <select id="newOwnerSelect">
                        <!-- Admin members will be loaded here -->
                    </select>
                </div>
                <div class="form-group">
                    <label for="transferConfirmation">Type "transfer ownership" to confirm:</label>
                    <input type="text" id="transferConfirmation" placeholder="transfer ownership">
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeTransferOwnershipModal()">Cancel</button>
            <button type="button" class="btn-danger" id="confirmTransferBtn" onclick="confirmOwnershipTransfer()" disabled>
                Transfer Ownership
            </button>
        </div>
    </div>
</div>