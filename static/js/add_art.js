document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addArtForm');
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const previewImage = document.getElementById('previewImage');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const changeImageBtn = document.getElementById('changeImageBtn');
    const submitBtn = document.getElementById('submitBtn');
    const redirectUrl = form.getAttribute('data-redirect');

    // ========== IMAGE UPLOAD LOGIC ==========

    // Click to upload
    uploadArea.addEventListener('click', (e) => {
        if (e.target !== changeImageBtn && !changeImageBtn.contains(e.target)) {
            imageInput.click();
        }
    });

    changeImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        imageInput.click();
    });

    // Handle file selection
    imageInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            handleFile(this.files[0]);
        }
    });

    // Drag and Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.add('drag-active'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('drag-active'), false);
    });

    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files && files.length > 0) {
            imageInput.files = files;
            handleFile(files[0]);
        }
    }

    function handleFile(file) {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];

        if (!validTypes.includes(file.type)) {
            showToast('Please select a valid image (PNG, JPG)', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            showToast('Image size must be less than 10MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
            uploadPlaceholder.style.opacity = '0';
            setTimeout(() => { uploadPlaceholder.style.display = 'none'; }, 300);
            changeImageBtn.style.display = 'block';
            uploadArea.classList.add('has-image');
            uploadArea.style.borderColor = '';
        };
        reader.readAsDataURL(file);
    }

    // ========== FORM SUBMISSION ==========

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        const originalText = btnText.textContent;

        // Loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';

        const formData = new FormData(form);
        formData.append('image', imageInput.files[0]);

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData
            });

            if (response.redirected) {
                showToast('Artwork published successfully!', 'success');
                setTimeout(() => {
                    window.location.href = response.url;
                }, 1000);
            } else {
                const text = await response.text();
                try {
                    const json = JSON.parse(text);
                    if (json.status === 'success') {
                        showToast('Artwork published successfully!', 'success');
                        setTimeout(() => {
                            window.location.href = redirectUrl;
                        }, 1000);
                    } else {
                        throw new Error(json.message || 'Error adding artwork');
                    }
                } catch (err) {
                    console.error('Response:', text);
                    showToast('Something went wrong. Please try again.', 'error');
                    resetButton();
                }
            }
        } catch (error) {
            console.error('Submission error:', error);
            showToast('Network error. Please try again.', 'error');
            resetButton();
        }

        function resetButton() {
            submitBtn.disabled = false;
            btnText.style.display = 'inline-block';
            btnText.textContent = originalText;
            btnLoader.style.display = 'none';
        }
    });

    function validateForm() {
        const title = document.getElementById('title');
        const price = document.getElementById('price');

        if (!title.value.trim()) {
            showToast('Title is required', 'error');
            title.focus();
            return false;
        }

        if (!price.value || parseFloat(price.value) < 0) {
            showToast('Please enter a valid price', 'error');
            price.focus();
            return false;
        }

        if (!imageInput.files || imageInput.files.length === 0) {
            showToast('Please upload an image of your artwork', 'error');
            uploadArea.style.borderColor = '#e74c3c';
            return false;
        }

        return true;
    }

    // ========== TOAST NOTIFICATION ==========

    function showToast(message, type = 'success') {
        // Remove existing toast
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    }

});
