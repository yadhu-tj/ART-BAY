/* Updated static/js/head.js 
   - Fixed Modal Switching using Event Delegation
   - Reuses existing loadModal logic for stability
*/

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded!");

    // Mobile Detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

    // Utility Functions
    function removeAllBackdrops() {
        document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());
        document.body.classList.remove("modal-open");
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
    }

    function closeAllModals() {
        document.querySelectorAll(".modal.show").forEach(modal => {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            modalInstance?.hide();
        });
        removeAllBackdrops();
    }

    function showMessage(message, type = "success") {
        const alerter = document.getElementById("message-alerter");
        if (!alerter) {
            console.error("Message alerter element not found!");
            return;
        }

        alerter.innerHTML = ""; // Clear existing messages

        const msgElement = document.createElement("div");
        msgElement.className = `alert-message ${type}`;
        msgElement.textContent = message;
        msgElement.style.opacity = "0";
        msgElement.style.transition = "opacity 0.5s ease-in-out";

        alerter.appendChild(msgElement);
        requestAnimationFrame(() => {
            msgElement.style.opacity = "1";
        });

        setTimeout(() => {
            msgElement.style.opacity = "0";
            setTimeout(() => msgElement.remove(), 500);
        }, 3000);
    }

    async function handleFormSubmission(form, url, successMessage, errorMessage, onSuccess) {
        const formData = new FormData(form);
        const submitBtn = form.querySelector("button[type='submit']");
        if (submitBtn) submitBtn.disabled = true;

        try {
            const response = await fetch(url, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            console.log("Response:", data);

            if (data.status === "success") {
                showMessage(successMessage);
                onSuccess(data);
            } else {
                showMessage(data.message || errorMessage, "error");
            }
        } catch (error) {
            console.error(`Error during ${url}:`, error);
            showMessage(errorMessage, "error");
        } finally {
            if (submitBtn) setTimeout(() => submitBtn.disabled = false, 2000);
        }
    }

    // Modal Loading Logic
    async function loadModal(link, containerId, modalId, endpoint) {
        console.log(`Attempting to load modal for ${containerId}`);
        const container = document.getElementById(containerId);
        if (!link || !container) return;

        link.addEventListener("click", async function (event) {
            event.preventDefault();
            closeAllModals(); // Ensure other modals are closed

            try {
                // 1. Show loading indicator
                const loadingIndicator = document.createElement('div');
                loadingIndicator.className = 'text-center p-3';
                loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                container.innerHTML = '';
                container.appendChild(loadingIndicator);

                const modalElement = document.getElementById(modalId);
                const modalInstance = new bootstrap.Modal(modalElement);
                modalInstance.show();

                // 2. Fetch content with the special header
                const response = await fetch(endpoint, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest' // Critical for the backend to serve the partial HTML
                    }
                });

                if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);

                const html = await response.text();
                
                // 3. Insert content safely
                container.innerHTML = html;

                // 4. CRITICAL FIX: Manually execute any scripts found in the response
                // This ensures event listeners in signup.js/login.js attach properly
                const scripts = container.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });

                console.log(`Modal ${modalId} loaded successfully`);

                // 5. Initialize OTP Logic (with slight delay for DOM readiness)
                setTimeout(() => {
                    if (modalId === 'loginModal' && typeof initializeOTPLogin === 'function') {
                        console.log('Initializing Login OTP...');
                        initializeOTPLogin();
                    }
                    
                    if (modalId === 'signupModal' && typeof initializeOTPSignup === 'function') {
                        console.log('Initializing Signup OTP...');
                        initializeOTPSignup();
                    }
                }, 300);

            } catch (error) {
                console.error(`Error loading ${endpoint}:`, error);
                container.innerHTML = `<div class="text-danger p-4 text-center">
                    <i class="fas fa-exclamation-circle"></i> Failed to load content.
                </div>`;
            }
        });
    }

    // Mobile dropdown toggle
    if (isMobile) {
        const dropdownToggle = document.querySelector('.user-dropdown .dropbtn');
        if (dropdownToggle) {
            dropdownToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const dropdown = this.closest('.user-dropdown');
                dropdown.classList.toggle('active');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.user-dropdown')) {
                    document.querySelectorAll('.user-dropdown').forEach(dropdown => {
                        dropdown.classList.remove('active');
                    });
                }
            });
        }
    }

    // Event Listeners for Modal Cleanup
    document.addEventListener("hidden.bs.modal", removeAllBackdrops);
    document.addEventListener("show.bs.modal", removeAllBackdrops);

    document.addEventListener("click", function (event) {
        document.querySelectorAll(".modal.show").forEach(modal => {
            if (!modal.querySelector(".modal-content").contains(event.target)) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                modalInstance?.hide();
            }
        });
    });

    // Setup modal links (Attach listeners to the navbar buttons)
    loadModal(document.querySelector(".login-link"), "loginFormContainer", "loginModal", "/auth/login");
    loadModal(document.querySelector(".signup-link"), "signupFormContainer", "signupModal", "/auth/signup");

    // ==========================================
    // FIXED: Switch between modals using Event Delegation
    // ==========================================
    document.body.addEventListener("click", function (event) {
        // Use .closest() to handle clicks on elements inside the link (like icons)
        const signupSwitch = event.target.closest(".switch-to-signup");
        const loginSwitch = event.target.closest(".switch-to-login");
        const registerArtistBtn = event.target.closest(".register-artist");

        if (signupSwitch) {
            event.preventDefault();
            console.log("Delegation: Switching to Signup Modal");
            closeAllModals();
            // Trigger the actual signup link which handles AJAX/Headers/Scripts correctly
            const signupLink = document.querySelector(".signup-link");
            if (signupLink) signupLink.click();
        } 
        else if (loginSwitch) {
            event.preventDefault();
            console.log("Delegation: Switching to Login Modal");
            closeAllModals();
            // Trigger the actual login link which handles AJAX/Headers/Scripts correctly
            const loginLink = document.querySelector(".login-link");
            if (loginLink) loginLink.click();
        } 
        else if (registerArtistBtn) {
            event.preventDefault();
            closeAllModals();
            const registerModal = document.getElementById("registerArtistModal");
            if (registerModal) {
                new bootstrap.Modal(registerModal).show();
            }
        }
    });

    // Register Artist Form Handler
    document.addEventListener('submit', async (e) => {
        if (e.target.matches('#registerArtistForm')) {
            e.preventDefault(); 
            console.log('Artist form submission triggered');

            const artistForm = e.target;
            const submitBtn = document.querySelector('button[type="submit"][form="registerArtistForm"]');
            
            if (!artistForm || !submitBtn) {
                console.error('Artist form or submit button not found!');
                showMessage('Form error: Please try again.', 'error');
                return;
            }

            // Client-side validation for bio
            const bio = artistForm.querySelector('#artistBio').value.trim();
            if (bio.length < 10) {
                showMessage('Please enter a bio with at least 10 characters.', 'error');
                return;
            }

            // Disable submit button
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

    // Ensure modal is ready before form interactions
    document.addEventListener('shown.bs.modal', (e) => {
        if (e.target.id === 'registerArtistModal') {
            console.log('Artist modal shown, form checking...');
            const artistForm = document.getElementById('registerArtistForm');
            if (!artistForm) console.error('Artist form not found in modal!');
        }
    });

    // General Form Submission (Login/Signup)
    document.body.addEventListener("submit", function (event) {
        const form = event.target.closest("form");
        if (!form) return;
        // Skip artist form as it's handled above
        if (form.id === "registerArtistForm") return; 

        event.preventDefault();

        if (form.id === "signupForm") {
            handleFormSubmission(
                form,
                "/auth/signup",
                "Successfully signed up! Please log in.",
                "Signup failed",
                async () => {
                    setTimeout(async () => {
                        closeAllModals();
                        // Trigger login modal via the link to ensure clean state
                        const loginLink = document.querySelector(".login-link");
                        if (loginLink) loginLink.click();
                    }, 2000);
                }
            );
        } else if (form.id === "loginForm") {
            handleFormSubmission(
                form,
                "/auth/login",
                "Successfully logged in!",
                "Login failed",
                (data) => {
                    setTimeout(() => {
                        closeAllModals();
                        if (data.redirect) window.location.href = data.redirect;
                    }, 2000);
                }
            );
        }
    });

    // Logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (event) => {
            event.preventDefault();
            try {
                const response = await fetch("/auth/logout");
                const data = await response.json();
                if (data.status === "success") {
                    window.location.href = "/";
                } else {
                    showMessage("Logout failed. Please try again.", "error");
                }
            } catch (error) {
                console.error("Logout error:", error);
                showMessage("An error occurred during logout.", "error");
            }
        });
    }

    // Floating Labels UX
    document.body.addEventListener("focusin", function (event) {
        const input = event.target.closest(".form-control");
        if (input && input.closest(".form-floating")) {
            input.closest(".form-floating").classList.add("focused");
        }
    });

    document.body.addEventListener("focusout", function (event) {
        const input = event.target.closest(".form-control");
        if (input && input.closest(".form-floating") && !input.value) {
            input.closest(".form-floating").classList.remove("focused");
        }
    });

    // Dynamic Artist Navigation
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
    
    document.addEventListener('click', function(event) {
        if (event.target.closest('.dropbtn') || event.target.closest('.dropdown-toggle')) {
            setTimeout(updateArtistNavigation, 100);
        }
    });
    
    window.addEventListener('load', updateArtistNavigation);
    window.addEventListener('popstate', updateArtistNavigation);
    
    // Artist Dashboard AJAX Link
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

    // Handle viewport height issues on mobile
    function setVhProperty() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    setVhProperty();
    window.addEventListener('resize', setVhProperty);
});