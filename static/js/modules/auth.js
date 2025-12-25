import { handleFormSubmission, showMessage } from './utils.js';
import { closeAllModals } from './modal-manager.js';

export function initAuth() {
    // Independent Logout
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

    // Form Submission Delegation
    document.body.addEventListener("submit", function (event) {
        const form = event.target.closest("form");
        if (!form) return;
        if (form.id === "registerArtistForm") return; // Handled in artist.js

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
}
