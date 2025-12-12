// Function to initialize Login functionality
function initializeOTPLogin() {
    console.log('Initializing Login functionality...');
    
    // DOM Elements - Search within modal content
    const modalContent = document.querySelector('#loginModal .modal-content');
    const loginStep = modalContent ? modalContent.querySelector('#loginStep') : null;
    const loginForm = modalContent ? modalContent.querySelector('#loginForm') : null;
    const emailInput = modalContent ? modalContent.querySelector('#email') : null;
    const passwordInput = modalContent ? modalContent.querySelector('#password') : null;
    const submitBtn = modalContent ? modalContent.querySelector('button[type="submit"]') : null;

    // Check if we're on the login page
    if (!loginStep || !loginForm) {
        console.log('Login elements not found, not on login page');
        return;
    }

    console.log('Login elements found, initializing...');

    // Form validation
    function validateForm() {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Clear previous errors
        clearErrors();
        
        let isValid = true;
        
        // Email validation
        if (!email) {
            showFieldError(emailInput, 'Email is required');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showFieldError(emailInput, 'Please enter a valid email address');
            isValid = false;
        }
        
        // Password validation
        if (!password) {
            showFieldError(passwordInput, 'Password is required');
            isValid = false;
        }
        
        return isValid;
    }

    function showFieldError(field, message) {
        field.classList.add('is-invalid');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    function clearErrors() {
        const invalidFields = loginForm.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => {
            field.classList.remove('is-invalid');
        });
        
        const errorMessages = loginForm.querySelectorAll('.invalid-feedback');
        errorMessages.forEach(error => error.remove());
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showLoading() {
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-block';
        submitBtn.disabled = true;
    }

    function hideLoading() {
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        btnText.style.display = 'inline-block';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }

    function showSuccess(message) {
        // Create success message
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success mt-3';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${message}
        `;
        
        loginForm.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    function showError(message) {
        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            ${message}
        `;
        
        loginForm.appendChild(errorDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Form submission handler
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        showLoading();
        
        try {
            const formData = new FormData(loginForm);
            const response = await fetch('/auth/login', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showSuccess('Login successful! Redirecting...');
                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = result.redirect || '/';
                }, 1000);
            } else {
                showError(result.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('An error occurred. Please try again.');
        } finally {
            hideLoading();
        }
    });

    // Real-time validation
    emailInput.addEventListener('blur', function() {
        const email = this.value.trim();
        if (email && !isValidEmail(email)) {
            showFieldError(this, 'Please enter a valid email address');
        } else {
            this.classList.remove('is-invalid');
            const errorDiv = this.parentNode.querySelector('.invalid-feedback');
            if (errorDiv) errorDiv.remove();
        }
    });

    passwordInput.addEventListener('blur', function() {
        const password = this.value.trim();
        if (!password) {
            showFieldError(this, 'Password is required');
        } else {
            this.classList.remove('is-invalid');
            const errorDiv = this.parentNode.querySelector('.invalid-feedback');
            if (errorDiv) errorDiv.remove();
        }
    });

    // Clear errors on input
    emailInput.addEventListener('input', function() {
        this.classList.remove('is-invalid');
        const errorDiv = this.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) errorDiv.remove();
    });

    passwordInput.addEventListener('input', function() {
        this.classList.remove('is-invalid');
        const errorDiv = this.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) errorDiv.remove();
    });
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login JavaScript loaded');
    initializeOTPLogin();
});

// Also initialize when modal content is loaded
document.addEventListener('DOMContentLoaded', function() {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                const loginContainer = document.querySelector('.login-container');
                if (loginContainer) {
                    console.log('Login content detected, initializing...');
                    setTimeout(initializeOTPLogin, 100);
                }
            }
        });
    });
    
    const loginFormContainer = document.getElementById('loginFormContainer');
    if (loginFormContainer) {
        observer.observe(loginFormContainer, { childList: true, subtree: true });
    }
});
 