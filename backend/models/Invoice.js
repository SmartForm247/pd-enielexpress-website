const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    total: {
        type: Number,
        required: true
    }
});

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    customerAddress: {
        type: String,
        required: true
    },
    items: [invoiceItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: [0, 'Subtotal cannot be negative']
    },
    tax: {
        type: Number,
        required: true,
        min: [0, 'Tax cannot be negative']
    },
    total: {
        type: Number,
        required: true,
        min: [0, 'Total cannot be negative']
    },
    currency: {
        type: String,
        default: 'USD'
    },
    dueDate: {
        type: Date,
        required: true
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'overdue', 'cancelled', 'pending_verification', 'payment_rejected'],
        default: 'pending'
    },
    paymentDate: {
        type: Date
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'bank', 'cash']
    },
    paymentReference: {
        type: String
    },
    transferProof: {
        type: String
    },
    shipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment'
    },
    notes: {
        type: String
    },
    adminNotes: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Method to calculate totals
invoiceSchema.methods.calculateTotals = function() {
    // Calculate subtotal
    this.subtotal = this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    
    // Calculate tax (assuming 10% tax rate)
    this.tax = this.subtotal * 0.1;
    
    // Calculate total
    this.total = this.subtotal + this.tax;
    
    return this;
};

// Method to check if invoice is overdue
invoiceSchema.methods.isOverdue = function() {
    return this.dueDate < new Date() && this.status !== 'paid';
};

// Method to mark as paid
invoiceSchema.methods.markAsPaid = function(paymentDate, paymentMethod, paymentReference) {
    this.status = 'paid';
    this.paymentDate = paymentDate || new Date();
    this.paymentMethod = paymentMethod;
    this.paymentReference = paymentReference;
    
    return this.save();
};

// Static method to find overdue invoices
invoiceSchema.statics.findOverdue = function() {
    return this.find({
        dueDate: { $lt: new Date() },
        status: { $ne: 'paid' }
    });
};

// Static method to get invoice statistics
invoiceSchema.statics.getStatistics = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$total' }
            }
        }
    ]);
    
    const result = {};
    stats.forEach(stat => {
        result[stat._id] = {
            count: stat.count,
            totalAmount: stat.totalAmount
        };
    });
    
    return result;
};

// Pre-save middleware to calculate totals
invoiceSchema.pre('save', function(next) {
    if (this.isModified('items')) {
        this.calculateTotals();
    }
    
    // Check if invoice is overdue
    if (this.isOverdue() && this.status === 'pending') {
        this.status = 'overdue';
    }
    
    next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;