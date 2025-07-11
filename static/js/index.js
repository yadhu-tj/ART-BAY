let items = document.querySelectorAll('.slider .list .item');
let thumbnails = document.querySelectorAll('.thumbnail .item');
let buttons = document.querySelectorAll('.thumbnail .item .explore-btn');
let texts = document.querySelectorAll('.slider-text .text-section');

let countItem = items.length;
let itemActive = 0;

// Function to update the active slide
function setActiveSlide(index) {
    // Remove active and transitioning classes
    items.forEach(item => item.classList.remove('active'));
    thumbnails.forEach(thumb => {
        thumb.classList.remove('active');
        thumb.classList.remove('transitioning');
    });
    buttons.forEach(btn => {
        btn.classList.remove('transitioning');
        btn.style.opacity = '0'; // Reset opacity for non-active buttons
    });
    texts.forEach(text => text.classList.remove('active'));

    // Update the active index
    itemActive = index;

    // Add active class to the current slide, thumbnail, button, and text
    items[itemActive].classList.add('active');
    thumbnails[itemActive].classList.add('active');
    buttons[itemActive].style.opacity = '1'; // Show the active button
    texts[itemActive].classList.add('active');

    // Apply transitioning effect to the previous slide
    let prevIndex = itemActive > 0 ? itemActive - 1 : countItem - 1;
    thumbnails[prevIndex].classList.add('transitioning');
    buttons[prevIndex].classList.add('transitioning');
}

// Function to go to the next slide
function nextSlide() {
    let newIndex = (itemActive + 1) % countItem;
    setActiveSlide(newIndex);
}

// Set up automatic sliding every 5 seconds
let refreshInterval = setInterval(nextSlide, 5000);

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the first slide
    setActiveSlide(0);

    // Add click listeners to thumbnails to manually change slides
    thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', () => {
            if (index !== itemActive) {
                clearInterval(refreshInterval); // Pause auto-slide on manual interaction
                setActiveSlide(index);
                refreshInterval = setInterval(nextSlide, 5000); // Restart auto-slide
            }
        });
    });

    // Add click listeners to buttons for navigation
    buttons.forEach((button, index) => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent thumbnail click from triggering
            if (index === itemActive) {
                const link = button.getAttribute('data-link');
                if (link) {
                    window.location.href = link;
                }
            }
        });
    });
});