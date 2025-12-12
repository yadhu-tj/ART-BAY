document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('artist-signup-form');
    const messageDiv = document.getElementById('form-message');
    const BASE_URL = window.location.origin;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        messageDiv.style.display = 'none';
        messageDiv.classList.remove('success', 'error');

        const formData = new FormData(form);
        const fullName = formData.get('full_name').trim();
        const portfolio = formData.get('portfolio').trim();
        const bio = formData.get('bio').trim();
        const profilePic = formData.get('profile_pic');

        // Validation
        if (!fullName || fullName.length < 2) {
            showMessage('Please enter a valid artist name (minimum 2 characters).', 'error');
            return;
        }
        if (portfolio && !isValidUrl(portfolio)) {
            showMessage('Please enter a valid URL for your portfolio (or leave it blank).', 'error');
            return;
        }
        if (!bio || bio.length < 10) {
            showMessage('Please enter a bio with at least 10 characters.', 'error');
            return;
        }

        // New functionality integrated from the other code
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                // ✅ Success
                showMessage(data.message, 'success');
                form.reset();

                if (data.redirect) {
                    setTimeout(() => {
                        window.location.href = data.redirect;
                        // Clear any client-side session data if used
                        localStorage.clear(); // Optional: only if you're using localStorage
                    }, 2000);
                }
            } else {
                // ❌ Error from server
                showMessage(data.error || 'Something went wrong.', 'error');
            }
        } catch (error) {
            showMessage(error.message || 'Network error. Please try again.', 'error');
        }
    });

    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.classList.add(type);
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
            messageDiv.classList.remove(type);
        }, 5000);
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
});