<!-- Create Channel Modal -->
<div class="modal hidden" id="createChannelModal">
    <div class="modal-overlay" onclick="closeCreateChannelModal()"></div>
    <div class="modal-content">
        <div class="modal-header">
            <h2>Create Channel</h2>
            <button class="modal-close" onclick="closeCreateChannelModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <p class="modal-description">Create a new channel for your server</p>
            
            <form id="createChannelForm">
                <div class="form-group">
                    <label>CHANNEL TYPE</label>
                    <div class="channel-type-options">
                        <div class="channel-type-option active" data-type="Text">
                            <div class="option-icon">
                                <i class="fas fa-hashtag"></i>
                            </div>
                            <div class="option-info">
                                <h4>Text</h4>
                                <p>Send messages, images, GIFs, emoji, opinions, and puns</p>
                            </div>
                            <div class="option-radio">
                                <input type="radio" name="channelType" value="Text" id="textChannelType" checked>
                                <label for="textChannelType"></label>
                            </div>
                        </div>
                        
                        <div class="channel-type-option" data-type="Voice">
                            <div class="option-icon">
                                <i class="fas fa-volume-up"></i>
                            </div>
                            <div class="option-info">
                                <h4>Voice</h4>
                                <p>Hang out together with voice, video, and screen share</p>
                            </div>
                            <div class="option-radio">
                                <input type="radio" name="channelType" value="Voice" id="voiceChannelType">
                                <label for="voiceChannelType"></label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="channelNameInput">CHANNEL NAME</label>
                    <div class="channel-name-input">
                        <span class="channel-prefix" id="channelPrefix">#</span>
                        <input type="text" id="channelNameInput" placeholder="new-channel" maxlength="100" required>
                    </div>
                    <p class="form-description">Use lowercase letters, numbers, hyphens, and underscores</p>
                    <div class="form-error" id="channelNameError"></div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeCreateChannelModal()">Cancel</button>
            <button type="button" class="btn-primary" id="createChannelBtn" onclick="createChannel()">Create Channel</button>
        </div>
    </div>
</div>