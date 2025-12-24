const express = require('express');
const Shipment = require('../models/Shipment');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Process scanned QR code or barcode
router.post('/process', async (req, res) => {
    try {
        const { code, type } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Code is required' });
        }

        let trackingNumber;

        // Parse the code based on type
        if (type === 'qr') {
            // Try to parse QR code data
            try {
                const data = JSON.parse(code);
                trackingNumber = data.trackingNumber || data.tracking_id || data.id;
            } catch (e) {
                // If not JSON, check if it's a URL with tracking number
                if (code.includes('tracking') || code.includes('track')) {
                    const url = new URL(code);
                    trackingNumber = url.searchParams.get('number') || 
                                    url.searchParams.get('id') || 
                                    url.searchParams.get('tracking');
                } else {
                    // Assume it's a plain tracking number
                    trackingNumber = code;
                }
            }
        } else if (type === 'barcode') {
            // For barcodes, assume it's a plain tracking number
            trackingNumber = code;
        } else {
            // Try to auto-detect
            try {
                const data = JSON.parse(code);
                trackingNumber = data.trackingNumber || data.tracking_id || data.id;
            } catch (e) {
                trackingNumber = code;
            }
        }

        if (!trackingNumber) {
            return res.status(400).json({ message: 'Could not extract tracking number from code' });
        }

        // Find shipment
        const shipment = await Shipment.findOne({ trackingNumber });
        
        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        res.status(200).json({
            message: 'Code processed successfully',
            trackingNumber,
            shipment
        });
    } catch (error) {
        console.error('Process scan error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update shipment location by scanning
router.post('/update-location', authMiddleware.requireAuth, async (req, res) => {
    try {
        const { trackingNumber, location, status, description } = req.body;

        if (!trackingNumber || !location) {
            return res.status(400).json({ message: 'Tracking number and location are required' });
        }

        // Find shipment
        const shipment = await Shipment.findOne({ trackingNumber });
        
        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        // Update status and location
        if (status) {
            shipment.status = status;
        }
        
        shipment.trackingHistory.push({
            status: status || shipment.status,
            location,
            date: new Date(),
            description: description || `Scanned at ${location}`
        });

        // Update delivery date if delivered
        if (status === 'Delivered') {
            shipment.actualDelivery = new Date();
        }

        await shipment.save();

        // Send WhatsApp notification
        try {
            const { sendTrackingUpdate } = require('../config/whatsapp');
            await sendTrackingUpdate(
                shipment.recipientPhone,
                trackingNumber,
                status || shipment.status,
                location,
                description || `Scanned at ${location}`
            );
        } catch (error) {
            console.error('Error sending WhatsApp notification:', error);
            // Continue even if WhatsApp notification fails
        }

        res.status(200).json({
            message: 'Shipment location updated successfully',
            shipment
        });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Generate QR code for a shipment
router.get('/qr/:trackingNumber', async (req, res) => {
    try {
        const { trackingNumber } = req.params;

        // Find shipment
        const shipment = await Shipment.findOne({ trackingNumber });
        
        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        // In a real implementation, you would use a QR code library like qrcode
        // For now, we'll just return the data that would be encoded
        const qrData = {
            trackingNumber,
            origin: shipment.origin,
            destination: shipment.destination,
            status: shipment.status
        };

        res.status(200).json({
            message: 'QR code data generated successfully',
            qrData,
            qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(qrData))}`
        });
    } catch (error) {
        console.error('Generate QR code error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Generate barcode for a shipment
router.get('/barcode/:trackingNumber', async (req, res) => {
    try {
        const { trackingNumber } = req.params;

        // Find shipment
        const shipment = await Shipment.findOne({ trackingNumber });
        
        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        // In a real implementation, you would use a barcode library like bwip-js
        // For now, we'll just return the data that would be encoded
        res.status(200).json({
            message: 'Barcode data generated successfully',
            barcodeData: trackingNumber,
            barcodeUrl: `https://api.barcode.com/v1/barcode?data=${trackingNumber}&type=code128`
        });
    } catch (error) {
        console.error('Generate barcode error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;