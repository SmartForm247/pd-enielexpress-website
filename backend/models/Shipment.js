const mongoose = require('mongoose');

const trackingHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String
    }
});

const shipmentSchema = new mongoose.Schema({
    trackingNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    senderName: {
        type: String,
        required: true
    },
    senderPhone: {
        type: String,
        required: true
    },
    senderEmail: {
        type: String,
        required: true
    },
    senderAddress: {
        type: String,
        required: true
    },
    recipientName: {
        type: String,
        required: true
    },
    recipientPhone: {
        type: String,
        required: true
    },
    recipientEmail: {
        type: String,
        required: true
    },
    recipientAddress: {
        type: String,
        required: true
    },
    packageDescription: {
        type: String,
        required: true
    },
    packageWeight: {
        type: Number,
        required: true
    },
    packageDimensions: {
        length: Number,
        width: Number,
        height: Number
    },
    packageValue: {
        type: Number,
        required: true
    },
    packageType: {
        type: String,
        enum: ['document', 'parcel', 'freight'],
        default: 'parcel'
    },
    serviceType: {
        type: String,
        enum: ['standard', 'express', 'overnight', 'international'],
        required: true
    },
    origin: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Package Received', 'In Transit', 'Out for Delivery', 'Delivered', 'Customs', 'Exception'],
        default: 'Package Received'
    },
    trackingHistory: [trackingHistorySchema],
    estimatedDelivery: {
        type: Date,
        required: true
    },
    actualDelivery: {
        type: Date
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    },
    notificationPhoneNumbers: [String],
    qrCode: {
        type: String
    },
    barcode: {
        type: String
    },
    notes: {
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

// Method to add tracking update
shipmentSchema.methods.addTrackingUpdate = function(status, location, description) {
    this.trackingHistory.push({
        status,
        location,
        description,
        date: new Date()
    });
    
    // Update status
    this.status = status;
    
    // Update actual delivery date if delivered
    if (status === 'Delivered') {
        this.actualDelivery = new Date();
    }
    
    return this.save();
};

// Method to get tracking history in reverse chronological order
shipmentSchema.methods.getTrackingHistory = function() {
    return this.trackingHistory.slice().reverse();
};

// Static method to find shipments by phone number
shipmentSchema.statics.findByPhoneNumber = function(phoneNumber) {
    return this.find({
        $or: [
            { senderPhone: phoneNumber },
            { recipientPhone: phoneNumber }
        ]
    });
};

// Static method to find shipments by email
shipmentSchema.statics.findByEmail = function(email) {
    return this.find({
        $or: [
            { senderEmail: email },
            { recipientEmail: email }
        ]
    });
};

// Static method to get shipment statistics
shipmentSchema.statics.getStatistics = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
    
    const result = {};
    stats.forEach(stat => {
        result[stat._id] = stat.count;
    });
    
    return result;
};

const Shipment = mongoose.model('Shipment', shipmentSchema);

module.exports = Shipment;