const express = require('express');
const Invoice = require('../models/Invoice');
const Shipment = require('../models/Shipment');
const authMiddleware = require('../middleware/auth.middleware');
const { formatCurrency } = require('../utils/helpers');

const router = express.Router();

// Get invoice by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find invoice
        const invoice = await Invoice.findById(id);
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.status(200).json(invoice);
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new invoice
router.post('/', authMiddleware.requireAuth, async (req, res) => {
    try {
        const {
            customerId,
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            items,
            subtotal,
            tax,
            total,
            dueDate,
            shipmentId,
            notes
        } = req.body;

        // Generate invoice number
        const invoiceNumber = generateInvoiceNumber();

        // Create new invoice
        const invoice = new Invoice({
            invoiceNumber,
            customerId,
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            items,
            subtotal,
            tax,
            total,
            dueDate,
            shipmentId,
            notes,
            status: 'pending',
            createdBy: req.user.id
        });

        await invoice.save();

        // Update related shipment if exists
        if (shipmentId) {
            await Shipment.findByIdAndUpdate(
                shipmentId,
                { $set: { invoiceId: invoice._id } }
            );
        }

        res.status(201).json({
            message: 'Invoice created successfully',
            invoice
        });
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update invoice
router.put('/:id', authMiddleware.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            items,
            subtotal,
            tax,
            total,
            dueDate,
            notes
        } = req.body;

        // Find and update invoice
        const invoice = await Invoice.findByIdAndUpdate(
            id,
            {
                customerName,
                customerEmail,
                customerPhone,
                customerAddress,
                items,
                subtotal,
                tax,
                total,
                dueDate,
                notes
            },
            { new: true, runValidators: true }
        );

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.status(200).json({
            message: 'Invoice updated successfully',
            invoice
        });
    } catch (error) {
        console.error('Update invoice error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete invoice
router.delete('/:id', authMiddleware.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Find invoice
        const invoice = await Invoice.findById(id);
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Check if invoice is already paid
        if (invoice.status === 'paid') {
            return res.status(400).json({ message: 'Cannot delete a paid invoice' });
        }

        // Update related shipment if exists
        if (invoice.shipmentId) {
            await Shipment.findByIdAndUpdate(
                invoice.shipmentId,
                { $unset: { invoiceId: 1 } }
            );
        }

        // Delete invoice
        await Invoice.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Invoice deleted successfully'
        });
    } catch (error) {
        console.error('Delete invoice error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all invoices for a user
router.get('/user/:userId', authMiddleware.requireAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user is requesting their own invoices or is an admin
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Find invoices
        const invoices = await Invoice.find({ customerId: userId })
            .sort({ createdAt: -1 });

        res.status(200).json(invoices);
    } catch (error) {
        console.error('Get user invoices error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all invoices (admin only)
router.get('/', authMiddleware.requireAuth, authMiddleware.requireAdmin, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        // Build query
        const query = {};
        if (status) {
            query.status = status;
        }

        // Find invoices with pagination
        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Get total count
        const count = await Invoice.countDocuments(query);

        res.status(200).json({
            invoices,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalInvoices: count
        });
    } catch (error) {
        console.error('Get all invoices error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send invoice via email
router.post('/:id/send-email', authMiddleware.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Find invoice
        const invoice = await Invoice.findById(id);
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // In a real implementation, you would use nodemailer to send the invoice
        // For now, we'll just return success
        
        res.status(200).json({
            message: 'Invoice sent successfully',
            invoice
        });
    } catch (error) {
        console.error('Send invoice email error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Generate invoice PDF
router.get('/:id/pdf', authMiddleware.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Find invoice
        const invoice = await Invoice.findById(id);
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // In a real implementation, you would use a PDF library like puppeteer or pdfkit
        // For now, we'll just return a placeholder
        
        res.status(200).json({
            message: 'PDF generated successfully',
            pdfUrl: `https://example.com/invoices/${invoice.invoiceNumber}.pdf`
        });
    } catch (error) {
        console.error('Generate invoice PDF error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper function to generate invoice number
function generateInvoiceNumber() {
    const prefix = 'INV';
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${year}${month}${day}${random}`;
}

module.exports = router;