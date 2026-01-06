document.addEventListener('DOMContentLoaded', () => {
    const searchOverlay = document.getElementById('searchOverlay');
    const searchInput = document.getElementById('searchInput');
    const closeBtn = document.querySelector('.close-search');
    const resultsContainer = document.getElementById('searchResults');

    let debounceTimer;

    // --- State Management ---
    function openSearch() {
        searchOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        setTimeout(() => searchInput.focus(), 100);
    }

    function closeSearch() {
        searchOverlay.classList.remove('active');
        document.body.style.overflow = '';
        searchInput.value = ''; // Optional: clear on close
        resultsContainer.innerHTML = '';
        searchInput.blur();
    }

    // --- Event Listeners ---

    // 1. Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // 'ESC' to close
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            closeSearch();
        }
        // '/' to open (but not if typing in an input)
        if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            e.preventDefault(); // Prevent '/' from being typed if we focus input
            openSearch();
        }
    });

    // 2. Button Triggers (Global Search Triggers)
    document.querySelectorAll('.search-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openSearch();
        });
    });

    // 3. Close Actions
    closeBtn.addEventListener('click', closeSearch);
    searchOverlay.addEventListener('click', (e) => {
        if (e.target === searchOverlay) closeSearch();
    });

    // 4. Input Handling (The Core Logic)
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        clearTimeout(debounceTimer);

        if (query.length < 2) {
            resultsContainer.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(() => {
            fetchResults(query);
        }, 300); // 300ms debounce
    });

    // --- API & Rendering ---
    async function fetchResults(query) {
        try {
            const response = await fetch(`/art/search?q=${encodeURIComponent(query)}`);
            const artworks = await response.json();
            renderResults(artworks);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    function renderResults(artworks) {
        resultsContainer.innerHTML = '';

        if (artworks.length === 0) {
            resultsContainer.innerHTML = `
                <div style="text-align: center; color: rgba(255,255,255,0.4); grid-column: 1/-1; padding-top: 50px;">
                    <i class="fas fa-ghost" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>No masterpieces found matching that.</p>
                </div>
            `;
            return;
        }

        artworks.forEach((art, index) => {
            const card = document.createElement('div');
            card.className = 'search-card';
            card.style.animationDelay = `${index * 50}ms`; // Staggered animation

            // Link to artwork
            card.onclick = () => window.location.href = `/art/view/${art.art_id}`;

            card.innerHTML = `
                <div class="card-img-wrapper">
                    <img src="/static/uploads/${art.image_path.split('/').pop()}" alt="${art.title}" loading="lazy">
                </div>
                <div class="card-info">
                    <h3 class="card-title">${art.title}</h3>
                    <div class="card-artist">${art.artist_name}</div>
                    <span class="card-price">$${art.price.toLocaleString()}</span>
                </div>
            `;

            resultsContainer.appendChild(card);
        });
    }
});
