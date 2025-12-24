const express = require('express');
const Shipment = require('../models/Shipment');
const authMiddleware = require('../middleware/auth.middleware');
const { sendTrackingUpdate } = require('../config/whatsapp');

const router = express.Router();

// Get shipment details by tracking number
router.get('/:trackingNumber', async (req, res) => {
    try {
        const { trackingNumber } = req.params;
        
        // Find shipment
        const shipment = await Shipment.findOne({ trackingNumber });
        
        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        res.status(200).json(shipment);
    } catch (error) {
        console.error('Get shipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new shipment
router.post('/', authMiddleware.requireAuth, async (req, res) => {
    try {
        const {
            senderName,
            senderPhone,
            senderEmail,
            senderAddress,
            recipientName,
            recipientPhone,
            recipientEmail,
            recipientAddress,
            packageDescription,
            packageWeight,
            packageValue,
            serviceType,
            origin,
            destination,
            estimatedDelivery
        } = req.body;

        // Generate tracking number
        const trackingNumber = generateTrackingNumber();

        // Create new shipment
        const shipment = new Shipment({
            trackingNumber,
            senderName,
            senderPhone,
            senderEmail,
            senderAddress,
            recipientName,
            recipientPhone,
            recipientEmail,
            recipientAddress,
            packageDescription,
            packageWeight,
            packageValue,
            serviceType,
            origin,
            destination,
            estimatedDelivery,
            status: 'Package Received',
            trackingHistory: [{
                status: 'Package Received',
                location: origin,
                date: new Date(),
                description: 'Package has been received at the origin facility'
            }],
            createdBy: req.user.id
        });

        await shipment.save();

        // Send WhatsApp notification to sender
        try {
            await sendTrackingUpdate(
                senderPhone,
                trackingNumber,
                'Package Received',
                origin,
                'Your package has been received and is being processed'
            );
        } catch (error) {
            console.error('Error sending WhatsApp notification:', error);
            // Continue even if WhatsApp notification fails
        }

        res.status(201).json({
            message: 'Shipment created successfully',
            shipment
        });
    } catch (error) {
        console.error('Create shipment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update shipment status
router.put('/:trackingNumber/status', authMiddleware.requireAuth, async (req, res) => {
    try {
        const { trackingNumber } = req.params;
        const { status, location, description } = req.body;

        // Find shipment
        const shipment = await Shipment.findOne({ trackingNumber });
        
        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        // Update status
        shipment.status = status;
        shipment.trackingHistory.push({
            status,
            location,
            date: new Date(),
            description
        });

        // Update delivery date if delivered
        if (status === 'Delivered') {
            shipment.actualDelivery = new Date();
        }

        await shipment.save();

        // Send WhatsApp notification
        try {
            await sendTrackingUpdate(
                shipment.recipientPhone,
                trackingNumber,
                status,
                location,
                description
            );
        } catch (error) {
            console.error('Error sending WhatsApp notification:', error);
            // Continue even if WhatsApp notification fails
        }

        res.status(200).json({
            message: 'Shipment status updated successfully',
            shipment
        });
    } catch (error) {
        console.error('Update shipment status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all shipments for a user
router.get('/user/:userId', authMiddleware.requireAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user is requesting their own shipments or is an admin
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Find shipments
        const shipments = await Shipment.find({
            $or: [
                { createdBy: userId },
                { senderEmail: req.user.email },
                { recipientEmail: req.user.email }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json(shipments);
    } catch (error) {
        console.error('Get user shipments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Subscribe to WhatsApp notifications for a shipment
router.post('/:trackingNumber/subscribe', async (req, res) => {
    try {
        const { trackingNumber } = req.params;
        const { phoneNumber } = req.body;

        // Validate phone number
        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        // Find shipment
        const shipment = await Shipment.findOne({ trackingNumber });
        
        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        // Add phone number to notification list if not already there
        if (!shipment.notificationPhoneNumbers) {
            shipment.notificationPhoneNumbers = [];
        }

        if (!shipment.notificationPhoneNumbers.includes(phoneNumber)) {
            shipment.notificationPhoneNumbers.push(phoneNumber);
            await shipment.save();
        }

        // Send confirmation message
        try {
            const { sendMessage } = require('../config/whatsapp');
            await sendMessage(
                phoneNumber,
                `You have successfully subscribed to tracking updates for shipment ${trackingNumber}. You will receive notifications when the status changes.`
            );
        } catch (error) {
            console.error('Error sending WhatsApp confirmation:', error);
            // Continue even if WhatsApp notification fails
        }

        res.status(200).json({
            message: 'Successfully subscribed to WhatsApp notifications',
            trackingNumber
        });
    } catch (error) {
        console.error('Subscribe to notifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper function to generate tracking number
function generateTrackingNumber() {
    const prefix = 'ENX';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
}

module.exports = router;