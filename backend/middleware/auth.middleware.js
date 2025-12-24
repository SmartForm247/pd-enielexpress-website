const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const requireAuth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }
        
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        
        // Find user
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }
        
        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ message: 'Account is deactivated.' });
        }
        
        // Add user to request object
        req.user = user;
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired.' });
        }
        
        res.status(500).json({ message: 'Server error.' });
    }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    next();
};

// Middleware to check if user owns the resource or is admin
const requireOwnershipOrAdmin = (resourceField = 'createdBy') => {
    return (req, res, next) => {
        // Admins can access any resource
        if (req.user.role === 'admin') {
            return next();
        }
        
        // Check if user owns the resource
        // This will be handled in the route handler after fetching the resource
        req.requireOwnership = true;
        req.resourceField = resourceField;
        
        next();
    };
};

// Middleware to check ownership after resource is fetched
const checkOwnership = (resource) => {
    return (req, res, next) => {
        if (!req.requireOwnership) {
            return next();
        }
        
        const resourceField = req.resourceField || 'createdBy';
        const resourceId = resource[resourceField];
        
        if (!resourceId || resourceId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied. You do not own this resource.' });
        }
        
        next();
    };
};

module.exports = {
    requireAuth,
    requireAdmin,
    requireOwnershipOrAdmin,
    checkOwnership
};