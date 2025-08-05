<!-- Confirmation Modal -->
<div class="modal hidden" id="confirmationModal">
    <div class="modal-overlay" onclick="closeConfirmationModal()"></div>
    <div class="modal-content small">
        <div class="modal-header">
            <h3 id="confirmationTitle">Confirm Action</h3>
            <button class="modal-close" onclick="closeConfirmationModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="confirmation-content">
                <div class="confirmation-icon" id="confirmationIcon">
                    <i class="fas fa-question-circle"></i>
                </div>
                <div class="confirmation-message">
                    <p id="confirmationMessage">Are you sure you want to proceed?</p>
                    <p class="confirmation-submessage" id="confirmationSubmessage"></p>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeConfirmationModal()">Cancel</button>
            <button type="button" class="btn-primary" id="confirmationActionBtn" onclick="executeConfirmationAction()">
                Confirm
            </button>
        </div>
    </div>
</div>

<!-- Leave Server Modal -->
<div class="modal hidden" id="leaveServerModal">
    <div class="modal-overlay" onclick="closeLeaveServerModal()"></div>
    <div class="modal-content">
        <div class="modal-header">
            <h3>Leave Server</h3>
            <button class="modal-close" onclick="closeLeaveServerModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="leave-server-content">
                <div class="server-leave-info" id="serverLeaveInfo">
                    <!-- Server info will be populated here -->
                </div>
                <div class="leave-warning" id="leaveWarning">
                    <p>Are you sure you want to leave <strong id="leaveServerName">this server</strong>?</p>
                    <p class="warning-text">You won't be able to rejoin this server unless you are re-invited.</p>
                </div>
                <div class="ownership-warning hidden" id="ownershipLeaveWarning">
                    <div class="warning-box error">
                        <i class="fas fa-crown"></i>
                        <div>
                            <h4>Cannot Leave Server</h4>
                            <p>You are the owner of this server. You must transfer ownership to another member before leaving, or delete the server if you are the only member.</p>
                        </div>
                    </div>
                </div>
                <div class="last-member-warning hidden" id="lastMemberWarning">
                    <div class="warning-box">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <h4>Delete Server Instead</h4>
                            <p>You are the last member of this server. Leaving will permanently delete the server and all its data.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeLeaveServerModal()">Cancel</button>
            <button type="button" class="btn-danger hidden" id="leaveServerBtn" onclick="leaveServer()">
                Leave Server
            </button>
            <button type="button" class="btn-danger hidden" id="deleteServerFromLeaveBtn" onclick="deleteServerFromLeave()">
                Delete Server
            </button>
        </div>
    </div>
</div>

<!-- Success/Error Toast Notifications -->
<div class="toast-container" id="toastContainer">
    <!-- Toast notifications will appear here -->
</div>