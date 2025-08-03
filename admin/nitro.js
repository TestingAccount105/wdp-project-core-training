// Global variables
let currentCodeId = null;
let currentCodeValue = null;
let selectedUserId = null;
let searchTimeout = null;

// Initialize page
$(document).ready(function() {
    initializeEventListeners();
});

// Initialize event listeners
function initializeEventListeners() {
    // User search with AJAX and Jaro-Winkler
    $('#userSearch').on('input', function() {
        const searchTerm = $(this).val().trim();
        
        clearTimeout(searchTimeout);
        
        if (searchTerm.length < 2) {
            hideSearchDropdown();
            return;
        }
        
        searchTimeout = setTimeout(() => {
            searchUsers(searchTerm);
        }, 300);
    });

    // Hide dropdown when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.user-search-container').length) {
            hideSearchDropdown();
        }
    });

    // User selection from dropdown
    $(document).on('click', '.user-option:not(.disabled)', function() {
        const userId = $(this).data('user-id');
        const username = $(this).data('username');
        const discriminator = $(this).data('discriminator');
        
        selectedUserId = userId;
        $('#userSearch').val(`${username}#${discriminator}`);
        hideSearchDropdown();
    });

    // Generate code button
    $('#generateBtn').on('click', function() {
        generateCode();
    });

    // Code search
    $('#codeSearch').on('input', debounce(function() {
        applySearch();
    }, 500));

    // Copy code buttons
    $(document).on('click', '.copy-btn', function() {
        const code = $(this).data('code');
        copyToClipboard(code);
    });

    // Delete buttons
    $(document).on('click', '.delete-btn', function() {
        const codeId = $(this).data('code-id');
        const code = $(this).data('code');
        showDeleteModal(codeId, code);
    });

    // Modal close buttons
    $('.modal-close').on('click', function() {
        const modal = $(this).closest('.modal');
        closeModal(modal.attr('id'));
    });

    // Modal background click
    $('.modal').on('click', function(e) {
        if (e.target === this) {
            closeModal($(this).attr('id'));
        }
    });

    // Confirm delete button
    $('#confirmDelete').on('click', function() {
        deleteCode(currentCodeId);
    });

    // Keyboard shortcuts
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
            hideSearchDropdown();
        }
    });
}

// Search users with Jaro-Winkler algorithm
function searchUsers(searchTerm) {
    $.ajax({
        url: 'nitro.php',
        method: 'POST',
        data: {
            action: 'search_users',
            search_term: searchTerm
        },
        dataType: 'json',
        success: function(response) {
            displaySearchResults(response.users);
        },
        error: function() {
            console.error('Error searching users');
            hideSearchDropdown();
        }
    });
}

// Display search results
function displaySearchResults(users) {
    const dropdown = $('#searchDropdown');
    dropdown.empty();
    
    if (users.length === 0) {
        dropdown.html('<div class="no-results">No users found</div>');
        showSearchDropdown();
        return;
    }
    
    users.forEach(user => {
        const hasNitro = parseInt(user.HasNitro) > 0;
        const isDisabled = hasNitro ? 'disabled' : '';
        
        const userOption = $(`
            <div class="user-option ${isDisabled}" 
                 data-user-id="${user.ID}" 
                 data-username="${user.Username}" 
                 data-discriminator="${user.Discriminator || '0000'}">
                <div class="user-avatar">
                    ${user.AvatarURL ? 
                        `<img src="${user.AvatarURL}" alt="Avatar">` : 
                        `<div class="avatar-placeholder">${user.Username.charAt(0).toUpperCase()}</div>`
                    }
                </div>
                <div class="user-details">
                    <div class="user-name">${user.Username}#${user.Discriminator || '0000'}</div>
                    <div class="user-email">${user.Email}</div>
                </div>
                ${hasNitro ? '<div class="nitro-badge">💎 Has Nitro 🔒</div>' : ''}
            </div>
        `);
        
        dropdown.append(userOption);
    });
    
    showSearchDropdown();
}

// Show/hide search dropdown
function showSearchDropdown() {
    $('#searchDropdown').addClass('active');
}

