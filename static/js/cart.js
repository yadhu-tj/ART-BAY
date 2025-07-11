document.addEventListener("DOMContentLoaded", function () {
    // Elements
    const cartItemsContainer = document.getElementById("cart-items");
    const cartSummary = document.getElementById("cart-summary");
    const loadingElement = document.getElementById("cart-loading");
    const totalPriceElement = document.querySelector(".cart-summary p.total-price");
    const checkoutForm = document.getElementById("checkout-form");
    const shippingForm = document.getElementById("shippingForm");
    const orderModal = document.getElementById("orderModal");
    const backToHomeBtn = document.getElementById("backToHome");

    // Show loading state
    function showLoading() {
        if(loadingElement) {
            loadingElement.style.display = "flex";
        }
        if(cartItemsContainer) {
            cartItemsContainer.style.display = "none";
        }
        if(cartSummary) {
            cartSummary.style.display = "none";
        }
    }

    // Hide loading state
    function hideLoading() {
        if(loadingElement) {
            loadingElement.style.display = "none";
        }
        if(cartItemsContainer) {
            cartItemsContainer.style.display = "flex";
        }
        if(cartSummary) {
            cartSummary.style.display = "block";
        }
    }

    // Fetch cart items
    function fetchCartItems() {
        if(!cartItemsContainer) {
            console.error("Cart items container not found");
            return;
        }
        
        showLoading();
        
        fetch("/cart/items", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            credentials: "include"
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch cart items (${response.status})`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Cart data received:", data); // Debug log
            
            if (data.status === "success") {
                const items = data.cart_items || [];
                const totalPrice = data.total_price || 
                                (items.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0));
                
                // Cache in localStorage
                localStorage.setItem('cart', JSON.stringify(items));
                console.log('Cached cart state:', items); // Debug log
                
                updateCartUI(items, totalPrice);
            } else {
                throw new Error(data.message || "Unknown error");
            }
        })
        .catch(error => {
            console.error("Error fetching cart:", error);
            showToast(`Error: ${error.message}`, "error", 5000);
            
            if(cartItemsContainer) {
                cartItemsContainer.innerHTML = `
                    <div class="empty-cart">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Failed to load your cart.</p>
                        <button onclick="window.location.reload()" class="retry-btn">Retry</button>
                    </div>`;
            }
            
            hideLoading();
        });
    }

    // Update cart UI
    function updateCartUI(cartItems, totalPrice) {
        if(!cartItemsContainer) return;
        
        cartItemsContainer.innerHTML = "";
        hideLoading();

        if (!cartItems || cartItems.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <p>Your art collection cart is empty.</p>
                    <a href="/gallery" class="checkout-btn" style="margin-top: 20px; padding: 12px 25px; font-size: 16px;">
                        <i class="fas fa-palette"></i> Explore Gallery
                    </a>
                </div>`;
            
            if(cartSummary) {
                cartSummary.style.display = "none";
            }
            localStorage.setItem('cart', JSON.stringify([]));
            return;
        }

        if(cartSummary) {
            cartSummary.style.display = "block";
        }
        
        cartItems.forEach((item, index) => {
            const cartItem = document.createElement("div");
            cartItem.classList.add("cart-item");
            
            const cartId = item.cart_id || '';
            cartItem.dataset.id = cartId;
            
            let imageSrc;
            if (item.image_path) {
                imageSrc = item.image_path.startsWith('/static/uploads/') 
                    ? item.image_path 
                    : `/static/uploads/${item.image_path.split('/').pop()}`;
            } else {
                imageSrc = "/static/images/placeholder.jpg";
            }

            cartItem.innerHTML = `
                <div class="cart-image">
                    <img src="${imageSrc}" alt="${item.title || 'Artwork'}">
                </div>
                <div class="cart-details">
                    <div class="cart-info">
                        <h2>${item.title || 'Untitled Artwork'}</h2>
                        <p class="artist">By ${item.artist_name || 'Unknown Artist'}</p>
                        <p class="price">₹${parseFloat(item.price).toLocaleString('en-IN')} <span class="qty">× ${item.quantity}</span></p>
                        <p class="subtotal">Subtotal: ₹${(parseFloat(item.price) * parseInt(item.quantity)).toLocaleString('en-IN')}</p>
                    </div>
                    <button class="remove-btn" data-cart-id="${cartId}">
                        <i class="fas fa-trash-alt"></i> Remove
                    </button>
                </div>
            `;

            cartItemsContainer.appendChild(cartItem);
            
            setTimeout(() => {
                cartItem.style.opacity = "0";
                cartItem.style.transform = "translateY(20px)";
                
                void cartItem.offsetWidth;
                
                cartItem.style.transition = "opacity 0.5s ease, transform 0.5s ease";
                cartItem.style.opacity = "1";
                cartItem.style.transform = "translateY(0)";
            }, index * 100);
        });

        updateTotalPrice(totalPrice);
    }

    // Update total price
    function updateTotalPrice(price) {
        if(!totalPriceElement) return;
        
        const validPrice = parseFloat(price) || 0;
        const currentPrice = parseFloat(totalPriceElement.textContent.replace(/[^\d.]/g, '')) || 0;
        
        animateNumber(currentPrice, validPrice, 700, value => {
            totalPriceElement.textContent = `Total: ₹${value.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        });
    }

    // Number animation
    function animateNumber(from, to, duration, callback) {
        const startTime = performance.now();
        
        function updateValue(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easedProgress = easeOutQuart(progress);
            const current = from + (to - from) * easedProgress;
            
            callback(current);
            
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        }
        
        requestAnimationFrame(updateValue);
    }

    // Easing function
    function easeOutQuart(x) {
        return 1 - Math.pow(1 - x, 4);
    }

    // Remove from cart
    function removeFromCart(cartId, cartItemElement) {
        if (!cartId) {
            console.error("Missing cart ID for removal");
            showToast("Error: Missing cart ID for removal", "error");
            return;
        }
        
        console.log("Removing item with cart ID:", cartId); // Debug log
        
        cartItemElement.classList.add('removing');
        
        const formData = new FormData();
        formData.append('cart_id', cartId);
        
        fetch("/cart/remove", {
            method: "POST",
            body: formData,
            credentials: "include"
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Failed to remove item (${response.status}): ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Remove response:", data); // Debug log
            
            showToast("Item removed from cart", "success");
            
            // Update localStorage
            let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
            cartItems = cartItems.filter(item => item.cart_id !== cartId);
            localStorage.setItem('cart', JSON.stringify(cartItems));
            console.log('Updated cart state:', cartItems); // Debug log
            
            setTimeout(() => {
                fetchCartItems();
            }, 500);
        })
        .catch(error => {
            console.error("Remove error:", error);
            
            cartItemElement.classList.remove('removing');
            showToast(`Error: ${error.message}`, "error");
        });
    }

    // Toast notification
    function showToast(message, type = "success", duration = 3500) {
        const existingToasts = document.querySelectorAll(".toast-notification");
        existingToasts.forEach(toast => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        });
        
        const toast = document.createElement("div");
        toast.className = `toast-notification ${type}`;
        
        let icon = type === "success" ? "check-circle" : "exclamation-circle";
        
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas fa-${icon}"></i></div>
            <div class="toast-content">${message}</div>
            <div class="toast-close"><i class="fas fa-times"></i></div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        const dismissTimeout = setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        const closeBtn = toast.querySelector(".toast-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                clearTimeout(dismissTimeout);
                toast.classList.remove("show");
                setTimeout(() => toast.remove(), 300);
            });
        }
    }

    // Modal functions
    function showModal() {
        if (orderModal) {
            orderModal.style.display = "flex";
            // Trigger reflow
            void orderModal.offsetWidth;
            // Add show class to start animations
            orderModal.classList.add("show");
        }
    }

    function hideModal() {
        if (orderModal) {
            orderModal.classList.remove("show");
            // Wait for animation to complete before hiding
            setTimeout(() => {
                orderModal.style.display = "none";
            }, 300);
        }
    }

    // Event delegation
    document.addEventListener("click", function(event) {
        // Remove button
        if (event.target.closest(".remove-btn")) {
            const removeBtn = event.target.closest(".remove-btn");
            const cartId = removeBtn.getAttribute("data-cart-id");
            const cartItem = removeBtn.closest(".cart-item");
            
            if (cartId && cartItem) {
                removeFromCart(cartId, cartItem);
            } else {
                console.error("Missing cart ID or cart item element");
                showToast("Error: Unable to identify cart item", "error");
            }
        }
        
        // Close modal when clicking outside
        if (event.target === orderModal) {
            hideModal();
        }
    });

    // Handle checkout form submission
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
            const email = document.getElementById('email_input') ? document.getElementById('email_input').value : '';
            
            console.log('Checkout form submitted, cart:', cartItems, 'email:', email); // Debug log
            
            if (cartItems.length === 0) {
                showToast('Your cart is empty!', 'error');
                setTimeout(() => {
                    window.location.href = '/cart';
                }, 1000);
                return;
            }

            // Populate form with cart data
            const cartItemsInput = document.getElementById('cart_items_input');
            if (cartItemsInput) {
                cartItemsInput.value = JSON.stringify(cartItems);
                checkoutForm.submit();
            } else {
                showToast('Error: Form not properly configured', 'error');
            }
        });
    }

    // Handle shipping form submission
    if (shippingForm) {
        shippingForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission
            
            const form = e.target;
            const formData = new FormData(form);
            
            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    // Show success modal
                    showModal();
                } else {
                    // Handle errors
                    const result = await response.json();
                    showToast(result.error || 'Failed to process shipping', "error");
                }
            } catch (error) {
                showToast('An error occurred. Please check your connection.', "error");
                console.error('Fetch error:', error);
            }
        });
    }

    // Back to home button event
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
    
    // Initialize
    fetchCartItems();
    
    // Make function available globally
    window.retryLoadCart = fetchCartItems;
});