document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const filters = document.querySelectorAll('.filter');
    const galleryGrid = document.getElementById('gallery-grid');
    const searchInput = document.getElementById('search-filter');
    const filterBtn = document.querySelector('.filter-btn');
    const filterDropdown = document.querySelector('.filter-dropdown');

    // Filter Dropdown Toggle with smooth animation
    if (filterBtn && filterDropdown) {
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.classList.toggle('show');
            
            // Change the button arrow direction
            if (filterDropdown.classList.contains('show')) {
                filterBtn.style.transform = 'translateY(2px)';
            } else {
                filterBtn.style.transform = 'translateY(0)';
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
                filterDropdown.classList.remove('show');
                filterBtn.style.transform = 'translateY(0)';
            }
        });

        // Prevent dropdown from closing when clicking inside
        filterDropdown.addEventListener('click', (e) => e.stopPropagation());
    }

    // Delegate click events for gallery interactions
    document.addEventListener('click', (e) => {
        // View artwork details
        if (e.target.classList.contains('view-btn')) {
            viewArtwork(e.target.dataset.artId);
        }
        
        // Add to cart functionality
        if (e.target.classList.contains('add-cart-btn')) {
            addToCart(e.target.dataset.artId, e.target);
        }
        
        // Image click for quick view
        if (e.target.matches('.gallery-item img')) {
            viewArtwork(e.target.dataset.artId);
        }
    });

    // Fetch filtered artworks with loading state
    function fetchFilteredArtworks() {
        // Show loading state
        galleryGrid.innerHTML = '<div class="art-loading"></div>';
        
        // Collect filter data
        const filterData = {
            sort: document.getElementById('sort-filter')?.value || "newest",
            price: document.getElementById('price-filter')?.value || "",
            media: document.getElementById('media-filter')?.value || "",
            search: searchInput?.value.trim() || ""
        };

        // API request
        fetch('/art/filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filterData)
        })
        .then(res => {
            if (!res.ok) {
                throw new Error('Server response error');
            }
            return res.json();
        })
        .then(data => {
            updateGallery(data.artworks);
            filterDropdown.classList.remove('show'); // Close dropdown after apply
            filterBtn.style.transform = 'translateY(0)';
        })
        .catch(err => {
            console.error('Fetch error:', err);
            galleryGrid.innerHTML = `
                <div class="error-message">
                    <p>Failed to load artworks. Please try again later.</p>
                    <button onclick="fetchFilteredArtworks()" class="view-btn">Retry</button>
                </div>`;
        });
    }

    // Update gallery with staggered fade-in animation
    function updateGallery(artworks) {
        galleryGrid.innerHTML = '';

        if (!artworks || artworks.length === 0) {
            galleryGrid.innerHTML = `<p class="no-results">No artworks found matching your criteria.</p>`;
            return;
        }

        // Create and append each artwork with staggered animation
        artworks.forEach((artwork, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.dataset.date = artwork.created_at;
            item.dataset.price = artwork.price;
            item.dataset.media = artwork.category;

            const imageSrc = `/static/uploads/${artwork.image_path.split('/').pop()}`;
            const artistName = artwork.artist_name || artwork.email;

            item.innerHTML = `
                <img src="${imageSrc}" alt="${artwork.title}" data-art-id="${artwork.art_id}">
                <div class="item-info">
                    <h3>${artwork.title}</h3>
                    <p class="description">${artwork.description || 'No description available'}</p>
                    <p class="price">$${artwork.price}</p>
                    <p class="artist">Artist: ${artistName}</p>
                    <div class="btn-container">
                        <button class="view-btn" data-art-id="${artwork.art_id}">View Details</button>
                        <button class="add-cart-btn" data-art-id="${artwork.art_id}">Add to Cart</button>
                    </div>
                </div>
            `;

            // Set initial opacity to 0
            item.style.opacity = 0;
            item.style.transform = 'translateY(20px)';
            galleryGrid.appendChild(item);
            
            // Stagger the fade-in animations
            setTimeout(() => {
                item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                item.style.opacity = 1;
                item.style.transform = 'translateY(0)';
            }, index * 100); // Stagger by 100ms per item
        });
    }

    // View artwork details
    function viewArtwork(artId) {
        if (!artId) return showToast('Artwork ID not found', 'error');
        
        // Add a subtle loading effect before navigation
        document.body.style.cursor = 'wait';
        
        // Navigate to artwork detail page
        setTimeout(() => {
            window.location.href = `/art/${artId}`;
            document.body.style.cursor = 'default';
        }, 300);
    }

    // Add to cart with improved UI feedback
    function addToCart(artId, button = null) {
        if (!artId) return showToast('Invalid artwork', 'error');
        
        // Store original button text for restoration
        const originalText = button ? button.textContent : 'Add to Cart';
        
        // Disable button and show loading state
        if (button) {
            button.disabled = true;
            button.textContent = 'Adding...';
        }

        // API request to add item to cart
        fetch('/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ art_id: artId })
        })
        .then(res => {
            if (!res.ok) {
                throw new Error('Failed to add to cart');
            }
            return res.json();
        })
        .then(data => {
            if (button) {
                button.textContent = '✓ Added';
                
                // Reset button state
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            }
            
            // Show success message
            showToast(data.message || 'Artwork added to cart');
            updateCartCounter();
        })
        .catch(err => {
            console.error('Add to cart error:', err);
            
            if (button) {
                button.textContent = 'Failed! Try Again';
                
                // Reset button state
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            }
            
            showToast('Failed to add to cart', 'error');
        });
    }

    // Update cart counter in the navbar if it exists
    function updateCartCounter() {
        const cartCounter = document.querySelector('.cart-counter');
        if (cartCounter) {
            fetch('/cart/count')
                .then(res => res.json())
                .then(data => {
                    cartCounter.textContent = data.count;
                    cartCounter.classList.add('pulse');
                    setTimeout(() => cartCounter.classList.remove('pulse'), 1000);
                })
                .catch(err => console.error('Failed to update cart count:', err));
        }
    }

    // Enhanced toast notification with auto-dismiss and click-to-dismiss
    function showToast(message, type = 'success', duration = 3000) {
        // Remove any existing toasts
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => toast.remove());
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `<p>${message}</p>`;
        
        // Add to DOM
        document.body.appendChild(toast);
        
        // Trigger entrance animation
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Set auto-dismiss timer
        const dismissTimeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300); // Remove after transition
        }, duration);
        
        // Allow manually dismissing by clicking
        toast.addEventListener('click', () => {
            clearTimeout(dismissTimeout);
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300); // Remove after transition
        });
    }

    // Apply filter changes when inputs change
    filters.forEach(filter => {
        filter.addEventListener('change', fetchFilteredArtworks);
    });

    // Debounced search input
    if (searchInput) {
        searchInput.addEventListener('input', debounce(fetchFilteredArtworks, 400));
    }

    // Utility function: Debounce
    function debounce(fn, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // Load initial artworks with loading state
    fetchFilteredArtworks();
    
    // Add smooth scroll to top when filter is applied
    filters.forEach(filter => {
        filter.addEventListener('change', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });
    
    // Add loading animation for images
    window.addEventListener('load', () => {
        const images = document.querySelectorAll('.gallery-item img');
        images.forEach(img => {
            img.style.opacity = 1;
        });
    });
});