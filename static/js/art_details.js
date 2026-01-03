document.addEventListener('DOMContentLoaded', () => {

    // --- Panel Hover Interaction (Supplemental to CSS) ---
    // The CSS :hover handles the main expansion, but we can add sound or subtle tilt here if desired.

    // --- Add to Cart Logic (Re-implemented for new button structure) ---
    const addToCartBtn = document.querySelector('.acquire-btn');

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const artId = btn.dataset.artId;
            const originalContent = btn.innerHTML;
            const btnText = btn.querySelector('span');

            // 1. Loading State
            btn.disabled = true;
            if (btnText) btnText.textContent = 'Processing...';
            btn.style.opacity = '0.7';

            try {
                const response = await fetch('/cart/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ art_id: artId })
                });

                const result = await response.json();

                if (response.ok) {
                    // 2. Success State
                    if (btnText) btnText.textContent = 'Acquired';
                    btn.style.background = '#2ecc71';
                    btn.style.color = 'white';

                    showToast('Artwork added to collection.', 'success');
                    updateCartCounter();

                    // Reset
                    setTimeout(() => {
                        btn.innerHTML = originalContent;
                        btn.style.background = '';
                        btn.style.color = '';
                        btn.style.opacity = '1';
                        btn.disabled = false;
                    }, 3000);

                } else {
                    throw new Error(result.message || 'Failed to add to cart');
                }
            } catch (error) {
                console.error('Error adding to cart:', error);
                if (btnText) btnText.textContent = 'Error';
                btn.style.background = '#e74c3c';
                showToast(error.message, 'error');

                setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 2000);
            }
        });
    }

    // --- Toast Notification ---
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            background: type === 'success' ? '#1a1a1a' : '#e74c3c',
            border: `1px solid ${type === 'success' ? '#2ecc71' : '#fff'}`,
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '4px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            zIndex: '1000',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'all 0.5s ease',
            fontFamily: '"Inter", sans-serif',
            fontSize: '0.9rem'
        });

        toast.innerHTML = type === 'success' ? `<span style="color:#2ecc71">●</span> &nbsp; ${message}` : `<span>●</span> &nbsp; ${message}`;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    function updateCartCounter() {
        const cartCounter = document.querySelector('.cart-counter');
        if (cartCounter) {
            fetch('/cart/count')
                .then(res => res.json())
                .then(data => {
                    cartCounter.textContent = data.count;
                })
                .catch(err => console.error('Failed to update cart count:', err));
        }
    }

    // --- Dynamic Spotlight Mouse Follow (Optional Polish) ---
    // Moves the main spotlight slightly with mouse for 'living' feel
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        const spotlight = document.querySelector('.spotlight-main');
        if (spotlight) {
            const moveX = (x - 0.5) * 20; // range -10 to 10%
            const moveY = (y - 0.5) * 20;
            spotlight.style.transform = `translate(calc(-50% + ${moveX}px), ${moveY}px)`;
        }
    });

});
