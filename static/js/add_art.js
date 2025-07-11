document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addArtForm');
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('imagePreview');
    const submitBtn = document.getElementById('submitBtn');
    const redirectUrl = form.getAttribute('data-redirect');

    // Image preview
    imageInput.addEventListener('change', function () {
        imagePreview.innerHTML = '';
        const file = this.files[0];
        if (file && ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                imagePreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        } else {
            showError(imageInput, 'Please select a valid image (PNG, JPG, JPEG)');
        }
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        if (validateForm()) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Adding...';

            const formData = new FormData(form);
            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    showToast('Artwork added successfully!', 'success');
                    submitBtn.textContent = 'Redirecting...';
                    setTimeout(() => {
                        window.location.href = redirectUrl;
                    }, 1500);
                } else {
                    const errorText = await response.text();
                    showToast('Failed to add artwork. Please try again.', 'error');
                    console.error('Server error:', errorText);
                }
            } catch (error) {
                showToast('An error occurred. Please check your connection.', 'error');
                console.error('Fetch error:', error);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Add Artwork';
            }
        }
    });

    function validateForm() {
        let isValid = true;
        const title = document.getElementById('title');
        const price = document.getElementById('price');
        const image = document.getElementById('image');

        if (!title.value.trim()) {
            showError(title, 'Title is required');
            isValid = false;
        }

        if (!price.value || price.value <= 0) {
            showError(price, 'Price must be a positive number');
            isValid = false;
        }

        if (!image.files.length) {
            showError(image, 'Image is required');
            isValid = false;
        } else if (!['image/png', 'image/jpeg', 'image/jpg'].includes(image.files[0].type)) {
            showError(image, 'Only PNG, JPG, or JPEG images are allowed');
            isValid = false;
        }

        return isValid;
    }

    function showError(element, message) {
        element.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        element.parentNode.appendChild(errorDiv);
    }

    function clearErrors() {
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        document.querySelectorAll('.error-message').forEach(el => el.remove());
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('visible');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('visible');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }
});
