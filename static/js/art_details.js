document.addEventListener('DOMContentLoaded', () => {

    // --- Add to Cart Logic ---
    const addToCartBtn = document.querySelector('.add-to-cart-btn');

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const artId = btn.dataset.artId;
            const originalContent = btn.innerHTML;
            const btnText = btn.querySelector('span');
            const btnIcon = btn.querySelector('i');

            // 1. Loading State
            btn.disabled = true;
            btn.style.opacity = '0.8';
            if (btnText) btnText.textContent = 'Acquiring...';
            if (btnIcon) btnIcon.className = 'fas fa-spinner fa-spin';

            try {
                const response = await fetch('/cart/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ art_id: artId })
                });

                const result = await response.json();

                if (response.ok) {
                    // 2. Success State
                    if (btnText) btnText.textContent = 'Added to Collection';
                    if (btnIcon) btnIcon.className = 'fas fa-check';

                    btn.classList.add('success-anim'); // Add a class for CSS animations if needed
                    btn.style.background = '#2ecc71';
                    btn.style.color = 'white';
                    btn.style.borderColor = '#2ecc71';

                    // 3. Feedback: Toast & Cart Update
                    showToast('Masterpiece added to your collection.', 'success');
                    updateCartCounter();

                    // Optional: Reset button after a delay
                    setTimeout(() => {
                        btn.innerHTML = originalContent; // Restore original structure
                        btn.style.background = ''; // Revert styles
                        btn.style.color = '';
                        btn.style.borderColor = '';
                        btn.classList.remove('success-anim');
                        btn.disabled = false;
                        btn.style.opacity = '1';
                    }, 3000);

                } else {
                    throw new Error(result.message || 'Failed to add to cart');
                }
            } catch (error) {
                console.error('Error adding to cart:', error);

                // Error State
                if (btnText) btnText.textContent = 'Error';
                if (btnIcon) btnIcon.className = 'fas fa-times';
                btn.style.background = '#e74c3c';

                showToast(error.message, 'error');

                // Reset
                setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.style.background = '';
                    btn.disabled = false;
                    btn.style.opacity = '1';
                }, 2000);
            }
        });
    }

    // --- Interactive Elements ---

    // Parallax / Tilt Effect for Main Image
    const visualStage = document.querySelector('.art-visual-stage');
    const mainImage = document.getElementById('mainArtImage');

    if (visualStage && mainImage) {
        visualStage.addEventListener('mousemove', (e) => {
            const { offsetWidth: width, offsetHeight: height } = visualStage;
            const { offsetX: x, offsetY: y } = e;

            const moveX = (x / width - 0.5) * 20; // -10 to 10
            const moveY = (y / height - 0.5) * 20;

            mainImage.style.transform = `perspective(1000px) rotateY(${moveX * 0.5}deg) rotateX(${-moveY * 0.5}deg) scale(1.02)`;
        });

        visualStage.addEventListener('mouseleave', () => {
            mainImage.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) scale(1)';
        });
    }

    // --- Utility Functions ---

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        // Basic toast styles injected here if not in CSS, 
        // but ideally they should be in CSS. We'll add inline for safety/portability.
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            background: type === 'success' ? '#2ecc71' : '#e74c3c',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            zIndex: '1000',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        });

        toast.innerHTML = type === 'success' ? `<i class="fas fa-check-circle"></i> ${message}` : `<i class="fas fa-exclamation-circle"></i> ${message}`;

        document.body.appendChild(toast);

        // Animate In
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    function updateCartCounter() {
        const cartCounter = document.querySelector('.cart-counter');
        // Trying to find a common cart counter in navbar
        if (cartCounter) {
            fetch('/cart/count')
                .then(res => res.json())
                .then(data => {
                    cartCounter.textContent = data.count;
                    // Pulse animation
                    cartCounter.animate([
                        { transform: 'scale(1)' },
                        { transform: 'scale(1.5)' },
                        { transform: 'scale(1)' }
                    ], { duration: 300 });
                })
                .catch(err => console.error('Failed to update cart count:', err));
        }
    }

});
