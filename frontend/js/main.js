// Main JavaScript file for P&D EnielExpress website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add animation to elements when they come into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with the animate-on-scroll class
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });

    // Form validation
    const forms = document.querySelectorAll('.needs-validation');
    Array.prototype.slice.call(forms).forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });

    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const formObject = {};
            formData.forEach((value, key) => {
                formObject[key] = value;
            });
            
            // Show loading state
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Sending...';
            submitBtn.disabled = true;
            
            // Simulate API call (replace with actual API call)
            setTimeout(() => {
                // Reset form
                contactForm.reset();
                contactForm.classList.remove('was-validated');
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Show success modal
                const successModal = new bootstrap.Modal(document.getElementById('successModal'));
                successModal.show();
            }, 1500);
        });
    }

    // Newsletter subscription
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = newsletterForm.querySelector('input[type="email"]').value;
            
            // Show loading state
            const submitBtn = newsletterForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Subscribing...';
            submitBtn.disabled = true;
            
            // Simulate API call (replace with actual API call)
            setTimeout(() => {
                // Reset form
                newsletterForm.reset();
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Show success message
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-success alert-dismissible fade show';
                alertDiv.innerHTML = `
                    <strong>Success!</strong> You've been subscribed to our newsletter.
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;
                newsletterForm.parentNode.insertBefore(alertDiv, newsletterForm);
                
                // Remove alert after 5 seconds
                setTimeout(() => {
                    alertDiv.remove();
                }, 5000);
            }, 1500);
        });
    }

    // Quick track functionality on homepage
    const quickTrackBtn = document.getElementById('quickTrackBtn');
    const quickTrackInput = document.getElementById('quickTrackInput');
    
    if (quickTrackBtn && quickTrackInput) {
        quickTrackBtn.addEventListener('click', function() {
            const trackingNumber = quickTrackInput.value.trim();
            if (trackingNumber) {
                // Redirect to tracking page with the tracking number
                window.location.href = `tracking.html?number=${encodeURIComponent(trackingNumber)}`;
            } else {
                // Show error
                quickTrackInput.classList.add('is-invalid');
                setTimeout(() => {
                    quickTrackInput.classList.remove('is-invalid');
                }, 3000);
            }
        });
        
        quickTrackInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                quickTrackBtn.click();
            }
        });
    }

    // Initialize date pickers
    const datePickers = document.querySelectorAll('.date-picker');
    datePickers.forEach(picker => {
        picker.flatpickr({
            dateFormat: 'Y-m-d',
            maxDate: 'today'
        });
    });

    // File upload preview
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById(input.dataset.preview);
                    if (preview) {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    });

    // Copy to clipboard functionality
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const textToCopy = this.dataset.copy;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check"></i> Copied!';
                setTimeout(() => {
                    this.innerHTML = originalText;
                }, 2000);
            });
        });
    });

    // Initialize any other components or functionality
    console.log('P&D EnielExpress website initialized');
});

// Utility functions
function showLoading(element, text = 'Loading...') {
    const originalContent = element.innerHTML;
    element.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> ${text}`;
    element.disabled = true;
    return originalContent;
}

function hideLoading(element, originalContent) {
    element.innerHTML = originalContent;
    element.disabled = false;
}

function showAlert(message, type = 'info', container = 'body') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.querySelector(container).appendChild(alertDiv);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Export functions for use in other files
window.PDEnilexpress = {
    showLoading,
    hideLoading,
    showAlert,
    formatCurrency,
    formatDate,
    debounce
};