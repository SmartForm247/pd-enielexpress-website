const validator = require('validator');
const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    
    next();
};

// Validate user registration
const validateUserRegistration = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    
    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    
    body('phone')
        .optional()
        .trim()
        .matches(/^\+?[0-9]{10,15}$/).withMessage('Please provide a valid phone number'),
    
    handleValidationErrors
];

// Validate user login
const validateUserLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required'),
    
    handleValidationErrors
];

// Validate shipment creation
const validateShipmentCreation = [
    body('senderName')
        .trim()
        .notEmpty().withMessage('Sender name is required'),
    
    body('senderPhone')
        .trim()
        .notEmpty().withMessage('Sender phone is required')
        .matches(/^\+?[0-9]{10,15}$/).withMessage('Please provide a valid phone number'),
    
    body('senderEmail')
        .trim()
        .notEmpty().withMessage('Sender email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('senderAddress')
        .trim()
        .notEmpty().withMessage('Sender address is required'),
    
    body('recipientName')
        .trim()
        .notEmpty().withMessage('Recipient name is required'),
    
    body('recipientPhone')
        .trim()
        .notEmpty().withMessage('Recipient phone is required')
        .matches(/^\+?[0-9]{10,15}$/).withMessage('Please provide a valid phone number'),
    
    body('recipientEmail')
        .trim()
        .notEmpty().withMessage('Recipient email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('recipientAddress')
        .trim()
        .notEmpty().withMessage('Recipient address is required'),
    
    body('packageDescription')
        .trim()
        .notEmpty().withMessage('Package description is required'),
    
    body('packageWeight')
        .isNumeric().withMessage('Package weight must be a number')
        .isFloat({ min: 0 }).withMessage('Package weight must be positive'),
    
    body('packageValue')
        .isNumeric().withMessage('Package value must be a number')
        .isFloat({ min: 0 }).withMessage('Package value must be positive'),
    
    body('serviceType')
        .isIn(['standard', 'express', 'overnight', 'international']).withMessage('Invalid service type'),
    
    body('origin')
        .trim()
        .notEmpty().withMessage('Origin is required'),
    
    body('destination')
        .trim()
        .notEmpty().withMessage('Destination is required'),
    
    body('estimatedDelivery')
        .isISO8601().withMessage('Estimated delivery must be a valid date')
        .toDate(),
    
    handleValidationErrors
];

// Validate tracking number
const validateTrackingNumber = [
    param('trackingNumber')
        .trim()
        .notEmpty().withMessage('Tracking number is required')
        .isAlphanumeric().withMessage('Tracking number must be alphanumeric'),
    
    handleValidationErrors
];

// Validate invoice creation
const validateInvoiceCreation = [
    body('customerId')
        .notEmpty().withMessage('Customer ID is required')
        .isMongoId().withMessage('Invalid customer ID'),
    
    body('customerName')
        .trim()
        .notEmpty().withMessage('Customer name is required'),
    
    body('customerEmail')
        .trim()
        .notEmpty().withMessage('Customer email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('customerPhone')
        .trim()
        .notEmpty().withMessage('Customer phone is required')
        .matches(/^\+?[0-9]{10,15}$/).withMessage('Please provide a valid phone number'),
    
    body('customerAddress')
        .trim()
        .notEmpty().withMessage('Customer address is required'),
    
    body('items')
        .isArray({ min: 1 }).withMessage('At least one item is required'),
    
    body('items.*.description')
        .trim()
        .notEmpty().withMessage('Item description is required'),
    
    body('items.*.quantity')
        .isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
    
    body('items.*.price')
        .isFloat({ min: 0 }).withMessage('Item price must be positive'),
    
    body('subtotal')
        .isFloat({ min: 0 }).withMessage('Subtotal must be positive'),
    
    body('tax')
        .isFloat({ min: 0 }).withMessage('Tax must be positive'),
    
    body('total')
        .isFloat({ min: 0 }).withMessage('Total must be positive'),
    
    body('dueDate')
        .isISO8601().withMessage('Due date must be a valid date')
        .toDate(),
    
    handleValidationErrors
];

// Validate payment
const validatePayment = [
    body('invoiceId')
        .notEmpty().withMessage('Invoice ID is required')
        .isMongoId().withMessage('Invalid invoice ID'),
    
    handleValidationErrors
];

// Validate bank transfer
const validateBankTransfer = [
    body('invoiceId')
        .notEmpty().withMessage('Invoice ID is required')
        .isMongoId().withMessage('Invalid invoice ID'),
    
    handleValidationErrors
];

// Validate pagination
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    
    handleValidationErrors
];

// Validate ID parameter
const validateId = [
    param('id')
        .notEmpty().withMessage('ID is required')
        .isMongoId().withMessage('Invalid ID'),
    
    handleValidationErrors
];

// Validate email for forgot password
const validateForgotPassword = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    handleValidationErrors
];

// Validate reset password
const validateResetPassword = [
    body('token')
        .trim()
        .notEmpty().withMessage('Token is required'),
    
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    
    handleValidationErrors
];

// Validate change password
const validateChangePassword = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),
    
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    
    handleValidationErrors
];

// Validate profile update
const validateProfileUpdate = [
    body('firstName')
        .optional()
        .trim()
        .notEmpty().withMessage('First name cannot be empty')
        .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    
    body('lastName')
        .optional()
        .trim()
        .notEmpty().withMessage('Last name cannot be empty')
        .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    
    body('phone')
        .optional()
        .trim()
        .matches(/^\+?[0-9]{10,15}$/).withMessage('Please provide a valid phone number'),
    
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateUserRegistration,
    validateUserLogin,
    validateShipmentCreation,
    validateTrackingNumber,
    validateInvoiceCreation,
    validatePayment,
    validateBankTransfer,
    validatePagination,
    validateId,
    validateForgotPassword,
    validateResetPassword,
    validateChangePassword,
    validateProfileUpdate
};