function hideSearchDropdown() {
    $('#searchDropdown').removeClass('active');
}

// Generate code
function generateCode() {
    const btn = $('#generateBtn');
    btn.prop('disabled', true).text('Generating...');
    
    $.ajax({
        url: 'nitro.php',
        method: 'POST',
        data: {
            action: 'generate_code',
            user_id: selectedUserId
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showToast(response.message, 'success');
                
                // Reset form
                $('#userSearch').val('');
                selectedUserId = null;
                hideSearchDropdown();
                
                // Refresh page to show new code
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showToast(response.message, 'error');
            }
        },
        error: function() {
            showToast('Failed to generate code. Please try again.', 'error');
        },
        complete: function() {
            btn.prop('disabled', false).text('Generate Code');
        }
    });
}

// Apply search
function applySearch() {
    const search = $('#codeSearch').val();
    
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    params.set('page', '1');
    
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.location.href = newUrl;
}

// Change page
function changePage(page) {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page);
    window.location.href = window.location.pathname + '?' + params.toString();
}

// Copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Code copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('Code copied to clipboard!', 'success');
    } catch (err) {
        showToast('Failed to copy code', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Show delete modal
function showDeleteModal(codeId, code) {
    currentCodeId = codeId;
    currentCodeValue = code;
    
    $('#deleteCodeValue').text(code);
    showModal('deleteModal');
}

// Show modal
function showModal(modalId) {
    $(`#${modalId}`).addClass('active');
    $('body').css('overflow', 'hidden');
}

// Close modal
function closeModal(modalId) {
    $(`#${modalId}`).removeClass('active');
    $('body').css('overflow', '');
    
    currentCodeId = null;
    currentCodeValue = null;
}

// Close all modals
function closeAllModals() {
    $('.modal').removeClass('active');
    $('body').css('overflow', '');
    currentCodeId = null;
    currentCodeValue = null;
}

// Delete code
function deleteCode(codeId) {
    if (!codeId) return;
    
    $.ajax({
        url: 'nitro.php',
        method: 'POST',
        data: {
            action: 'delete_code',
            code_id: codeId
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showToast(response.message, 'success');
                closeModal('deleteModal');
                
                // Remove the code row from the table
                removeCodeFromTable(codeId);
            } else {
                showToast(response.message, 'error');
            }
        },
        error: function() {
            showToast('Failed to delete code. Please try again.', 'error');
        }
    });
}

// Remove code from table
function removeCodeFromTable(codeId) {
    const row = $(`.delete-btn[data-code-id="${codeId}"]`).closest('tr');
    if (row.length) {
        row.fadeOut(300, function() {
            $(this).remove();
            
            // Update pagination info
            updatePaginationInfo();
            
            // If no codes left on current page, go to previous page
            const remainingRows = $('.codes-table tbody tr').length;
            if (remainingRows === 0 && window.location.search.includes('page=')) {
                const params = new URLSearchParams(window.location.search);
                const currentPage = parseInt(params.get('page')) || 1;
                if (currentPage > 1) {
                    changePage(currentPage - 1);
                } else {
                    window.location.reload();
                }
            }
        });
    }
}

// Update pagination info
function updatePaginationInfo() {
    const paginationInfo = $('.pagination-info');
    const remainingRows = $('.codes-table tbody tr').length;
    
    if (paginationInfo.length) {
        const currentText = paginationInfo.text();
        const match = currentText.match(/Showing \d+ of (\d+) codes/);
        if (match) {
            const total = parseInt(match[1]) - 1;
            paginationInfo.text(`Showing ${remainingRows} of ${total} codes`);
        }
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = $('#toastContainer');
    
    const toast = $(`<div class="toast ${type}">${message}</div>`);
    toastContainer.append(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.css('animation', 'toastSlideOut 0.3s ease forwards');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
    
    // Click to dismiss
    toast.on('click', function() {
        $(this).css('animation', 'toastSlideOut 0.3s ease forwards');
        setTimeout(() => {
            $(this).remove();
        }, 300);
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}