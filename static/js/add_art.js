document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addArtForm');
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const previewImage = document.getElementById('previewImage');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const imageActions = document.getElementById('imageActions');
    const changeImageBtn = document.getElementById('changeImageBtn');
    const submitBtn = document.getElementById('submitBtn');
    const redirectUrl = form.getAttribute('data-redirect');

    // --- Image Upload Logic ---

    // Trigger file input when clicking upload area (unless clicking change button)
    uploadArea.addEventListener('click', (e) => {
        if (e.target !== changeImageBtn && !changeImageBtn.contains(e.target)) {
            imageInput.click();
        }
    });

    changeImageBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent bubbling to uploadArea
        imageInput.click();
    });

    // Handle File Selection
    imageInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            handleFile(this.files[0]);
        }
    });

    // Drag & Drop Handling
    ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ;['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ;['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        uploadArea.classList.add('drag-active');
    }

    function unhighlight(e) {
        uploadArea.classList.remove('drag-active');
    }

    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files && files.length > 0) {
            imageInput.files = files; // Assign dropped files to input
            handleFile(files[0]);
        }
    }

    function handleFile(file) {
        if (['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewImage.style.display = 'block';
                uploadPlaceholder.style.opacity = '0'; // Fade out placeholder
                setTimeout(() => { uploadPlaceholder.style.display = 'none'; }, 300);
                imageActions.style.display = 'flex';

                // Remove error state if present
                uploadArea.style.borderColor = '';
            };
            reader.readAsDataURL(file);
        } else {
            showToast('Please select a valid image (PNG, JPG, JPEG)', 'error');
        }
    }

    // --- Form Submission Logic ---

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        submitBtn.disabled = true;
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';

        const formData = new FormData(form);

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData
            });

            // Handle response
            if (response.redirected) {
                showToast('Artwork added successfully! Redirecting...', 'success');
                window.location.href = response.url;
            } else {
                // Try to parse JSON error or fallback to text
                const text = await response.text();
                try {
                    const json = JSON.parse(text);
                    if (json.status === 'success') {
                        showToast('Artwork added successfully!', 'success');
                        window.location.href = redirectUrl;
                    } else {
                        showToast(json.message || 'Error adding artwork', 'error');
                    }
                } catch (err) {
                    // If it's HTML (flask flash message page), maybe just replace content or show generic error
                    // Usually for this app, we rely on redirects. If it didn't redirect, it's an error.
                    console.error("Server response:", text);
                    showToast('Something went wrong. Please check inputs.', 'error');
                }
            }
        } catch (error) {
            console.error('Submission error:', error);
            showToast('Network error. Please try again.', 'error');
        } finally {
            if (!response || !response.ok && !response.redirected) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
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
            uploadArea.style.borderColor = 'red';
            return false;
        }

        return true;
    }

    // --- Toast Notification Helpers ---
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.right = '30px';
        toast.style.backgroundColor = type === 'success' ? '#28a745' : '#dc3545';
        toast.style.color = 'white';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        toast.style.zIndex = '10000';
        toast.style.fontFamily = "'Inter', sans-serif";
        toast.style.fontSize = '0.95rem';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.3s ease';

        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> &nbsp; ${message}`;

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Remove after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3500);
    }
});
