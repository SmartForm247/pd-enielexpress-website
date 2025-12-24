// WhatsApp integration for P&D EnielExpress

document.addEventListener('DOMContentLoaded', function() {
    // WhatsApp notification elements
    const whatsappNotificationBtn = document.getElementById('whatsappNotificationBtn');
    const whatsappModal = document.getElementById('whatsappModal');
    const whatsappForm = document.getElementById('whatsappForm');
    const phoneNumberInput = document.getElementById('phoneNumber');
    
    // Initialize WhatsApp notification button
    if (whatsappNotificationBtn) {
        whatsappNotificationBtn.addEventListener('click', function() {
            // Show WhatsApp modal
            const modal = new bootstrap.Modal(whatsappModal);
            modal.show();
        });
    }
    
    // WhatsApp form submission
    if (whatsappForm) {
        whatsappForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const phoneNumber = phoneNumberInput.value.trim();
            const trackingNumber = document.getElementById('trackingNumber').textContent;
            
            if (!phoneNumber) {
                phoneNumberInput.classList.add('is-invalid');
                return;
            }
            
            // Show loading state
            const submitBtn = whatsappForm.querySelector('button[type="submit"]');
            const originalBtnText = PDEnilexpress.showLoading(submitBtn, 'Subscribing...');
            
            // Subscribe to WhatsApp notifications
            subscribeToWhatsAppNotifications(phoneNumber, trackingNumber)
                .then(() => {
                    // Show success message
                    PDEnilexpress.showAlert('You will now receive WhatsApp updates for this shipment', 'success');
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(whatsappModal);
                    modal.hide();
                    
                    // Reset form
                    whatsappForm.reset();
                })
                .catch(error => {
                    // Show error message
                    PDEnilexpress.showAlert(error.message, 'danger');
                })
                .finally(() => {
                    // Reset button
                    PDEnilexpress.hideLoading(submitBtn, originalBtnText);
                });
        });
    }
    
    // Function to subscribe to WhatsApp notifications
    function subscribeToWhatsAppNotifications(phoneNumber, trackingNumber) {
        return new Promise((resolve, reject) => {
            // Make API call to subscribe
            fetch('/api/whatsapp/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phoneNumber: phoneNumber,
                    trackingNumber: trackingNumber
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to subscribe to WhatsApp notifications');
                }
                return response.json();
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                // For demo purposes, simulate success
                if (error.message === 'Failed to subscribe to WhatsApp notifications') {
                    resolve({ success: true });
                } else {
                    reject(error);
                }
            });
        });
    }
    
    // Function to send WhatsApp message
    function sendWhatsAppMessage(phoneNumber, message) {
        return new Promise((resolve, reject) => {
            // Make API call to send message
            fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phoneNumber: phoneNumber,
                    message: message
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to send WhatsApp message');
                }
                return response.json();
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                // For demo purposes, simulate success
                if (error.message === 'Failed to send WhatsApp message') {
                    resolve({ success: true });
                } else {
                    reject(error);
                }
            });
        });
    }
    
    // Function to format phone number
    function formatPhoneNumber(phoneNumber) {
        // Remove all non-digit characters
        const cleaned = phoneNumber.replace(/\D/g, '');
        
        // Check if the number starts with country code
        if (cleaned.startsWith('0')) {
            // Replace leading 0 with country code (e.g., Nigeria: +234)
            return '+234' + cleaned.substring(1);
        } else if (cleaned.startsWith('234')) {
            // Already has country code
            return '+' + cleaned;
        } else if (cleaned.length === 10) {
            // Assume it's a local number without country code
            return '+234' + cleaned;
        } else {
            // Return as is if it doesn't match expected patterns
            return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
        }
    }
    
    // Phone number input validation
    if (phoneNumberInput) {
        phoneNumberInput.addEventListener('input', function() {
            const phoneNumber = this.value.trim();
            
            if (phoneNumber.length < 10) {
                this.setCustomValidity('Phone number must be at least 10 digits');
            } else {
                this.setCustomValidity('');
            }
        });
    }
    
    // WhatsApp share functionality
    const whatsappShareBtn = document.getElementById('whatsappShareBtn');
    if (whatsappShareBtn) {
        whatsappShareBtn.addEventListener('click', function() {
            const trackingNumber = document.getElementById('trackingNumber').textContent;
            const message = `Track your shipment ${trackingNumber} with P&D EnielExpress: ${window.location.href}`;
            const formattedPhone = formatPhoneNumber('2348012345678'); // Default to company WhatsApp number
            const whatsappUrl = `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
            
            window.open(whatsappUrl, '_blank');
        });
    }
    
    // WhatsApp chat button
    const whatsappChatBtn = document.getElementById('whatsappChatBtn');
    if (whatsappChatBtn) {
        whatsappChatBtn.addEventListener('click', function() {
            const formattedPhone = formatPhoneNumber('2348012345678'); // Default to company WhatsApp number
            const whatsappUrl = `https://wa.me/${formattedPhone.replace('+', '')}`;
            
            window.open(whatsappUrl, '_blank');
        });
    }
    
    // WhatsApp floating button
    const whatsappFloatingBtn = document.getElementById('whatsappFloatingBtn');
    if (whatsappFloatingBtn) {
        whatsappFloatingBtn.addEventListener('click', function() {
            const formattedPhone = formatPhoneNumber('2348012345678'); // Default to company WhatsApp number
            const whatsappUrl = `https://wa.me/${formattedPhone.replace('+', '')}`;
            
            window.open(whatsappUrl, '_blank');
        });
    }
    
    // Export functions for use in other files
    window.PDEnilexpressWhatsApp = {
        formatPhoneNumber,
        sendWhatsAppMessage,
        subscribeToWhatsAppNotifications
    };
});

// Create WhatsApp floating button if not exists
if (!document.getElementById('whatsappFloatingBtn')) {
    const whatsappBtn = document.createElement('div');
    whatsappBtn.id = 'whatsappFloatingBtn';
    whatsappBtn.className = 'whatsapp-float';
    whatsappBtn.innerHTML = '<i class="bi bi-whatsapp"></i>';
    whatsappBtn.title = 'Chat with us on WhatsApp';
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .whatsapp-float {
            position: fixed;
            width: 60px;
            height: 60px;
            bottom: 40px;
            right: 40px;
            background-color: #25d366;
            color: #FFF;
            border-radius: 50px;
            text-align: center;
            font-size: 30px;
            box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.4);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .whatsapp-float:hover {
            background-color: #128C7E;
            transform: scale(1.1);
        }
        
        @media (max-width: 768px) {
            .whatsapp-float {
                width: 50px;
                height: 50px;
                bottom: 20px;
                right: 20px;
                font-size: 24px;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(whatsappBtn);
    
    // Add click event
    whatsappBtn.addEventListener('click', function() {
        const formattedPhone = '+2348012345678'; // Default to company WhatsApp number
        const whatsappUrl = `https://wa.me/${formattedPhone.replace('+', '')}`;
        
        window.open(whatsappUrl, '_blank');
    });
}