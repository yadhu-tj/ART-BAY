import { showMessage } from './utils.js';

export function initArtist() {
    // Register Artist Form
    document.addEventListener('submit', async (e) => {
        if (e.target.matches('#registerArtistForm')) {
            e.preventDefault();
            console.log('Artist form submission triggered');

            const artistForm = e.target;
            const submitBtn = document.querySelector('button[type="submit"][form="registerArtistForm"]');

            if (!artistForm || !submitBtn) {
                showMessage('Form error: Please try again.', 'error');
                return;
            }

            const bio = artistForm.querySelector('#artistBio').value.trim();
            if (bio.length < 10) {
                showMessage('Please enter a bio with at least 10 characters.', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

            try {
                const response = await fetch(artistForm.action, {
                    method: 'POST',
                    body: new FormData(artistForm),
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.status === 'success') {
                    showMessage(data.message, 'success');
                    const modal = bootstrap.Modal.getInstance(document.getElementById('registerArtistModal'));
                    if (modal) modal.hide();
                } else {
                    showMessage(data.error || 'Application failed. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Artist registration error:', error);
                showMessage('An error occurred during your application. Please try again.', 'error');
            } finally {
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Submit Application';
                }, 2000);
            }
        }
    });

    // Modal Readiness Check
    document.addEventListener('shown.bs.modal', (e) => {
        if (e.target.id === 'registerArtistModal') {
            const artistForm = document.getElementById('registerArtistForm');
            if (!artistForm) console.error('Artist form not found in modal!');
        }
    });

    // Artist Navigation Logic
    function updateArtistNavigation() {
        const artistHomeLink = document.querySelector('.artist-home-link');
        const artistDashboardLink = document.querySelector('.artist-dashboard-link');

        if (!artistHomeLink || !artistDashboardLink) return;

        const currentPath = window.location.pathname;
        const isOnDashboard = currentPath.includes('/artist-dashboard') ||
            currentPath.includes('/dashboard') ||
            document.querySelector('.artist_dashboard__container');

        const isOnHome = currentPath === '/' ||
            currentPath === '/home' ||
            document.querySelector('.content-wrapper');

        if (isOnDashboard) {
            artistHomeLink.style.display = 'block';
            artistDashboardLink.style.display = 'none';
        } else if (isOnHome) {
            artistHomeLink.style.display = 'none';
            artistDashboardLink.style.display = 'block';
        } else {
            artistHomeLink.style.display = 'block';
            artistDashboardLink.style.display = 'block';
        }
    }

    updateArtistNavigation();

    document.addEventListener('click', function (event) {
        if (event.target.closest('.dropbtn') || event.target.closest('.dropdown-toggle')) {
            setTimeout(updateArtistNavigation, 100);
        }
    });

    window.addEventListener('load', updateArtistNavigation);
    window.addEventListener('popstate', updateArtistNavigation);

    // Dashboard AJAX Link
    document.querySelectorAll('a[href="/artist/dashboard"]').forEach(link => {
        link.addEventListener("click", async function (event) {
            event.preventDefault();
            const originalHtml = link.innerHTML;
            link.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

            try {
                const response = await fetch("/artist/dashboard", {
                    credentials: 'include'
                });

                if (response.redirected) {
                    window.location.href = response.url;
                } else {
                    const html = await response.text();
                    document.open();
                    document.write(html);
                    document.close();
                }
            } catch (error) {
                console.error("Dashboard access error:", error);
                showMessage("Failed to load dashboard", "error");
            } finally {
                link.innerHTML = originalHtml;
            }
        });
    });
}
