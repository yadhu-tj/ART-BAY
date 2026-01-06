document.addEventListener('DOMContentLoaded', () => {

    // ========== ADD TO CART ==========
    const acquireBtn = document.querySelector('.acquire-btn');

    if (acquireBtn) {
        acquireBtn.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const artId = btn.dataset.artId;
            const btnText = btn.querySelector('.btn-text');
            const btnLoader = btn.querySelector('.btn-loader');
            const originalText = btnText.textContent;

            // Loading state
            btn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';

            try {
                const response = await fetch('/cart/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ art_id: artId })
                });

                const result = await response.json();

                if (response.ok) {
                    // Success
                    btnLoader.style.display = 'none';
                    btnText.textContent = 'Added to Collection';
                    btnText.style.display = 'inline-block';
                    btn.classList.add('success');
                    showToast('Artwork added to your collection!', 'success');
                    updateCartCounter();

                    // Reset after delay
                    setTimeout(() => {
                        btnText.textContent = originalText;
                        btn.classList.remove('success');
                        btn.disabled = false;
                    }, 3000);
                } else {
                    throw new Error(result.message || 'Failed to add to cart');
                }
            } catch (error) {
                console.error('Cart error:', error);
                btnLoader.style.display = 'none';
                btnText.textContent = 'Error';
                btnText.style.display = 'inline-block';
                btn.classList.add('error');
                showToast(error.message, 'error');

                setTimeout(() => {
                    btnText.textContent = originalText;
                    btn.classList.remove('error');
                    btn.disabled = false;
                }, 2000);
            }
        });
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

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    }

    // ========== CART COUNTER UPDATE ==========
    function updateCartCounter() {
        const counter = document.querySelector('.cart-counter');
        if (counter) {
            fetch('/cart/count')
                .then(res => res.json())
                .then(data => {
                    counter.textContent = data.count;
                    counter.style.display = data.count > 0 ? 'flex' : 'none';
                })
                .catch(err => console.error('Cart count error:', err));
        }
    }

    // ========== KEYBOARD NAVIGATION ==========
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            const prevLink = document.querySelector('.nav-prev');
            if (prevLink) prevLink.click();
        } else if (e.key === 'ArrowRight') {
            const nextLink = document.querySelector('.nav-next');
            if (nextLink) nextLink.click();
        }
    });

});
