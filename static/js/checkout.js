// Modern Checkout JavaScript
class CheckoutManager {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.shippingData = {};
        this.paymentData = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeCardFormatting();
        this.updateProgressSteps();
    }

    bindEvents() {
        // Continue to Payment Button
        const continueBtn = document.getElementById('continue-to-payment');
        if (continueBtn) {
            continueBtn.addEventListener('click', async () => await this.validateShippingAndContinue());
        }

        // Back to Shipping Button
        const backBtn = document.getElementById('back-to-shipping');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.goToStep(1));
        }

        // Process Payment Button
        const processBtn = document.getElementById('process-payment');
        if (processBtn) {
            processBtn.addEventListener('click', async () => await this.processPayment());
        }

        // Payment Method Selection
        const paymentMethods = document.querySelectorAll('.payment-method');
        paymentMethods.forEach(method => {
            method.addEventListener('click', () => this.selectPaymentMethod(method));
        });

        // Form Validation
        this.setupFormValidation();
    }

    setupFormValidation() {
        // Card number formatting
        const cardNumber = document.getElementById('cardNumber');
        if (cardNumber) {
            cardNumber.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                e.target.value = value.substring(0, 19);
            });
        }

        // Expiry date formatting
        const expiryDate = document.getElementById('expiryDate');
        if (expiryDate) {
            expiryDate.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2);
                }
                e.target.value = value.substring(0, 5);
            });
        }

        // CVV formatting
        const cvv = document.getElementById('cvv');
        if (cvv) {
            cvv.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
            });
        }
    }

    initializeCardFormatting() {
        // Auto-focus next input for card number
        const cardNumber = document.getElementById('cardNumber');
        if (cardNumber) {
            cardNumber.addEventListener('input', (e) => {
                if (e.target.value.length === 19) {
                    document.getElementById('expiryDate').focus();
                }
            });
        }

        // Auto-focus next input for expiry date
        const expiryDate = document.getElementById('expiryDate');
        if (expiryDate) {
            expiryDate.addEventListener('input', (e) => {
                if (e.target.value.length === 5) {
                    document.getElementById('cvv').focus();
                }
            });
        }
    }

    async validateShippingAndContinue() {
        const form = document.getElementById('shipping-form');
        const formData = new FormData(form);
        
        // Basic validation
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country'];
        let isValid = true;
        let missingFields = [];

        requiredFields.forEach(field => {
            const value = formData.get(field);
            if (!value || value.trim() === '') {
                isValid = false;
                missingFields.push(field);
            }
        });

        if (!isValid) {
            this.showError('Please fill in all required fields');
            return;
        }

        // Email validation
        const email = formData.get('email');
        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Show loading
        this.showLoading();

        try {
            // Make API call to process shipping
            const response = await fetch('/checkout/process_shipping', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            // Hide loading
            this.hideLoading();

            if (response.ok && result.status === 'success') {
                // Store shipping data
                this.shippingData = {
                    firstName: formData.get('firstName'),
                    lastName: formData.get('lastName'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    address: formData.get('address'),
                    city: formData.get('city'),
                    state: formData.get('state'),
                    zipCode: formData.get('zipCode'),
                    country: formData.get('country')
                };

                this.goToStep(2);
            } else {
                this.showError(result.error || 'Failed to process shipping information');
            }

        } catch (error) {
            this.hideLoading();
            console.error('Shipping processing error:', error);
            this.showError('Failed to process shipping information');
        }
    }

    selectPaymentMethod(methodElement) {
        // Remove active class from all methods
        document.querySelectorAll('.payment-method').forEach(method => {
            method.classList.remove('active');
        });

        // Add active class to selected method
        methodElement.classList.add('active');

        const method = methodElement.dataset.method;
        
        // Show/hide payment details based on method
        const cardDetails = document.getElementById('card-details');
        const paypalDetails = document.getElementById('paypal-details');

        if (method === 'card') {
            cardDetails.style.display = 'block';
            paypalDetails.style.display = 'none';
        } else if (method === 'paypal') {
            cardDetails.style.display = 'none';
            paypalDetails.style.display = 'block';
        }
    }

    async processPayment() {
        const activeMethod = document.querySelector('.payment-method.active');
        if (!activeMethod) {
            this.showError('Please select a payment method');
            return;
        }

        const method = activeMethod.dataset.method;

        if (method === 'card') {
            if (!this.validateCardPayment()) {
                return;
            }
        }

        // Show loading overlay
        this.showLoading();

        try {
            // Prepare payment data
            const paymentData = new FormData();
            paymentData.append('paymentMethod', method);
            
            if (method === 'card') {
                paymentData.append('cardNumber', document.getElementById('cardNumber').value.replace(/\s/g, ''));
                paymentData.append('expiryDate', document.getElementById('expiryDate').value);
                paymentData.append('cvv', document.getElementById('cvv').value);
                paymentData.append('cardName', document.getElementById('cardName').value);
            }

            // Make API call to process payment
            const response = await fetch('/checkout/process_payment', {
                method: 'POST',
                body: paymentData
            });

            const result = await response.json();

            // Hide loading
            this.hideLoading();

            if (response.ok && result.status === 'success') {
                // Show success and go to confirmation
                this.showSuccess('Payment processed successfully!');
                setTimeout(() => {
                    this.goToStep(3);
                }, 1500);
            } else {
                this.showError(result.error || 'Payment failed. Please try again.');
            }

        } catch (error) {
            this.hideLoading();
            console.error('Payment processing error:', error);
            this.showError('Payment failed. Please try again.');
        }
    }

    validateCardPayment() {
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;
        const cardName = document.getElementById('cardName').value;

        if (cardNumber.length < 16) {
            this.showError('Please enter a valid card number');
            return false;
        }

        if (expiryDate.length < 5) {
            this.showError('Please enter a valid expiry date');
            return false;
        }

        if (cvv.length < 3) {
            this.showError('Please enter a valid CVV');
            return false;
        }

        if (!cardName.trim()) {
            this.showError('Please enter the name on card');
            return false;
        }

        return true;
    }



    goToStep(step) {
        // Hide all steps
        document.querySelectorAll('.checkout-step').forEach(stepElement => {
            stepElement.classList.remove('active');
        });

        // Show target step
        const targetStep = document.getElementById(`${this.getStepName(step)}-step`);
        if (targetStep) {
            targetStep.classList.add('active');
        }

        this.currentStep = step;
        this.updateProgressSteps();

        // Generate order number for confirmation step
        if (step === 3) {
            this.generateOrderNumber();
        }
    }

    getStepName(step) {
        switch (step) {
            case 1: return 'shipping';
            case 2: return 'payment';
            case 3: return 'confirmation';
            default: return 'shipping';
        }
    }

    updateProgressSteps() {
        const steps = document.querySelectorAll('.step');
        
        steps.forEach((step, index) => {
            const stepNumber = index + 1;
            
            // Remove all classes
            step.classList.remove('active', 'completed');
            
            // Add appropriate class
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
            }
        });
    }

    generateOrderNumber() {
        const orderNumber = Math.floor(Math.random() * 90000) + 10000;
        const orderNumberElement = document.getElementById('orderNumber');
        if (orderNumberElement) {
            orderNumberElement.textContent = orderNumber;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('show');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    showSuccess(message) {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✓</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    showError(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✕</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .notification-icon {
        font-size: 1.2rem;
        font-weight: bold;
    }
`;
document.head.appendChild(style);

// Initialize checkout when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CheckoutManager();
});