//
document.addEventListener("DOMContentLoaded", function () {
    console.log("Signup script loaded");

    // 1. Target the Signup Link in the Navbar
    // We look for the link that points to the signup modal
    const signupLink = document.querySelector('a[data-bs-target="#signupModal"]');
    
    // 2. Add the click listener to open the modal via AJAX
    if (signupLink) {
        // loadModal(linkElement, containerId, modalId, endpointUrl)
        // This function lives in head.js and handles the "X-Requested-With" header
        loadModal(signupLink, 'signup-modal-container', 'signupModal', '/auth/signup');
    }
});

// This function is called by head.js after the modal HTML is injected
function initializeOTPSignup() {
    console.log("Initializing Signup OTP Logic");
    
    // We need to re-attach listeners because the HTML was just replaced via AJAX
    const sendOtpBtn = document.getElementById("sendOtpBtn");
    
    if (sendOtpBtn) {
        // Remove old listeners to prevent duplicates (cloning trick)
        const newBtn = sendOtpBtn.cloneNode(true);
        sendOtpBtn.parentNode.replaceChild(newBtn, sendOtpBtn);
        
        newBtn.addEventListener("click", function() {
            // Validate Form Data First
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Simple Validation
            if (!name || !email || !password || !confirmPassword) {
                alert("Please fill in all fields.");
                return;
            }
            if (password !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            // If valid, trigger the OTP flow
            // (Assumes handleSignupOtpSend is defined in otp_signup.js)
            if (typeof handleSignupOtpSend === 'function') {
                handleSignupOtpSend(); 
            } else {
                console.error("handleSignupOtpSend function missing! Check otp_signup.js");
            }
        });
        console.log("Signup OTP button listener attached.");
    }
}