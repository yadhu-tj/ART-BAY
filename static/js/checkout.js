document.addEventListener('DOMContentLoaded', () => {
    // Check for cart items
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cartItems.length === 0) {
        showToast('Your cart is empty!', 'error');
        setTimeout(() => window.location.href = '/cart', 3500);
        return;
    }

    // Initialize animations
    initFormAnimations();
    
    // Payment method selection
    document.querySelectorAll('.ab-payment-method').forEach(method => {
        method.addEventListener('click', () => {
            document.querySelectorAll('.ab-payment-method').forEach(m => 
                m.classList.remove('ab-active'));
            method.classList.add('ab-active');
        });
    });

    // Form submission
    document.getElementById('abShippingForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateForm()) {
            e.target.submit();
        }
    });

    // Modal handling
    document.getElementById('abBackToHome')?.addEventListener('click', () => {
        window.location.href = "{{ url_for('home') }}";
    });

    // Performance optimization
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('.ab-item-image img');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }
});

function initFormAnimations() {
    const formGroups = document.querySelectorAll('.ab-form-group');
    formGroups.forEach((group, index) => {
        setTimeout(() => {
            group.classList.add('ab-animate-in');
        }, 100 * index);
    });
}

function validateForm() {
    let isValid = true;
    const form = document.getElementById('abShippingForm');
    
    form.querySelectorAll('input, select').forEach(input => {
        if (!input.value) {
            input.style.borderColor = '#ff6b00';
            isValid = false;
            
            // Add shake animation
            input.classList.add('ab-shake');
            setTimeout(() => input.classList.remove('ab-shake'), 500);
        } else {
            input.style.borderColor = '#333';
        }
    });
    
    if (!isValid) {
        showToast('Please fill all required fields', 'error');
    }
    
    return isValid;
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `ab-toast-notification ab-${type}`;
    toast.innerHTML = `
        <div class="ab-toast-content">${message}</div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('ab-show'), 10);
    setTimeout(() => {
        toast.classList.remove('ab-show');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Add to CSS:
// .ab-shake { animation: abShake 0.5s ease; }
// @keyframes abShake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }