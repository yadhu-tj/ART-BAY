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

    async function loadModal(link, containerId, modalId, endpoint) {
        console.log(`Attempting to load modal for ${containerId}`);
        const container = document.getElementById(containerId);
        if (!link || !container) return;

        link.addEventListener("click", async function (event) {
            event.preventDefault();
            closeAllModals();

            try {
                // Show loading indicator
                const loadingIndicator = document.createElement('div');
                loadingIndicator.className = 'text-center p-3';
                loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                container.innerHTML = '';
                container.appendChild(loadingIndicator);

                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);

                const html = await response.text();
                console.log('Loaded HTML content:', html.substring(0, 200) + '...'); // Log first 200 chars
                container.innerHTML = html;

                const modal = document.getElementById(modalId);
                const modalContent = modal.querySelector('.modal-content');
                if (modalContent && container.firstChild) {
                    modalContent.innerHTML = '';
                    modalContent.appendChild(container.firstChild);
                }

                const modalInstance = new bootstrap.Modal(modal);
                modalInstance.show();
                console.log(`Modal ${modalId} loaded successfully`);
                
                // Initialize OTP functionality if login modal is loaded
                if (modalId === 'loginModal') {
                    setTimeout(() => {
                        console.log('Checking for OTP elements in modal...');
                        // Search within the modal content specifically
                        const modalContent = document.querySelector('#loginModal .modal-content');
                        const emailStep = modalContent ? modalContent.querySelector('#emailStep') : null;
                        const otpStep = modalContent ? modalContent.querySelector('#otpStep') : null;
                        const passwordStep = modalContent ? modalContent.querySelector('#passwordStep') : null;
                        console.log('emailStep found:', !!emailStep);
                        console.log('otpStep found:', !!otpStep);
                        console.log('passwordStep found:', !!passwordStep);
                        
                        if (typeof initializeOTPLogin === 'function') {
                            initializeOTPLogin();
                        }
                    }, 500); // Increased delay to ensure DOM is ready
                }
                
                // Initialize OTP functionality if signup modal is loaded
                if (modalId === 'signupModal') {
                    setTimeout(() => {
                        console.log('Checking for signup OTP elements in modal...');
                        // Search within the modal content specifically
                        const modalContent = document.querySelector('#signupModal .modal-content');
                        console.log('Modal content found:', !!modalContent);
                        if (modalContent) {
                            console.log('Modal content HTML:', modalContent.innerHTML.substring(0, 300) + '...');
                        }
                        const userInfoStep = modalContent ? modalContent.querySelector('#userInfoStep') : null;
                        const otpStep = modalContent ? modalContent.querySelector('#otpStep') : null;
                        const successStep = modalContent ? modalContent.querySelector('#successStep') : null;
                        console.log('userInfoStep found:', !!userInfoStep);
                        console.log('otpStep found:', !!otpStep);
                        console.log('successStep found:', !!successStep);
                        
                        if (typeof initializeOTPSignup === 'function') {
                            console.log('Calling initializeOTPSignup...');
                            initializeOTPSignup();
                        } else {
                            console.log('❌ initializeOTPSignup function not found!');
                        }
                    }, 500); // Increased delay to ensure DOM is ready
                }
            } catch (error) {
                console.error(`Error loading ${endpoint}:`, error);
                showMessage(`Failed to load ${endpoint}`, "error");
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

    // Event Listeners
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

    // Setup modal links
    loadModal(document.querySelector(".login-link"), "loginFormContainer", "loginModal", "/auth/login");
    loadModal(document.querySelector(".signup-link"), "signupFormContainer", "signupModal", "/auth/signup");

    // Switch between modals
    document.body.addEventListener("click", async function (event) {
        const switchModal = async (url, containerId, modalId) => {
            closeAllModals();
            try {
                // Show loading indicator
                const container = document.getElementById(containerId);
                const loadingIndicator = document.createElement('div');
                loadingIndicator.className = 'text-center p-3';
                loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                container.innerHTML = '';
                container.appendChild(loadingIndicator);

                const html = await (await fetch(url)).text();
                container.innerHTML = html;
                const modal = document.getElementById(modalId);
                const modalContent = modal.querySelector('.modal-content');
                if (modalContent && container.firstChild) {
                    modalContent.innerHTML = '';
                    modalContent.appendChild(container.firstChild);
                }
                new bootstrap.Modal(modal).show();
                
                // Initialize OTP functionality if login modal is loaded
                if (modalId === 'loginModal') {
                    setTimeout(() => {
                        console.log('Checking for OTP elements in switchModal...');
                        // Search within the modal content specifically
                        const modalContent = document.querySelector('#loginModal .modal-content');
                        const emailStep = modalContent ? modalContent.querySelector('#emailStep') : null;
                        const otpStep = modalContent ? modalContent.querySelector('#otpStep') : null;
                        const passwordStep = modalContent ? modalContent.querySelector('#passwordStep') : null;
                        console.log('emailStep found:', !!emailStep);
                        console.log('otpStep found:', !!otpStep);
                        console.log('passwordStep found:', !!passwordStep);
                        
                        if (typeof initializeOTPLogin === 'function') {
                            initializeOTPLogin();
                        }
                    }, 500); // Increased delay to ensure DOM is ready
                }
                
                // Initialize OTP functionality if signup modal is loaded
                if (modalId === 'signupModal') {
                    setTimeout(() => {
                        console.log('Checking for signup OTP elements in switchModal...');
                        // Search within the modal content specifically
                        const modalContent = document.querySelector('#signupModal .modal-content');
                        console.log('Modal content found:', !!modalContent);
                        if (modalContent) {
                            console.log('Modal content HTML:', modalContent.innerHTML.substring(0, 300) + '...');
                        }
                        const userInfoStep = modalContent ? modalContent.querySelector('#userInfoStep') : null;
                        const otpStep = modalContent ? modalContent.querySelector('#otpStep') : null;
                        const successStep = modalContent ? modalContent.querySelector('#successStep') : null;
                        console.log('userInfoStep found:', !!userInfoStep);
                        console.log('otpStep found:', !!otpStep);
                        console.log('successStep found:', !!successStep);
                        
                        if (typeof initializeOTPSignup === 'function') {
                            console.log('Calling initializeOTPSignup from switchModal...');
                            initializeOTPSignup();
                        } else {
                            console.log('❌ initializeOTPSignup function not found in switchModal!');
                        }
                    }, 500); // Increased delay to ensure DOM is ready
                }
            } catch (error) {
                console.error("Error switching modals:", error);
                showMessage("Modal load error", "error");
            }
        };

        if (event.target.matches(".switch-to-signup")) {
            event.preventDefault();
            switchModal("/auth/signup", "signupFormContainer", "signupModal");
        } else if (event.target.matches(".switch-to-login")) {
            event.preventDefault();
            switchModal("/auth/login", "loginFormContainer", "loginModal");
        } else if (event.target.closest(".register-artist")) {
            event.preventDefault();
            closeAllModals();
            new bootstrap.Modal(document.getElementById("registerArtistModal")).show();
        }
    });

    // Register Artist
    document.addEventListener('submit', async (e) => {
        if (e.target.matches('#registerArtistForm')) {
            e.preventDefault(); // Prevent default form submission
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
                console.log('Validation failed: Bio too short');
                showMessage('Please enter a bio with at least 10 characters.', 'error');
                return;
            }

            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            console.log('Submitting form to:', artistForm.action);

            try {
                console.log('Sending fetch request to:', artistForm.action);
                const response = await fetch(artistForm.action, {
                    method: 'POST',
                    body: new FormData(artistForm),
                    credentials: 'include'
                });

                console.log('Fetch response status:', response.status);
                const data = await response.json();
                console.log('Server response:', data);

                if (data.status === 'success') {
                    showMessage(data.message, 'success');
                    const modal = bootstrap.Modal.getInstance(document.getElementById('registerArtistModal'));
                    if (modal) {
                        console.log('Closing modal');
                        modal.hide();
                    }
                } else {
                    console.log('Server error:', data.error);
                    showMessage(data.error || 'Application failed. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Artist registration error:', error);
                showMessage('An error occurred during your application. Please try again.', 'error');
            } finally {
                // Re-enable submit button
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Submit Application';
                    console.log('Submit button re-enabled');
                }, 2000);
            }
        }
    });

    // Ensure modal is ready before form interactions
    document.addEventListener('shown.bs.modal', (e) => {
        if (e.target.id === 'registerArtistModal') {
            console.log('Artist modal shown');
            const artistForm = document.getElementById('registerArtistForm');
            const submitBtn = document.querySelector('button[type="submit"][form="registerArtistForm"]');
            if (!artistForm || !submitBtn) {
                console.error('Artist form or submit button not found in modal!');
            } else {
                console.log('Artist form and submit button found in modal');
            }
        }
    });

    // Form Submission
    document.body.addEventListener("submit", function (event) {
        const form = event.target.closest("form");
        if (!form) return;
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
                        try {
                            const html = await (await fetch("/auth/login")).text();
                            const container = document.getElementById("loginFormContainer");
                            container.innerHTML = html;
                            const modalContent = document.getElementById("loginModal").querySelector('.modal-content');
                            if (modalContent && container.firstChild) {
                                modalContent.innerHTML = '';
                                modalContent.appendChild(container.firstChild);
                                new bootstrap.Modal(document.getElementById("loginModal")).show();
                            }
                        } catch (error) {
                            console.error("Error loading login form after signup:", error);
                            showMessage("Failed to load login form", "error");
                        }
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

    // Floating Labels (Event Delegation)
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
        
        // Get current page path
        const currentPath = window.location.pathname;
        
        // Check if we're on the artist dashboard
        const isOnDashboard = currentPath.includes('/artist-dashboard') || 
                             currentPath.includes('/dashboard') ||
                             document.querySelector('.artist_dashboard__container');
        
        // Check if we're on the home page
        const isOnHome = currentPath === '/' || 
                        currentPath === '/home' ||
                        document.querySelector('.content-wrapper');
        
        if (isOnDashboard) {
            // Show "Return Home" link, hide "Artist Dashboard" link
            artistHomeLink.style.display = 'block';
            artistDashboardLink.style.display = 'none';
        } else if (isOnHome) {
            // Show "Artist Dashboard" link, hide "Return Home" link
            artistHomeLink.style.display = 'none';
            artistDashboardLink.style.display = 'block';
        } else {
            // On other pages, show both options
            artistHomeLink.style.display = 'block';
            artistDashboardLink.style.display = 'block';
        }
    }

    // Initialize dynamic navigation
    updateArtistNavigation();
    
    // Update navigation when dropdown is opened
    document.addEventListener('click', function(event) {
        if (event.target.closest('.dropbtn') || event.target.closest('.dropdown-toggle')) {
            setTimeout(updateArtistNavigation, 100);
        }
    });
    
    // Update navigation on page load and navigation
    window.addEventListener('load', updateArtistNavigation);
    window.addEventListener('popstate', updateArtistNavigation);
    
    // Artist Dashboard Navigation
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
        // First we get the viewport height and we multiply it by 1% to get a value for a vh unit
        let vh = window.innerHeight * 0.01;
        // Then we set the value in the --vh custom property to the root of the document
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    // Set the --vh value initially and on resize
    setVhProperty();
    window.addEventListener('resize', setVhProperty);
});