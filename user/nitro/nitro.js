// Global variables
let isRedeeming = false;

// Initialize page
$(document).ready(function() {
    initializeEventListeners();
    formatCodeInput();
});

// Initialize event listeners
function initializeEventListeners() {
    // Code input formatting
    $('#nitroCode').on('input', function() {
        formatCodeInput();
    });

    // Redeem button
    $('#redeemBtn').on('click', function() {
        redeemCode();
    });

    // Enter key on code input
    $('#nitroCode').on('keypress', function(e) {
        if (e.which === 13) {
            redeemCode();
        }
    });

    // Modal close events
    $('.modal').on('click', function(e) {
        if (e.target === this) {
            closeAllModals();
        }
    });

    // Keyboard shortcuts
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// Format code input
function formatCodeInput() {
    const input = $('#nitroCode');
    let value = input.val().replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    // Limit to 16 characters
    if (value.length > 16) {
        value = value.substring(0, 16);
    }
    
    input.val(value);
}

// Redeem code
function redeemCode() {
    if (isRedeeming) return;
    
    const code = $('#nitroCode').val().trim();
    
    if (!code) {
        showToast('Please enter a code', 'error');
        return;
    }
    
    if (code.length !== 16) {
        showToast('Code must be 16 characters long', 'error');
        return;
    }
    
    isRedeeming = true;
    const btn = $('#redeemBtn');
    const originalText = btn.html();
    
    btn.prop('disabled', true).html('<span class="btn-icon">⏳</span>Redeeming...');
    
    $.ajax({
        url: 'nitro.php',
        method: 'POST',
        data: {
            action: 'redeem_code',
            code: code
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                // Show success modal with confetti
                showSuccessModal();
                triggerConfetti();
                
                // Clear the input
                $('#nitroCode').val('');
                
                showToast(response.message, 'success');
            } else {
                showToast(response.message, 'error');
            }
        },
        error: function() {
            showToast('Failed to redeem code. Please try again.', 'error');
        },
        complete: function() {
            isRedeeming = false;
            btn.prop('disabled', false).html(originalText);
        }
    });
}

// Show success modal
function showSuccessModal() {
    $('#successModal').addClass('active');
    $('body').css('overflow', 'hidden');
}

// Close success modal
function closeSuccessModal() {
    $('#successModal').removeClass('active');
    $('body').css('overflow', '');
}

// Show subscription modal
function showSubscriptionModal() {
    $('#subscriptionModal').addClass('active');
    $('body').css('overflow', 'hidden');
}

// Close subscription modal
function closeSubscriptionModal() {
    $('#subscriptionModal').removeClass('active');
    $('body').css('overflow', '');
}

// Close all modals
function closeAllModals() {
    $('.modal').removeClass('active');
    $('body').css('overflow', '');
}

// Trigger confetti animation
function triggerConfetti() {
    // Multiple confetti bursts for better effect
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Left side
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        }));

        // Right side
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        }));
    }, 250);

    // Additional burst from center
    setTimeout(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#7c3aed', '#a855f7', '#00d26a', '#ff6b9d', '#3498db']
        });
    }, 500);

    // Final burst
    setTimeout(() => {
        confetti({
            particleCount: 150,
            spread: 120,
            origin: { y: 0.4 },
            colors: ['#7c3aed', '#a855f7', '#00d26a', '#ff6b9d', '#3498db']
        });
    }, 1500);
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

// Add slide out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);