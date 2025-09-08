// Global variables for signup OTP
let signupCountdownTimer;
let signupCountdownSeconds = 600; // 10 minutes
let signupUserData = {};

// Function to initialize signup OTP functionality
function initializeOTPSignup() {
    console.log('Initializing OTP Signup functionality...');
    
    // DOM Elements - Search within modal content
    const modalContent = document.querySelector('#signupModal .modal-content');
    const userInfoStep = modalContent ? modalContent.querySelector('#userInfoStep') : null;
    const otpStep = modalContent ? modalContent.querySelector('#otpStep') : null;
    const successStep = modalContent ? modalContent.querySelector('#successStep') : null;
    const sendOtpBtn = modalContent ? modalContent.querySelector('#sendOtpBtn') : null;
    const verifyOtpBtn = modalContent ? modalContent.querySelector('#verifyOtpBtn') : null;
    const resendOtpBtn = modalContent ? modalContent.querySelector('#resendOtpBtn') : null;
    const backToSignupBtn = modalContent ? modalContent.querySelector('#backToSignupBtn') : null;
    const goToLoginBtn = modalContent ? modalContent.querySelector('#goToLoginBtn') : null;
    const userEmailSpan = modalContent ? modalContent.querySelector('#userEmail') : null;
    const countdownSpan = modalContent ? modalContent.querySelector('#countdown') : null;
    const otpInputs = modalContent ? modalContent.querySelectorAll('.otp-input') : [];

    // Check if we're on the signup page
    if (!userInfoStep || !otpStep || !successStep) {
        console.log('Signup OTP elements not found, not on signup page');
        console.log('userInfoStep:', !!userInfoStep);
        console.log('otpStep:', !!otpStep);
        console.log('successStep:', !!successStep);
        console.log('Modal content:', modalContent ? modalContent.innerHTML.substring(0, 200) + '...' : 'No modal content');
        return;
    }

    console.log('Signup OTP elements found, initializing...');

    // Define all functions that need access to DOM elements
    function initializeOtpInputs() {
        otpInputs.forEach((input, index) => {
            // Handle input
            input.addEventListener('input', function(e) {
                const value = e.target.value;
                
                // Only allow digits
                if (!/^\d*$/.test(value)) {
                    e.target.value = '';
                    return;
                }

                if (value.length === 1) {
                    // Move to next input
                    if (index < otpInputs.length - 1) {
                        otpInputs[index + 1].focus();
                    }
                    input.classList.add('filled');
                } else {
                    input.classList.remove('filled');
                }

                // Check if all inputs are filled
                checkOtpComplete();
            });

            // Handle backspace
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && e.target.value === '') {
                    if (index > 0) {
                        otpInputs[index - 1].focus();
                    }
                }
            });

            // Handle paste
            input.addEventListener('paste', function(e) {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text');
                const digits = pastedData.replace(/\D/g, '').slice(0, 6);
                
                if (digits.length === 6) {
                    otpInputs.forEach((input, i) => {
                        input.value = digits[i] || '';
                        input.classList.toggle('filled', digits[i] !== '');
                    });
                    checkOtpComplete();
                }
            });
        });
    }

    function checkOtpComplete() {
        const otp = Array.from(otpInputs).map(input => input.value).join('');
        verifyOtpBtn.disabled = otp.length !== 6;
    }

    function clearOtpInputs() {
        otpInputs.forEach(input => {
            input.value = '';
            input.classList.remove('filled', 'error');
        });
        verifyOtpBtn.disabled = true;
    }

    function showStep(stepElement) {
        // Hide all steps
        [userInfoStep, otpStep, successStep].forEach(step => {
            step.classList.remove('active');
            step.style.display = 'none';
        });

        // Show target step
        stepElement.classList.add('active');
        stepElement.style.display = 'block';
        stepElement.classList.add('step-transition');
        
        setTimeout(() => {
            stepElement.classList.remove('step-transition');
        }, 300);
    }

    function validateSignupForm() {
        const name = modalContent.querySelector('#name').value.trim();
        const email = modalContent.querySelector('#email').value.trim();
        const password = modalContent.querySelector('#password').value;
        const confirmPassword = modalContent.querySelector('#confirmPassword').value;

        // Clear previous errors
        modalContent.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        modalContent.querySelectorAll('.invalid-feedback').forEach(el => el.remove());

        let isValid = true;

        // Validate name
        if (!name) {
            showFieldError('name', 'Name is required');
            isValid = false;
        }

        // Validate email
        if (!email) {
            showFieldError('email', 'Email is required');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        }

        // Validate password
        if (!password) {
            showFieldError('password', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            showFieldError('password', 'Password must be at least 6 characters');
            isValid = false;
        }

        // Validate confirm password
        if (!confirmPassword) {
            showFieldError('confirmPassword', 'Please confirm your password');
            isValid = false;
        } else if (password !== confirmPassword) {
            showFieldError('confirmPassword', 'Passwords do not match');
            isValid = false;
        }

        return isValid;
    }

    function showFieldError(fieldId, message) {
        const field = modalContent.querySelector(`#${fieldId}`);
        field.classList.add('is-invalid');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    async function sendSignupOtp() {
        console.log('Send signup OTP function called');
        
        if (!validateSignupForm()) {
            return;
        }

        // Collect user data
        signupUserData = {
            name: modalContent.querySelector('#name').value.trim(),
            email: modalContent.querySelector('#email').value.trim(),
            password: modalContent.querySelector('#password').value
        };

        console.log('Sending signup OTP request to server...');

        // Disable button and show loading
        sendOtpBtn.disabled = true;
        sendOtpBtn.querySelector('.btn-text').style.display = 'none';
        sendOtpBtn.querySelector('.btn-loading').style.display = 'inline-block';

        try {
            const response = await fetch('/auth/send-signup-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: signupUserData.email,
                    name: signupUserData.name
                })
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (data.status === 'success') {
                userEmailSpan.textContent = signupUserData.email;
                showStep(otpStep);
                startCountdown();
                showSuccess('OTP sent successfully! Check your email.');
            } else {
                showError(data.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Error sending signup OTP:', error);
            showError('Network error. Please try again.');
        } finally {
            // Re-enable button
            sendOtpBtn.disabled = false;
            sendOtpBtn.querySelector('.btn-text').style.display = 'inline-block';
            sendOtpBtn.querySelector('.btn-loading').style.display = 'none';
        }
    }

    async function verifySignupOtp() {
        const otp = Array.from(otpInputs).map(input => input.value).join('');
        
        if (otp.length !== 6) {
            showError('Please enter the complete 6-digit OTP');
            return;
        }

        // Disable button and show loading
        verifyOtpBtn.disabled = true;
        verifyOtpBtn.querySelector('.btn-text').style.display = 'none';
        verifyOtpBtn.querySelector('.btn-loading').style.display = 'inline-block';

        try {
            const response = await fetch('/auth/verify-signup-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: signupUserData.email,
                    name: signupUserData.name,
                    password: signupUserData.password,
                    otp: otp 
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                showStep(successStep);
                showSuccess('Account created successfully!');
            } else {
                showError(data.message || 'Invalid OTP');
                // Highlight error inputs
                otpInputs.forEach(input => {
                    input.classList.add('error');
                });
                setTimeout(() => {
                    otpInputs.forEach(input => {
                        input.classList.remove('error');
                    });
                }, 2000);
            }
        } catch (error) {
            console.error('Error verifying signup OTP:', error);
            showError('Network error. Please try again.');
        } finally {
            // Re-enable button
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.querySelector('.btn-text').style.display = 'inline-block';
            verifyOtpBtn.querySelector('.btn-loading').style.display = 'none';
        }
    }

    async function resendSignupOtp() {
        resendOtpBtn.disabled = true;
        resendOtpBtn.textContent = 'Sending...';

        try {
            const response = await fetch('/auth/send-signup-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: signupUserData.email,
                    name: signupUserData.name
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                clearOtpInputs();
                startCountdown();
                showSuccess('New OTP sent successfully!');
            } else {
                showError(data.message || 'Failed to resend OTP');
            }
        } catch (error) {
            console.error('Error resending signup OTP:', error);
            showError('Network error. Please try again.');
        } finally {
            resendOtpBtn.disabled = false;
            resendOtpBtn.textContent = 'Resend OTP';
        }
    }

    function startCountdown() {
        signupCountdownSeconds = 600; // Reset to 10 minutes
        updateCountdownDisplay();
        
        signupCountdownTimer = setInterval(() => {
            signupCountdownSeconds--;
            updateCountdownDisplay();
            
            if (signupCountdownSeconds <= 0) {
                clearInterval(signupCountdownTimer);
                showResendButton();
            }
        }, 1000);
    }

    function updateCountdownDisplay() {
        const minutes = Math.floor(signupCountdownSeconds / 60);
        const seconds = signupCountdownSeconds % 60;
        countdownSpan.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function showResendButton() {
        modalContent.querySelector('#otpTimer').style.display = 'none';
        resendOtpBtn.style.display = 'block';
    }

    function backToSignup() {
        clearInterval(signupCountdownTimer);
        clearOtpInputs();
        showStep(userInfoStep);
    }

    function goToLogin() {
        // Close signup modal and open login modal
        const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
        if (signupModal) {
            signupModal.hide();
        }
        
        // Open login modal
        setTimeout(() => {
            const loginLink = document.querySelector('.login-link');
            if (loginLink) {
                loginLink.click();
            }
        }, 300);
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showSuccess(message) {
        console.log('Success:', message);
        alert(message);
    }

    function showError(message) {
        console.error('Error:', message);
        alert(message);
    }

    // Event Listeners
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', sendSignupOtp);
        console.log('Send signup OTP button listener added');
    }
    
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', verifySignupOtp);
        console.log('Verify signup OTP button listener added');
    }
    
    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', resendSignupOtp);
        console.log('Resend signup OTP button listener added');
    }
    
    if (backToSignupBtn) {
        backToSignupBtn.addEventListener('click', backToSignup);
        console.log('Back to signup button listener added');
    }
    
    if (goToLoginBtn) {
        goToLoginBtn.addEventListener('click', goToLogin);
        console.log('Go to login button listener added');
    }

    // Initialize OTP inputs
    initializeOtpInputs();
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('OTP Signup JavaScript loaded');
    initializeOTPSignup();
});

// Also initialize when modal content is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Watch for modal content changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if signup OTP content was added
                const signupContainer = document.querySelector('.signup-container');
                if (signupContainer) {
                    console.log('Signup OTP content detected, initializing...');
                    setTimeout(initializeOTPSignup, 100); // Small delay to ensure DOM is ready
                }
            }
        });
    });

    // Observe the signup form container
    const signupFormContainer = document.getElementById('signupFormContainer');
    if (signupFormContainer) {
        observer.observe(signupFormContainer, { childList: true, subtree: true });
    }
});

// Clean up timer when page is unloaded
window.addEventListener('beforeunload', () => {
    if (signupCountdownTimer) {
        clearInterval(signupCountdownTimer);
    }
}); 