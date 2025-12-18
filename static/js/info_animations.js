/* static/js/info_animations.js */
document.addEventListener("DOMContentLoaded", function () {
    const observerOptions = {
        threshold: 0.15, // Trigger when 15% of the element is visible
        rootMargin: "0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                // Optional: Stop observing once revealed
                // observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    // Target all elements with class 'reveal'
    document.querySelectorAll(".reveal").forEach((el) => {
        observer.observe(el);
    });
});