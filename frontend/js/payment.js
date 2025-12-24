// Payment functionality for P&D EnielExpress

document.addEventListener('DOMContentLoaded', function() {
    // Get payment form elements
    const paymentForm = document.getElementById('paymentForm');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const cardPaymentSection = document.getElementById('cardPaymentSection');
    const bankTransferSection = document.getElementById('bankTransferSection');
    const paystackBtn = document.getElementById('paystackBtn');
    const invoiceNumber = document.getElementById('invoiceNumber');
    
    // Get invoice number from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceParam = urlParams.get('invoice');
    
    if (invoiceParam && invoiceNumber) {
        invoiceNumber.value = invoiceParam;
        loadInvoiceDetails(invoiceParam);
    }
    
    // Payment method change event
    if (paymentMethodSelect) {
        paymentMethodSelect.addEventListener('change', function() {
            const selectedMethod = this.value;
            
            // Hide all payment sections
            if (cardPaymentSection) cardPaymentSection.style.display = 'none';
            if (bankTransferSection) bankTransferSection.style.display = 'none';
            
            // Show selected payment section
            if (selectedMethod === 'card' && cardPaymentSection) {
                cardPaymentSection.style.display = 'block';
            } else if (selectedMethod === 'bank' && bankTransferSection) {
                bankTransferSection.style.display = 'block';
            }
        });
    }
    
    // Paystack button click event
    if (paystackBtn) {
        paystackBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const invoiceId = invoiceNumber.value.trim();
            if (!invoiceId) {
                invoiceNumber.classList.add('is-invalid');
                return;
            }
            
            // Show loading state
            const originalBtnText = PDEnilexpress.showLoading(paystackBtn, 'Processing...');
            
            // Get invoice details
            fetch(`/api/invoices/${invoiceId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Invoice not found');
                    }
                    return response.json();
                })
                .then(invoice => {
                    // Initialize Paystack payment
                    initializePaystackPayment(invoice);
                })
                .catch(error => {
                    // Show error message
                    PDEnilexpress.showAlert(error.message, 'danger');
                    
                    // Reset button
                    PDEnilexpress.hideLoading(paystackBtn, originalBtnText);
                });
        });
    }
    
    // Payment form submission
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(paymentForm);
            const paymentMethod = formData.get('paymentMethod');
            
            if (paymentMethod === 'card') {
                // Card payment is handled by Paystack
                return;
            } else if (paymentMethod === 'bank') {
                // Process bank transfer
                processBankTransfer(formData);
            }
        });
    }
    
    // Function to load invoice details
    function loadInvoiceDetails(invoiceId) {
        fetch(`/api/invoices/${invoiceId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Invoice not found');
                }
                return response.json();
            })
            .then(invoice => {
                // Update invoice details on the page
                document.getElementById('invoiceAmount').textContent = PDEnilexpress.formatCurrency(invoice.amount);
                document.getElementById('invoiceDueDate').textContent = PDEnilexpress.formatDate(invoice.dueDate);
                document.getElementById('invoiceDescription').textContent = invoice.description;
                
                // Update payment form
                document.getElementById('paymentAmount').value = invoice.amount;
            })
            .catch(error => {
                // Show error message
                PDEnilexpress.showAlert(error.message, 'danger');
            });
    }
    
    // Function to initialize Paystack payment
    function initializePaystackPayment(invoice) {
        // For demo purposes, we'll use a mock Paystack handler
        // In a real implementation, you would use the actual Paystack library
        
        // Mock Paystack handler
        const mockPaystackHandler = {
            open: function(options) {
                // Simulate payment processing
                setTimeout(() => {
                    // Show success message
                    PDEnilexpress.showAlert('Payment successful! Your invoice has been paid.', 'success');
                    
                    // Redirect to invoice page
                    window.location.href = `invoice.html?id=${invoice.id}&paid=true`;
                }, 2000);
            }
        };
        
        // Open Paystack payment modal
        mockPaystackHandler.open({
            key: 'pk_test_demo', // In a real implementation, use your actual Paystack public key
            email: invoice.customerEmail,
            amount: invoice.amount * 100, // Paystack expects amount in kobo/cents
            currency: invoice.currency || 'NGN',
            ref: `ENX${Date.now()}`, // Generate a unique reference
            callback: function(response) {
                // Payment successful
                verifyPayment(response.reference, invoice.id);
            },
            onClose: function() {
                // Reset button
                PDEnilexpress.hideLoading(paystackBtn, 'Pay with Paystack');
            }
        });
    }
    
    // Function to verify payment
    function verifyPayment(reference, invoiceId) {
        fetch('/api/payments/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reference: reference,
                invoiceId: invoiceId
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Payment verification failed');
            }
            return response.json();
        })
        .then(data => {
            // Show success message
            PDEnilexpress.showAlert('Payment verified successfully!', 'success');
            
            // Redirect to invoice page
            window.location.href = `invoice.html?id=${invoiceId}&paid=true`;
        })
        .catch(error => {
            // Show error message
            PDEnilexpress.showAlert(error.message, 'danger');
            
            // Reset button
            PDEnilexpress.hideLoading(paystackBtn, 'Pay with Paystack');
        });
    }
    
    // Function to process bank transfer
    function processBankTransfer(formData) {
        const invoiceId = formData.get('invoiceId');
        const transferProof = formData.get('transferProof');
        
        if (!transferProof) {
            PDEnilexpress.showAlert('Please upload proof of transfer', 'warning');
            return;
        }
        
        // Show loading state
        const submitBtn = document.querySelector('#bankTransferSection button[type="submit"]');
        const originalBtnText = PDEnilexpress.showLoading(submitBtn, 'Submitting...');
        
        // Create form data for file upload
        const uploadData = new FormData();
        uploadData.append('invoiceId', invoiceId);
        uploadData.append('transferProof', transferProof);
        
        // Submit proof of transfer
        fetch('/api/payments/bank-transfer', {
            method: 'POST',
            body: uploadData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to submit proof of transfer');
            }
            return response.json();
        })
        .then(data => {
            // Show success message
            PDEnilexpress.showAlert('Proof of transfer submitted successfully. We will verify and update your payment status.', 'success');
            
            // Reset form
            paymentForm.reset();
            
            // Redirect to invoice page
            setTimeout(() => {
                window.location.href = `invoice.html?id=${invoiceId}`;
            }, 3000);
        })
        .catch(error => {
            // Show error message
            PDEnilexpress.showAlert(error.message, 'danger');
            
            // Reset button
            PDEnilexpress.hideLoading(submitBtn, originalBtnText);
        });
    }
    
    // For demo purposes, mock the invoice data
    function getMockInvoiceData(invoiceId) {
        return {
            id: invoiceId,
            amount: 150.00,
            currency: 'USD',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            description: 'International Shipping - ENX123456789',
            customerEmail: 'customer@example.com'
        };
    }
    
    // For demo purposes, use mock data if API is not available
    if (typeof loadInvoiceDetails === 'function') {
        const originalLoadInvoiceDetails = loadInvoiceDetails;
        loadInvoiceDetails = function(invoiceId) {
            // Get mock data
            const invoice = getMockInvoiceData(invoiceId);
            
            // Update invoice details on the page
            document.getElementById('invoiceAmount').textContent = PDEnilexpress.formatCurrency(invoice.amount);
            document.getElementById('invoiceDueDate').textContent = PDEnilexpress.formatDate(invoice.dueDate);
            document.getElementById('invoiceDescription').textContent = invoice.description;
            
            // Update payment form
            document.getElementById('paymentAmount').value = invoice.amount;
        };
    }
});