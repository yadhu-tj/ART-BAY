import { setVhProperty } from './utils.js';

export function initUI() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

    if (isMobile) {
        const dropdownToggle = document.querySelector('.user-dropdown .dropbtn');
        if (dropdownToggle) {
            dropdownToggle.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const dropdown = this.closest('.user-dropdown');
                dropdown.classList.toggle('active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', function (e) {
                if (!e.target.closest('.user-dropdown')) {
                    document.querySelectorAll('.user-dropdown').forEach(dropdown => {
                        dropdown.classList.remove('active');
                    });
                }
            });
        }
    }

    // Floating Labels
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

    // Viewport Height Fix
    setVhProperty();
    window.addEventListener('resize', setVhProperty);
}
