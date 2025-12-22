// Global variables for signup OTP
let signupCountdownTimer;
let signupCountdownSeconds = 600; // 10 minutes
let signupUserData = {};

// Function to initialize signup OTP functionality
function initializeOTPSignup() {
    console.log('Initializing OTP Signup functionality...');

    // DOM Elements - Search within modal content
    const modalContent = document.querySelector('#signupModal .modal-content');
    if (!modalContent) {
        console.warn('Signup modal content not found. Skipping initialization.');
        return;
    }

    const sendOtpBtn = modalContent.querySelector('#sendOtpBtn');

    // Gatekeeper: If the button doesn't exist, stop.
    if (!sendOtpBtn) {
        console.warn('Signup OTP button not found in modal content.');
        return;
    }

    // Remove old listener if it exists to prevent duplicates (cloning method)
    const newBtn = sendOtpBtn.cloneNode(true);
    sendOtpBtn.parentNode.replaceChild(newBtn, sendOtpBtn);
    const btn = newBtn; // Work with the new button

    const userInfoStep = modalContent.querySelector('#userInfoStep');
    const otpStep = modalContent.querySelector('#otpStep');
    const successStep = modalContent.querySelector('#successStep');
    const verifyOtpBtn = modalContent.querySelector('#verifyOtpBtn');
    const resendOtpBtn = modalContent.querySelector('#resendOtpBtn');
    const backToSignupBtn = modalContent.querySelector('#backToSignupBtn');
    const goToLoginBtn = modalContent.querySelector('#goToLoginBtn');
    const userEmailSpan = modalContent.querySelector('#userEmail');
    const countdownSpan = modalContent.querySelector('#countdown');
    const otpInputs = modalContent.querySelectorAll('.otp-input');

    // Check if we're on the signup page
    if (!userInfoStep || !otpStep || !successStep) {
        console.warn('Signup OTP steps not found.');
        return;
    }

    // Define all functions that need access to DOM elements
    function initializeOtpInputs() {
        otpInputs.forEach((input, index) => {
            // Remove old listeners by cloning
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);

            // Handle input
            newInput.addEventListener('input', function (e) {
                const value = e.target.value;

                // Only allow digits
                if (!/^\d*$/.test(value)) {
                    e.target.value = '';
                    return;
                }

                if (value.length === 1) {
                    // Move to next input
                    if (index < otpInputs.length - 1) {
                        // We need to re-query inputs since we cloned them? 
                        // Actually, cloning breaks the NodeList reference 'otpInputs' items.
                        // Better approach: Don't clone inputs, just remove listeners if possible?
                        // Or just live with potential duplicates if init is called twice?
                        // Given head.js logic, it shouldn't be called twice on same content.
                        // Let's revert input cloning and just attach.
                    }
                    // This logic is getting complex with cloning.
                    // Let's stick to the standard logic but assume init is called ONCE per modal load.
                }
            });
        });

        // Re-query inputs to be safe if we were to clone. 
        // But let's keep it simple: assume clean slate from head.js innerHTML replacement.
        modalContent.querySelectorAll('.otp-input').forEach((input, index, inputs) => {
            input.addEventListener('input', function (e) {
                const value = e.target.value;
                if (!/^\d*$/.test(value)) { e.target.value = ''; return; }
                if (value.length === 1) {
                    if (index < inputs.length - 1) inputs[index + 1].focus();
                    input.classList.add('filled');
                } else {
                    input.classList.remove('filled');
                }
                checkOtpComplete();
            });

            input.addEventListener('keydown', function (e) {
                if (e.key === 'Backspace' && e.target.value === '') {
                    if (index > 0) inputs[index - 1].focus();
                }
            });

            input.addEventListener('paste', function (e) {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text');
                const digits = pastedData.replace(/\D/g, '').slice(0, 6);
                if (digits.length === 6) {
                    inputs.forEach((inp, i) => {
                        inp.value = digits[i] || '';
                        inp.classList.toggle('filled', digits[i] !== '');
                    });
                    checkOtpComplete();
                }
            });
        });
    }

    function checkOtpComplete() {
        const currentInputs = modalContent.querySelectorAll('.otp-input');
        const otp = Array.from(currentInputs).map(input => input.value).join('');
        if (verifyOtpBtn) verifyOtpBtn.disabled = otp.length !== 6;
    }

    function clearOtpInputs() {
        modalContent.querySelectorAll('.otp-input').forEach(input => {
            input.value = '';
            input.classList.remove('filled', 'error');
        });
        if (verifyOtpBtn) verifyOtpBtn.disabled = true;
    }

    function showStep(stepElement) {
        // Hide all steps
        if (userInfoStep) { userInfoStep.classList.remove('active'); userInfoStep.style.display = 'none'; }
        if (otpStep) { otpStep.classList.remove('active'); otpStep.style.display = 'none'; }
        if (successStep) { successStep.classList.remove('active'); successStep.style.display = 'none'; }

        // Show target step
        if (stepElement) {
            stepElement.classList.add('active');
            stepElement.style.display = 'block';
            stepElement.classList.add('step-transition');
            setTimeout(() => stepElement.classList.remove('step-transition'), 300);
        }
    }

    function validateSignupForm() {
        // IDs updated to be unique (prefixed with signup-)
        const nameInput = modalContent.querySelector('#signup-name');
        const emailInput = modalContent.querySelector('#signup-email');
        const passInput = modalContent.querySelector('#signup-password');
        const confirmInput = modalContent.querySelector('#signup-confirmPassword');

        if (!nameInput || !emailInput || !passInput || !confirmInput) {
            console.error('Signup form inputs not found!');
            return false;
        }

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passInput.value;
        const confirmPassword = confirmInput.value;

        // Clear previous errors
        modalContent.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        modalContent.querySelectorAll('.invalid-feedback').forEach(el => el.remove());

        let isValid = true;

        if (!name) { showFieldError('signup-name', 'Name is required'); isValid = false; }
        if (!email) { showFieldError('signup-email', 'Email is required'); isValid = false; }
        else if (!isValidEmail(email)) { showFieldError('signup-email', 'Please enter a valid email address'); isValid = false; }

        if (!password) { showFieldError('signup-password', 'Password is required'); isValid = false; }
        else if (password.length < 6) { showFieldError('signup-password', 'Password must be at least 6 characters'); isValid = false; }

        if (!confirmPassword) { showFieldError('signup-confirmPassword', 'Please confirm your password'); isValid = false; }
        else if (password !== confirmPassword) { showFieldError('signup-confirmPassword', 'Passwords do not match'); isValid = false; }

        return isValid;
    }

    function showFieldError(fieldId, message) {
        const field = modalContent.querySelector(`#${fieldId}`);
        if (!field) return;

        field.classList.add('is-invalid');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    async function sendSignupOtp() {
        console.log('Send signup OTP clicked');

        if (!validateSignupForm()) {
            console.log('Validation failed');
            return;
        }

        signupUserData = {
            name: modalContent.querySelector('#signup-name').value.trim(),
            email: modalContent.querySelector('#signup-email').value.trim(),
            password: modalContent.querySelector('#signup-password').value
        };

        // Disable button and show loading
        btn.disabled = true;
        const btnText = btn.querySelector('.btn-text');
        const btnLoading = btn.querySelector('.btn-loading');
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline-block';

        try {
            const response = await fetch('/auth/send-signup-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: signupUserData.email,
                    name: signupUserData.name
                })
            });

            const data = await response.json();
            console.log('OTP Response:', data);

            if (data.status === 'success') {
                if (userEmailSpan) userEmailSpan.textContent = signupUserData.email;
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
            btn.disabled = false;
            if (btnText) btnText.style.display = 'inline-block';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }

    // ... (Verify OTP, Resend, etc. similar logic) ...

    async function verifySignupOtp() {
        const currentInputs = modalContent.querySelectorAll('.otp-input');
        const otp = Array.from(currentInputs).map(input => input.value).join('');

        if (otp.length !== 6) { showError('Please enter the complete 6-digit OTP'); return; }

        if (verifyOtpBtn) {
            verifyOtpBtn.disabled = true;
            const vtText = verifyOtpBtn.querySelector('.btn-text');
            const vtLoad = verifyOtpBtn.querySelector('.btn-loading');
            if (vtText) vtText.style.display = 'none';
            if (vtLoad) vtLoad.style.display = 'inline-block';
        }

        try {
            const response = await fetch('/auth/verify-signup-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                currentInputs.forEach(input => input.classList.add('error'));
                setTimeout(() => currentInputs.forEach(input => input.classList.remove('error')), 2000);
            }
        } catch (error) {
            console.error('Error verifying signup OTP:', error);
            showError('Network error. Please try again.');
        } finally {
            if (verifyOtpBtn) {
                verifyOtpBtn.disabled = false;
                const vtText = verifyOtpBtn.querySelector('.btn-text');
                const vtLoad = verifyOtpBtn.querySelector('.btn-loading');
                if (vtText) vtText.style.display = 'inline-block';
                if (vtLoad) vtLoad.style.display = 'none';
            }
        }
    }

    async function resendSignupOtp() {
        if (!resendOtpBtn) return;
        resendOtpBtn.disabled = true;
        resendOtpBtn.textContent = 'Sending...';

        try {
            const response = await fetch('/auth/send-signup-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        clearInterval(signupCountdownTimer);
        signupCountdownSeconds = 600;
        updateCountdownDisplay();

        const timerDiv = modalContent.querySelector('#otpTimer');
        if (timerDiv) timerDiv.style.display = 'block';
        if (resendOtpBtn) resendOtpBtn.style.display = 'none';

        signupCountdownTimer = setInterval(() => {
            signupCountdownSeconds--;
            updateCountdownDisplay();

            if (signupCountdownSeconds <= 0) {
                clearInterval(signupCountdownTimer);
                if (timerDiv) timerDiv.style.display = 'none';
                if (resendOtpBtn) resendOtpBtn.style.display = 'block';
            }
        }, 1000);
    }

    function updateCountdownDisplay() {
        if (!countdownSpan) return;
        const minutes = Math.floor(signupCountdownSeconds / 60);
        const seconds = signupCountdownSeconds % 60;
        countdownSpan.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function backToSignup() {
        clearInterval(signupCountdownTimer);
        clearOtpInputs();
        showStep(userInfoStep);
    }

    function goToLogin() {
        const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
        if (signupModal) signupModal.hide();
        setTimeout(() => {
            const loginLink = document.querySelector('.login-link');
            if (loginLink) loginLink.click();
        }, 300);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showSuccess(message) {
        console.log('Success:', message);
        // Assuming there is a global showMessage or using alert for now
        if (window.showMessage) window.showMessage(message, 'success');
        else alert(message);
    }

    function showError(message) {
        console.error('Error:', message);
        if (window.showMessage) window.showMessage(message, 'error');
        else alert(message);
    }

    // Attach Listeners to the NEW cloned elements
    btn.addEventListener('click', sendSignupOtp);
    if (verifyOtpBtn) verifyOtpBtn.addEventListener('click', verifySignupOtp);
    if (resendOtpBtn) resendOtpBtn.addEventListener('click', resendSignupOtp);
    if (backToSignupBtn) backToSignupBtn.addEventListener('click', backToSignup);
    if (goToLoginBtn) goToLoginBtn.addEventListener('click', goToLogin);

    initializeOtpInputs();
    console.log('OTP Signup initialized successfully.');
}

// Global initialization hook (called by head.js)
window.initializeOTPSignup = initializeOTPSignup;

// No more MutationObserver here since head.js handles the loading callback.