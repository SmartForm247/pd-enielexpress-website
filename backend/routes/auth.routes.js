const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.'
});

// Register a new user
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;

        // Validate input
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Please provide a valid email' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login user
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get current user
router.get('/me', authMiddleware.requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/profile', authMiddleware.requireAuth, async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        
        // Find and update user
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { firstName, lastName, phone },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Change password
router.put('/password', authMiddleware.requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        // Find user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Validate input
        if (!email) {
            return res.status(400).json({ message: 'Please provide your email' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal that user doesn't exist
            return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent' });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1h' }
        );

        // In a real implementation, you would send an email with the reset link
        // For now, we'll just return success
        
        res.status(200).json({ 
            message: 'If an account with that email exists, a password reset link has been sent',
            resetToken // Only for demo purposes, don't include in production
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        // Validate input
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Please provide token and new password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        
        // Find user
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'Invalid or expired token' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;