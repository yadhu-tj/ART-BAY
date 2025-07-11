document.addEventListener('DOMContentLoaded', function () {
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');

    // Utility to show error message
    const showError = (id) => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('d-none');
    };

    // Utility to hide all error messages
    const clearErrors = () => {
        document.querySelectorAll('.error').forEach(error => {
            error.classList.add('d-none');
        });
    };

    // SIGNUP VALIDATION
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();
            let isValid = true;
            clearErrors();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const passwordRegex = /^(?=.*\d).{8,}$/;

            if (name.length < 2) {
                showError('nameError');
                isValid = false;
            }

            if (!emailRegex.test(email)) {
                showError('emailError');
                isValid = false;
            }

            if (!passwordRegex.test(password)) {
                showError('passwordError');
                isValid = false;
            }

            if (password !== confirmPassword) {
                showError('confirmPasswordError');
                isValid = false;
            }

            if (isValid) {
                signupForm.submit(); // proceed to server
            }
        });
    }

    // LOGIN FORM (basic client-side check)
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                e.preventDefault(); // block form submission
                alert('Please enter both email and password.');
            }
        });
    }
});
