// Common admin JavaScript functions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Are you sure you want to logout?')) {
                // Clear local storage
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                
                // Redirect to login page
                window.location.href = 'login.html';
            }
        });
    }

    // Check authentication
    checkAuthentication();

    // Initialize all data tables
    initializeDataTables();

    // Initialize filter toggle
    initializeFilterToggle();

    // Initialize form submissions
    initializeFormSubmissions();
});

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    
    if (!token || !user) {
        // Redirect to login page
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const userData = JSON.parse(user);
        
        // Update user info in navbar
        const userDropdown = document.getElementById('navbarDropdown');
        if (userDropdown) {
            userDropdown.innerHTML = `<i class="bi bi-person-circle me-2"></i> ${userData.firstName} ${userData.lastName}`;
        }
    } catch (error) {
        console.error('Error parsing user data:', error);
        // Redirect to login page
        window.location.href = 'login.html';
    }
}

// Initialize data tables
function initializeDataTables() {
    // Shipments table
    const shipmentsTable = document.getElementById('shipmentsTable');
    if (shipmentsTable) {
        $(shipmentsTable).DataTable({
            responsive: true,
            pageLength: 10,
            order: [[7, 'desc']],
            ajax: {
                url: '/api/shipments',
                dataSrc: ''
            },
            columns: [
                { data: 'trackingNumber' },
                { data: 'senderName' },
                { data: 'recipientName' },
                { data: 'origin' },
                { data: 'destination' },
                { data: 'serviceType' },
                { 
                    data: 'status',
                    render: function(data) {
                        return `<span class="badge status-${data.toLowerCase().replace(/\s+/g, '-')}">${data}</span>`;
                    }
                },
                { 
                    data: 'createdAt',
                    render: function(data) {
                        return new Date(data).toLocaleDateString();
                    }
                },
                {
                    data: null,
                    render: function(data) {
                        return `
                            <div class="btn-group">
                                <button type="button" class="btn btn-sm btn-info view-shipment" data-id="${data._id}">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-warning update-status" data-id="${data._id}" data-tracking="${data.trackingNumber}">
                                    <i class="bi bi-pencil"></i>
                                </button>
                            </div>
                        `;
                    }
                }
            ]
        });
    }

    // Invoices table
    const invoicesTable = document.getElementById('invoicesTable');
    if (invoicesTable) {
        $(invoicesTable).DataTable({
            responsive: true,
            pageLength: 10,
            order: [[6, 'desc']],
            ajax: {
                url: '/api/invoices',
                dataSrc: ''
            },
            columns: [
                { data: 'invoiceNumber' },
                { data: 'customerName' },
                { 
                    data: 'total',
                    render: function(data) {
                        return '$' + parseFloat(data).toFixed(2);
                    }
                },
                { 
                    data: 'dueDate',
                    render: function(data) {
                        return new Date(data).toLocaleDateString();
                    }
                },
                { 
                    data: 'status',
                    render: function(data) {
                        return `<span class="badge status-${data.toLowerCase().replace(/\s+/g, '-')}">${data}</span>`;
                    }
                },
                { data: 'paymentMethod' },
                { 
                    data: 'createdAt',
                    render: function(data) {
                        return new Date(data).toLocaleDateString();
                    }
                },
                {
                    data: null,
                    render: function(data) {
                        return `
                            <div class="btn-group">
                                <button type="button" class="btn btn-sm btn-info view-invoice" data-id="${data._id}">
                                    <i class="bi bi-eye"></i>
                                </button>
                                ${data.status === 'pending_verification' ? `
                                    <button type="button" class="btn btn-sm btn-success verify-transfer" data-id="${data._id}">
                                        <i class="bi bi-check-circle"></i>
                                    </button>
                                ` : ''}
                            </div>
                        `;
                    }
                }
            ]
        });
    }

    // Payments table
    const paymentsTable = document.getElementById('paymentsTable');
    if (paymentsTable) {
        $(paymentsTable).DataTable({
            responsive: true,
            pageLength: 10,
            order: [[6, 'desc']],
            ajax: {
                url: '/api/payments',
                dataSrc: ''
            },
            columns: [
                { data: 'paymentId' },
                { data: 'invoiceNumber' },
                { data: 'customerName' },
                { 
                    data: 'amount',
                    render: function(data) {
                        return '$' + parseFloat(data).toFixed(2);
                    }
                },
                { data: 'paymentMethod' },
                { 
                    data: 'status',
                    render: function(data) {
                        return `<span class="badge status-${data.toLowerCase()}">${data}</span>`;
                    }
                },
                { 
                    data: 'paymentDate',
                    render: function(data) {
                        return new Date(data).toLocaleDateString();
                    }
                },
                {
                    data: null,
                    render: function(data) {
                        return `
                            <div class="btn-group">
                                <button type="button" class="btn btn-sm btn-info view-payment" data-id="${data._id}">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                        `;
                    }
                }
            ]
        });
    }

    // Customers table
    const customersTable = document.getElementById('customersTable');
    if (customersTable) {
        $(customersTable).DataTable({
            responsive: true,
            pageLength: 10,
            order: [[4, 'desc']],
            ajax: {
                url: '/api/customers',
                dataSrc: ''
            },
            columns: [
                { data: '_id' },
                { 
                    data: null,
                    render: function(data) {
                        return `${data.firstName} ${data.lastName}`;
                    }
                },
                { data: 'email' },
                { data: 'phone' },
                { 
                    data: 'createdAt',
                    render: function(data) {
                        return new Date(data).toLocaleDateString();
                    }
                },
                { 
                    data: 'lastLogin',
                    render: function(data) {
                        return data ? new Date(data).toLocaleDateString() : 'Never';
                    }
                },
                { 
                    data: 'isActive',
                    render: function(data) {
                        return `<span class="badge ${data ? 'bg-success' : 'bg-danger'}">${data ? 'Active' : 'Inactive'}</span>`;
                    }
                },
                {
                    data: null,
                    render: function(data) {
                        return `
                            <div class="btn-group">
                                <button type="button" class="btn btn-sm btn-info view-customer" data-id="${data._id}">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-warning edit-customer" data-id="${data._id}">
                                    <i class="bi bi-pencil"></i>
                                </button>
                            </div>
                        `;
                    }
                }
            ]
        });
    }
}

