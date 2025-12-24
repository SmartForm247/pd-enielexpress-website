const express = require('express');
const { sendMessage, sendTrackingUpdate, sendPaymentConfirmation, sendDeliveryNotification } = require('../config/whatsapp');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Send a WhatsApp message
router.post('/send', authMiddleware.requireAuth, async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;

        if (!phoneNumber || !message) {
            return res.status(400).json({ message: 'Phone number and message are required' });
        }

        // Send message
        const response = await sendMessage(phoneNumber, message);

        res.status(200).json({
            message: 'Message sent successfully',
            response
        });
    } catch (error) {
        console.error('Send WhatsApp message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Subscribe to WhatsApp notifications
router.post('/subscribe', async (req, res) => {
    try {
        const { phoneNumber, trackingNumber } = req.body;

        if (!phoneNumber || !trackingNumber) {
            return res.status(400).json({ message: 'Phone number and tracking number are required' });
        }

        // Find shipment
        const Shipment = require('../models/Shipment');
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
        await sendMessage(
            phoneNumber,
            `You have successfully subscribed to tracking updates for shipment ${trackingNumber}. You will receive notifications when the status changes.`
        );

        res.status(200).json({
            message: 'Successfully subscribed to WhatsApp notifications',
            trackingNumber
        });
    } catch (error) {
        console.error('Subscribe to notifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send tracking update
router.post('/tracking-update', authMiddleware.requireAuth, async (req, res) => {
    try {
        const { phoneNumber, trackingNumber, status, location, description } = req.body;

        if (!phoneNumber || !trackingNumber || !status || !location) {
            return res.status(400).json({ message: 'Phone number, tracking number, status, and location are required' });
        }

        // Send tracking update
        const response = await sendTrackingUpdate(phoneNumber, trackingNumber, status, location, description);

        res.status(200).json({
            message: 'Tracking update sent successfully',
            response
        });
    } catch (error) {
        console.error('Send tracking update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send payment confirmation
router.post('/payment-confirmation', authMiddleware.requireAuth, async (req, res) => {
    try {
        const { phoneNumber, invoiceNumber, amount, paymentDate } = req.body;

        if (!phoneNumber || !invoiceNumber || !amount) {
            return res.status(400).json({ message: 'Phone number, invoice number, and amount are required' });
        }

        // Send payment confirmation
        const response = await sendPaymentConfirmation(phoneNumber, invoiceNumber, amount, paymentDate);

        res.status(200).json({
            message: 'Payment confirmation sent successfully',
            response
        });
    } catch (error) {
        console.error('Send payment confirmation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send delivery notification
router.post('/delivery-notification', authMiddleware.requireAuth, async (req, res) => {
    try {
        const { phoneNumber, trackingNumber, recipientName, deliveryTime } = req.body;

        if (!phoneNumber || !trackingNumber || !recipientName) {
            return res.status(400).json({ message: 'Phone number, tracking number, and recipient name are required' });
        }

        // Send delivery notification
        const response = await sendDeliveryNotification(phoneNumber, trackingNumber, recipientName, deliveryTime);

        res.status(200).json({
            message: 'Delivery notification sent successfully',
            response
        });
    } catch (error) {
        console.error('Send delivery notification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get WhatsApp status
router.get('/status', authMiddleware.requireAuth, authMiddleware.requireAdmin, async (req, res) => {
    try {
        const { client } = require('../config/whatsapp');
        
        // Get WhatsApp client status
        const status = {
            ready: client.info ? true : false,
            phone: client.info ? client.info.wid.user : null,
            platform: client.info ? client.info.platform : null,
            connected: client.info ? client.info.connected : false
        };

        res.status(200).json({
            message: 'WhatsApp status retrieved successfully',
            status
        });
    } catch (error) {
        console.error('Get WhatsApp status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;