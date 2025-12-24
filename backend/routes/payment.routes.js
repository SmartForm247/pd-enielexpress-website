const express = require('express');
const Invoice = require('../models/Invoice');
const Shipment = require('../models/Shipment');
const authMiddleware = require('../middleware/auth.middleware');
const { initializePayment, verifyPayment } = require('../config/paystack');
const { sendPaymentConfirmation } = require('../config/whatsapp');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Initialize payment
router.post('/initialize', authMiddleware.requireAuth, async (req, res) => {
    try {
        const { invoiceId } = req.body;

        // Find invoice
        const invoice = await Invoice.findById(invoiceId);
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Check if invoice is already paid
        if (invoice.status === 'paid') {
            return res.status(400).json({ message: 'Invoice is already paid' });
        }

        // Generate reference
        const reference = `ENX${Date.now()}`;

        // Initialize payment with Paystack
        initializePayment(
            invoice.customerEmail,
            invoice.amount,
            reference,
            async (response) => {
                // Payment successful
                try {
                    // Verify payment
                    const paymentData = await verifyPayment(response.reference);
                    
                    if (paymentData.status === 'success') {
                        // Update invoice status
                        invoice.status = 'paid';
                        invoice.paymentDate = new Date();
                        invoice.paymentReference = response.reference;
                        invoice.paymentMethod = 'card';
                        
                        await invoice.save();

                        // Update related shipment if exists
                        if (invoice.shipmentId) {
                            await Shipment.findByIdAndUpdate(
                                invoice.shipmentId,
                                { $set: { paymentStatus: 'paid' } }
                            );
                        }

                        // Send WhatsApp confirmation
                        try {
                            await sendPaymentConfirmation(
                                invoice.customerPhone,
                                invoice.invoiceNumber,
                                invoice.amount,
                                invoice.paymentDate
                            );
                        } catch (error) {
                            console.error('Error sending WhatsApp notification:', error);
                            // Continue even if WhatsApp notification fails
                        }

                        res.status(200).json({
                            message: 'Payment successful',
                            invoice
                        });
                    } else {
                        res.status(400).json({
                            message: 'Payment verification failed',
                            details: paymentData
                        });
                    }
                } catch (error) {
                    console.error('Payment verification error:', error);
                    res.status(500).json({ message: 'Server error during payment verification' });
                }
            }
        );

        res.status(200).json({
            message: 'Payment initialized',
            reference
        });
    } catch (error) {
        console.error('Initialize payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify payment
router.post('/verify', async (req, res) => {
    try {
        const { reference, invoiceId } = req.body;

        // Verify payment with Paystack
        const paymentData = await verifyPayment(reference);
        
        if (paymentData.status !== 'success') {
            return res.status(400).json({
                message: 'Payment verification failed',
                details: paymentData
            });
        }

        // Find invoice
        const invoice = await Invoice.findById(invoiceId);
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Update invoice status
        invoice.status = 'paid';
        invoice.paymentDate = new Date();
        invoice.paymentReference = reference;
        invoice.paymentMethod = 'card';
        
        await invoice.save();

        // Update related shipment if exists
        if (invoice.shipmentId) {
            await Shipment.findByIdAndUpdate(
                invoice.shipmentId,
                { $set: { paymentStatus: 'paid' } }
            );
        }

        // Send WhatsApp confirmation
        try {
            await sendPaymentConfirmation(
                invoice.customerPhone,
                invoice.invoiceNumber,
                invoice.amount,
                invoice.paymentDate
            );
        } catch (error) {
            console.error('Error sending WhatsApp notification:', error);
            // Continue even if WhatsApp notification fails
        }

        res.status(200).json({
            message: 'Payment verified successfully',
            invoice
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit bank transfer proof
router.post('/bank-transfer', upload.single('transferProof'), async (req, res) => {
    try {
        const { invoiceId } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload proof of transfer' });
        }

        // Find invoice
        const invoice = await Invoice.findById(invoiceId);
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Check if invoice is already paid
        if (invoice.status === 'paid') {
            return res.status(400).json({ message: 'Invoice is already paid' });
        }

        // Update invoice with transfer proof
        invoice.transferProof = req.file.path;
        invoice.paymentMethod = 'bank';
        invoice.status = 'pending_verification';
        
        await invoice.save();

        // In a real implementation, you would:
        // 1. Notify admin about the new transfer proof
        // 2. Admin would verify the payment
        // 3. Update the invoice status to 'paid' after verification

        res.status(200).json({
            message: 'Proof of transfer submitted successfully. Your payment will be verified shortly.',
            invoice
        });
    } catch (error) {
        console.error('Bank transfer error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get payment history for a user
router.get('/history/:userId', authMiddleware.requireAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user is requesting their own payment history or is an admin
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Find invoices for the user
        const invoices = await Invoice.find({ customerId: userId })
            .sort({ createdAt: -1 });

        res.status(200).json(invoices);
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify bank transfer (admin only)
router.put('/verify-bank-transfer/:invoiceId', authMiddleware.requireAuth, authMiddleware.requireAdmin, async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const { verified, notes } = req.body;

        // Find invoice
        const invoice = await Invoice.findById(invoiceId);
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Update invoice status
        if (verified) {
            invoice.status = 'paid';
            invoice.paymentDate = new Date();
            invoice.adminNotes = notes;
            
            // Update related shipment if exists
            if (invoice.shipmentId) {
                await Shipment.findByIdAndUpdate(
                    invoice.shipmentId,
                    { $set: { paymentStatus: 'paid' } }
                );
            }

            // Send WhatsApp confirmation
            try {
                await sendPaymentConfirmation(
                    invoice.customerPhone,
                    invoice.invoiceNumber,
                    invoice.amount,
                    invoice.paymentDate
                );
            } catch (error) {
                console.error('Error sending WhatsApp notification:', error);
                // Continue even if WhatsApp notification fails
            }
        } else {
            invoice.status = 'payment_rejected';
            invoice.adminNotes = notes;
        }

        await invoice.save();

        res.status(200).json({
            message: `Bank transfer ${verified ? 'verified' : 'rejected'} successfully`,
            invoice
        });
    } catch (error) {
        console.error('Verify bank transfer error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;