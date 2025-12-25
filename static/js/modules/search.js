export function initSearch() {
    const globalSearchInput = document.getElementById('global-search-input');
    const globalSearchBtn = document.getElementById('global-search-btn');

    function performGlobalSearch() {
        const query = globalSearchInput.value.trim();
        if (query) {
            window.location.href = `/gallery?search=${encodeURIComponent(query)}`;
        }
    }

    if (globalSearchInput && globalSearchBtn) {
        globalSearchBtn.addEventListener('click', performGlobalSearch);

        globalSearchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                performGlobalSearch();
            }
        });
    }
}
