document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded!");

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
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);

                const html = await response.text();
                container.innerHTML = html;

                const modal = document.getElementById(modalId);
                const modalContent = modal.querySelector('.modal-content');
                if (modalContent && container.firstChild) {
                    modalContent.innerHTML = '<div class="text-center p-3"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
                    setTimeout(() => {
                        modalContent.innerHTML = '';
                        modalContent.appendChild(container.firstChild);
                    }, 300); // simulate loading time
                }

                new bootstrap.Modal(modal).show();
                console.log(`Modal ${modalId} loaded successfully`);
            } catch (error) {
                console.error(`Error loading ${endpoint}:`, error);
                showMessage(`Failed to load ${endpoint}`, "error");
            }
        });
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
                const html = await (await fetch(url)).text();
                const container = document.getElementById(containerId);
                container.innerHTML = html;
                const modal = document.getElementById(modalId);
                const modalContent = modal.querySelector('.modal-content');
                if (modalContent && container.firstChild) {
                    modalContent.innerHTML = '';
                    modalContent.appendChild(container.firstChild);
                }
                new bootstrap.Modal(modal).show();
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
    const confirmRegisterArtistBtn = document.getElementById("confirmRegisterArtist");
    if (confirmRegisterArtistBtn) {
        confirmRegisterArtistBtn.addEventListener("click", async () => {
            try {
                const response = await fetch("/auth/register-artist", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    credentials: 'include'
                });

                const text = await response.text();
                const data = JSON.parse(text);

                if (data.status === "success" && data.redirect) {
                    showMessage(data.message || "Successfully registered as an artist!");
                    bootstrap.Modal.getInstance(document.getElementById("registerArtistModal")).hide();
                    window.location.href = data.redirect;
                } else {
                    showMessage(data.message || "Failed to register as an artist", "error");
                    bootstrap.Modal.getInstance(document.getElementById("registerArtistModal")).hide();
                    if (data.redirect) window.location.href = data.redirect;
                }
            } catch (error) {
                console.error("Artist registration error:", error);
                showMessage("An error occurred while registering: " + error.message, "error");
                bootstrap.Modal.getInstance(document.getElementById("registerArtistModal")).hide();
                if (error.message.includes("Unexpected response format")) {
                    window.location.href = "/auth/login";
                }
            }
        });
    }

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

    console.log("All scripts loaded successfully!");
});