// Initialize filter toggle
function initializeFilterToggle() {
    const filterBtn = document.getElementById('filterBtn');
    const filterSection = document.getElementById('filterSection');
    
    if (filterBtn && filterSection) {
        filterBtn.addEventListener('click', function() {
            if (filterSection.style.display === 'none') {
                filterSection.style.display = 'block';
            } else {
                filterSection.style.display = 'none';
            }
        });
    }
}

// Initialize form submissions
function initializeFormSubmissions() {
    // Filter forms
    const filterForms = document.querySelectorAll('#filterForm');
    filterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            applyFilters();
        });
    });

    // Reset filter buttons
    const resetFilterBtns = document.querySelectorAll('#resetFiltersBtn');
    resetFilterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const form = this.closest('#filterForm');
            form.reset();
            applyFilters();
        });
    });
}

// Apply filters to data tables
function applyFilters() {
    // This would be implemented based on the specific page
    console.log('Applying filters...');
}

// Show loading state
function showLoading(element, text = 'Loading...') {
    const originalContent = element.innerHTML;
    element.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> ${text}`;
    element.disabled = true;
    return originalContent;
}

// Hide loading state
function hideLoading(element, originalContent) {
    element.innerHTML = originalContent;
    element.disabled = false;
}

// Show alert message
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

// Format currency
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Format date
function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

// Export functions for use in other files
window.AdminUtils = {
    showLoading,
    hideLoading,
    showAlert,
    formatCurrency,
    formatDate
};