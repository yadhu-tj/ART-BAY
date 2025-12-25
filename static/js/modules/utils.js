export function showMessage(message, type = "success") {
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

export function removeAllBackdrops() {
    document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
}

export async function handleFormSubmission(form, url, successMessage, errorMessage, onSuccess) {
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
            if (onSuccess) onSuccess(data);
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

export function setVhProperty() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}
