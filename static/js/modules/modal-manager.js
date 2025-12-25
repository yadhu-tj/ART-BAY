import { removeAllBackdrops } from './utils.js';

export function closeAllModals() {
    document.querySelectorAll(".modal.show").forEach(modal => {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        modalInstance?.hide();
    });
    removeAllBackdrops();
}

export async function loadModal(link, containerId, modalId, endpoint) {
    console.log(`Attempting to load modal for ${containerId}`);
    const container = document.getElementById(containerId);
    if (!link || !container) return;

    link.addEventListener("click", async function (event) {
        event.preventDefault();
        closeAllModals();

        try {
            // 1. Show loading
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'text-center p-3';
            loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            container.innerHTML = '';
            container.appendChild(loadingIndicator);

            const modalElement = document.getElementById(modalId);
            const modalInstance = new bootstrap.Modal(modalElement);
            modalInstance.show();

            // 2. Fetch content
            const response = await fetch(endpoint, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);

            const html = await response.text();

            // 3. Insert content
            container.innerHTML = html;

            // 4. Execute scripts
            const scripts = container.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });

            console.log(`Modal ${modalId} loaded successfully`);

            // 5. Initialize OTP Logic
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

export function initModals() {
    // Modal Cleanup Listeners
    document.addEventListener("hidden.bs.modal", removeAllBackdrops);
    document.addEventListener("show.bs.modal", removeAllBackdrops);

    // Click outside to close
    document.addEventListener("click", function (event) {
        document.querySelectorAll(".modal.show").forEach(modal => {
            if (!modal.querySelector(".modal-content").contains(event.target)) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                modalInstance?.hide();
            }
        });
    });

    // Initial Loaders
    const loginLink = document.querySelector(".login-link");
    if (loginLink) loadModal(loginLink, "loginFormContainer", "loginModal", "/auth/login");

    const signupLink = document.querySelector(".signup-link");
    if (signupLink) loadModal(signupLink, "signupFormContainer", "signupModal", "/auth/signup");

    // Event Delegation for Switching
    document.body.addEventListener("click", function (event) {
        const signupSwitch = event.target.closest(".switch-to-signup");
        const loginSwitch = event.target.closest(".switch-to-login");
        const registerArtistBtn = event.target.closest(".register-artist");

        if (signupSwitch) {
            event.preventDefault();
            console.log("Delegation: Switching to Signup Modal");
            closeAllModals();
            const signupLink = document.querySelector(".signup-link");
            if (signupLink) signupLink.click();
        }
        else if (loginSwitch) {
            event.preventDefault();
            console.log("Delegation: Switching to Login Modal");
            closeAllModals();
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
}
