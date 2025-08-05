<!-- Create Server Modal -->
<div class="modal hidden" id="createServerModal">
    <div class="modal-overlay" onclick="closeCreateServerModal()"></div>
    <div class="modal-content large">
        <div class="modal-header">
            <h2>Create Your Server</h2>
            <button class="modal-close" onclick="closeCreateServerModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <form id="createServerForm" enctype="multipart/form-data">
                <div class="form-section">
                    <div class="server-identity">
                        <h3>Server Identity</h3>
                        
                        <!-- Server Icon -->
                        <div class="form-group">
                            <label for="serverIcon">Server Icon</label>
                            <p class="form-description">We recommend an image of at least 512×512.</p>
                            <div class="icon-upload">
                                <div class="icon-preview" id="serverIconPreview">
                                    <i class="fas fa-camera"></i>
                                    <span>Upload Icon</span>
                                </div>
                                <input type="file" id="serverIconInput" accept="image/*" style="display: none;">
                                <button type="button" class="btn-secondary" onclick="document.getElementById('serverIconInput').click()">
                                    Choose File
                                </button>
                            </div>
                        </div>

                        <!-- Server Banner -->
                        <div class="form-group">
                            <label for="serverBanner">Server Banner</label>
                            <p class="form-description">Recommended size: 960×540. This will be shown at the top of your server.</p>
                            <div class="banner-upload">
                                <div class="banner-preview" id="serverBannerPreview">
                                    <i class="fas fa-image"></i>
                                    <span>Upload Banner</span>
                                </div>
                                <input type="file" id="serverBannerInput" accept="image/*" style="display: none;">
                                <button type="button" class="btn-secondary" onclick="document.getElementById('serverBannerInput').click()">
                                    Choose File
                                </button>
                            </div>
                        </div>

                        <!-- Server Name -->
                        <div class="form-group">
                            <label for="serverNameInput">Server Name <span class="required">*</span></label>
                            <input type="text" id="serverNameInput" placeholder="Enter server name" maxlength="100" required>
                            <div class="form-error" id="serverNameError"></div>
                        </div>

                        <!-- Server Description -->
                        <div class="form-group">
                            <label for="serverDescriptionInput">Server Description</label>
                            <textarea id="serverDescriptionInput" placeholder="Tell people what your server is about" maxlength="1000" rows="3"></textarea>
                            <div class="character-count">
                                <span id="descriptionCount">0</span>/1000
                            </div>
                        </div>
                    </div>

                    <div class="server-settings">
                        <h3>Server Settings</h3>
                        
                        <!-- Category Selection -->
                        <div class="form-group">
                            <label for="serverCategory">Category <span class="required">*</span></label>
                            <select id="serverCategory" required>
                                <option value="">Select a category</option>
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
                        </div>

                        <!-- Public/Private Toggle -->
                        <div class="form-group">
                            <div class="toggle-group">
                                <div class="toggle-info">
                                    <label>Make this server public</label>
                                    <p class="form-description">Public servers can be discovered on the explore page</p>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="serverPublicToggle">
                                    <label for="serverPublicToggle" class="toggle-label">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeCreateServerModal()">Cancel</button>
            <button type="button" class="btn-primary" id="createServerBtn" onclick="createServer()">Create Server</button>
        </div>
    </div>
</div>

<!-- Image Cropper Modal -->
<div class="modal hidden" id="imageCropperModal">
    <div class="modal-overlay"></div>
    <div class="modal-content large">
        <div class="modal-header">
            <h2>Crop Image</h2>
            <button class="modal-close" onclick="closeCropperModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="cropper-container">
                <img id="cropperImage" style="max-width: 100%;">
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeCropperModal()">Cancel</button>
            <button type="button" class="btn-primary" onclick="applyCrop()">Apply</button>
        </div>
    </div>
</div>