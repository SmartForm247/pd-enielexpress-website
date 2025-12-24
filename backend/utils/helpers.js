// Format currency
const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

// Format date
const formatDate = (date, options = {}) => {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

// Generate random string
const generateRandomString = (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
};

// Generate tracking number
const generateTrackingNumber = () => {
    const prefix = 'ENX';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
};

// Generate invoice number
const generateInvoiceNumber = () => {
    const prefix = 'INV';
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${year}${month}${day}${random}`;
};

// Calculate distance between two coordinates (in kilometers)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
};

// Convert degrees to radians
const deg2rad = (deg) => {
    return deg * (Math.PI/180);
};

// Calculate estimated delivery date based on service type and distance
const calculateEstimatedDelivery = (serviceType, distance) => {
    const now = new Date();
    let daysToAdd = 1;
    
    switch (serviceType) {
        case 'overnight':
            daysToAdd = 1;
            break;
        case 'express':
            daysToAdd = 2;
            break;
        case 'standard':
            daysToAdd = 5;
            break;
        case 'international':
            daysToAdd = 10;
            break;
        default:
            daysToAdd = 5;
    }
    
    // Adjust based on distance (add 1 day for every 1000km)
    if (distance > 1000) {
        daysToAdd += Math.floor(distance / 1000);
    }
    
    // Add days to current date
    const estimatedDate = new Date(now);
    estimatedDate.setDate(now.getDate() + daysToAdd);
    
    return estimatedDate;
};

// Calculate shipping cost based on weight, dimensions, and service type
const calculateShippingCost = (weight, dimensions, serviceType, distance) => {
    let baseCost = 5;
    
    // Add cost based on weight
    if (weight <= 1) {
        baseCost += 5;
    } else if (weight <= 5) {
        baseCost += 10;
    } else if (weight <= 10) {
        baseCost += 20;
    } else {
        baseCost += 30 + (weight - 10) * 2;
    }
    
    // Add cost based on dimensions (volumetric weight)
    if (dimensions && dimensions.length && dimensions.width && dimensions.height) {
        const volumetricWeight = (dimensions.length * dimensions.width * dimensions.height) / 5000;
        if (volumetricWeight > weight) {
            baseCost += (volumetricWeight - weight) * 2;
        }
    }
    
    // Add cost based on service type
    switch (serviceType) {
        case 'overnight':
            baseCost *= 3;
            break;
        case 'express':
            baseCost *= 2;
            break;
        case 'standard':
            baseCost *= 1;
            break;
        case 'international':
            baseCost *= 4;
            break;
        default:
            baseCost *= 1;
    }
    
    // Add cost based on distance
    if (distance > 100) {
        baseCost += (distance / 100) * 2;
    }
    
    return Math.round(baseCost * 100) / 100; // Round to 2 decimal places
};

// Paginate results
const paginate = (page = 1, limit = 10) => {
    const startIndex = (page - 1) * limit;
    return {
        limit,
        skip: startIndex
    };
};

// Create pagination response
const createPaginationResponse = (data, page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    
    return {
        data,
        pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };
};

// Send email (placeholder implementation)
const sendEmail = async (to, subject, text, html) => {
    // In a real implementation, you would use a service like Nodemailer with an SMTP server
    // or an email service like SendGrid, Mailgun, etc.
    
    console.log(`Sending email to ${to} with subject: ${subject}`);
    console.log(`Text: ${text}`);
    
    return new Promise((resolve, reject) => {
        // Simulate email sending
        setTimeout(() => {
            resolve({ success: true, message: 'Email sent successfully' });
        }, 1000);
    });
};

// Generate PDF (placeholder implementation)
const generatePDF = async (data, filename) => {
    // In a real implementation, you would use a library like Puppeteer or PDFKit
    
    console.log(`Generating PDF: ${filename}`);
    console.log(`Data: ${JSON.stringify(data)}`);
    
    return new Promise((resolve, reject) => {
        // Simulate PDF generation
        setTimeout(() => {
            resolve({ success: true, filename, path: `/pdfs/${filename}` });
        }, 1000);
    });
};

module.exports = {
    formatCurrency,
    formatDate,
    generateRandomString,
    generateTrackingNumber,
    generateInvoiceNumber,
    calculateDistance,
    calculateEstimatedDelivery,
    calculateShippingCost,
    paginate,
    createPaginationResponse,
    sendEmail,
    generatePDF
};