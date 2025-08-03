// Page navigation
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    
    // Clear form errors
    const errorMessages = document.querySelectorAll('.error-message, .success-message');
    errorMessages.forEach(msg => msg.remove());
}

// Password toggle functionality
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
            </svg>
        `;
    } else {
        input.type = 'password';
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
        `;
    }
}

// Refresh CAPTCHA
function refreshCaptcha() {
    fetch('refresh-captcha.php')
        .then(response => response.text())
        .then(data => {
            document.getElementById('captcha-text').textContent = data;
        })
        .catch(error => {
            console.error('Error refreshing CAPTCHA:', error);
        });
}

// Password strength calculation based on requirements
function calculatePasswordStrength(password) {
    let score = 0;
    
    // Length: 4 points per character (max 40 points)
    const lengthScore = Math.min(password.length * 4, 40);
    score += lengthScore;
    
    // Uppercase Letter: +15 points (if at least one exists)
    if (/[A-Z]/.test(password)) {
        score += 15;
    }
    
    // Lowercase Letter: +10 points (if at least one exists)
    if (/[a-z]/.test(password)) {
        score += 10;
    }
    
    // Digit (0-9): +15 points (if at least one exists)
    if (/[0-9]/.test(password)) {
        score += 15;
    }
    
    // Special Character (non-alphanumeric): +20 points (if at least one exists)
    if (/[^a-zA-Z0-9]/.test(password)) {
        score += 20;
    }
    
    // Cap at 100%
    return Math.min(score, 100);
}

function updatePasswordStrength(password) {
    const strength = calculatePasswordStrength(password);
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    // Update percentage text
    strengthText.textContent = strength + '%';
    
    // Update bar width and color
    strengthBar.style.width = strength + '%';
    
    // Color coding based on strength
    if (strength < 30) {
        strengthBar.style.background = '#ef4444'; // Red
        strengthText.style.color = '#ef4444';
    } else if (strength < 50) {
        strengthBar.style.background = '#f97316'; // Orange
        strengthText.style.color = '#f97316';
    } else if (strength < 70) {
        strengthBar.style.background = '#eab308'; // Yellow
        strengthText.style.color = '#eab308';
    } else if (strength < 90) {
        strengthBar.style.background = '#22c55e'; // Light Green
        strengthText.style.color = '#22c55e';
    } else {
        strengthBar.style.background = '#16a34a'; // Dark Green
        strengthText.style.color = '#16a34a';
    }
}

// Form validation and enhancement
document.addEventListener('DOMContentLoaded', function() {
    // Password strength monitoring
    const registerPassword = document.getElementById('register-password');
    if (registerPassword) {
        registerPassword.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    }
    
    // Form submission handling
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton && !submitButton.disabled) {
                submitButton.disabled = true;
                submitButton.classList.add('loading');
                const originalText = submitButton.textContent;
                submitButton.textContent = 'Please wait...';
                
                // Re-enable button after 5 seconds in case of error
                setTimeout(() => {
                    submitButton.disabled = false;
                    submitButton.classList.remove('loading');
                    submitButton.textContent = originalText;
                }, 5000);
            }
        });
    });
    
    // Real-time password confirmation validation
    const confirmPassword = document.getElementById('confirm-password');
    const registerPasswordField = document.getElementById('register-password');
    
    if (confirmPassword && registerPasswordField) {
        function validatePasswordMatch() {
            if (confirmPassword.value && registerPasswordField.value) {
                if (confirmPassword.value === registerPasswordField.value) {
                    confirmPassword.style.borderColor = '#22c55e';
                } else {
                    confirmPassword.style.borderColor = '#ef4444';
                }
            } else {
                confirmPassword.style.borderColor = 'rgba(99, 102, 241, 0.4)';
            }
        }
        
        confirmPassword.addEventListener('input', validatePasswordMatch);
        registerPasswordField.addEventListener('input', validatePasswordMatch);
    }
    
    // Email validation
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value && !emailRegex.test(this.value)) {
                this.style.borderColor = '#ef4444';
            } else {
                this.style.borderColor = 'rgba(99, 102, 241, 0.4)';
            }
        });
    });
    
    // Auto-focus first input on page change
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('active')) {
                    const firstInput = target.querySelector('input:not([type="hidden"])');
                    if (firstInput) {
                        setTimeout(() => firstInput.focus(), 100);
                    }
                }
            }
        });
    });
    
    document.querySelectorAll('.page').forEach(page => {
        observer.observe(page, { attributes: true });
    });
});

// Clear registration data function
function clearRegistrationData() {
    fetch('clear-registration.php', {
        method: 'POST'
    }).then(() => {
        window.location.reload();
    }).catch(error => {
        console.error('Error clearing registration data:', error);
        window.location.reload();
    });
}

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    // ESC key to go back to login
    if (e.key === 'Escape') {
        showPage('login-page');
    }
    
    // Enter key to submit forms
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        const form = e.target.closest('form');
        if (form) {
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton && !submitButton.disabled) {
                submitButton.click();
            }
        }
    }
});

// Prevent form resubmission on page refresh
if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}