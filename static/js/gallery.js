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

    // Update gallery with smooth batch rendering
    function updateGallery(artworks) {
        galleryGrid.innerHTML = '';

        if (!artworks || artworks.length === 0) {
            galleryGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3>No Masterpieces Found</h3>
                    <p>We couldn't find any artwork matching your filters. Try adjusting your search or categories.</p>
                    <button class="reset-filters-btn" onclick="document.getElementById('search-filter').value=''; document.getElementById('price-filter').value=''; document.getElementById('media-filter').value=''; document.getElementById('search-filter').dispatchEvent(new Event('input'));">
                        <i class="fas fa-undo"></i> Clear All Filters
                    </button>
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();
        const itemsToAnimate = [];

        artworks.forEach((artwork) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            // Set initial state for animation
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            item.style.transition = 'opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

            item.dataset.date = artwork.created_at;
            item.dataset.price = artwork.price;
            item.dataset.media = artwork.category;

            const imageSrc = `/static/uploads/${artwork.image_path.split('/').pop()}`;
            const artistName = artwork.artist_name || artwork.email;

            item.innerHTML = `
                <img src="${imageSrc}" alt="${artwork.title}" loading="lazy" data-art-id="${artwork.art_id}">
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

            fragment.appendChild(item);
            itemsToAnimate.push(item);
        });

        // Append all items at once to prevent layout thrashing
        galleryGrid.appendChild(fragment);

        // Smoothly animate items in
        requestAnimationFrame(() => {
            itemsToAnimate.forEach((item, index) => {
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 50); // Faster stagger (50ms) for snappier feel
            });
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





    // --- CHECK URL FOR SEARCH/CATEGORY PARAM ---
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearchQuery = urlParams.get('search');
    const urlCategoryQuery = urlParams.get('category'); // Read category from URL

    if (urlSearchQuery && searchInput) {
        // Pre-fill the search box
        searchInput.value = urlSearchQuery;
    }

    if (urlCategoryQuery) {
        const mediaFilter = document.getElementById('media-filter');
        if (mediaFilter) {
            // Set the dropdown value to match the URL category
            // This ensures filter logic picks it up
            mediaFilter.value = urlCategoryQuery;
        }
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