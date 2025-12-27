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

        // Login and Signup are now handled by otp_login.js and otp_signup.js dedicated controllers
        // We return early to prevent double submission or duplicate messages.
        if (form.id === "signupForm" || form.id === "loginForm") return;

    });
}
