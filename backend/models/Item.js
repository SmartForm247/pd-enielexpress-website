const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
        maxlength: [100, 'Item name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
        type: String,
        enum: ['electronics', 'clothing', 'books', 'documents', 'food', 'furniture', 'other'],
        default: 'other'
    },
    weight: {
        type: Number,
        required: [true, 'Weight is required'],
        min: [0, 'Weight cannot be negative']
    },
    dimensions: {
        length: {
            type: Number,
            min: [0, 'Length cannot be negative']
        },
        width: {
            type: Number,
            min: [0, 'Width cannot be negative']
        },
        height: {
            type: Number,
            min: [0, 'Height cannot be negative']
        }
    },
    value: {
        type: Number,
        required: [true, 'Value is required'],
        min: [0, 'Value cannot be negative']
    },
    currency: {
        type: String,
        default: 'USD'
    },
    fragile: {
        type: Boolean,
        default: false
    },
    hazardous: {
        type: Boolean,
        default: false
    },
    requiresSpecialHandling: {
        type: Boolean,
        default: false
    },
    specialHandlingInstructions: {
        type: String
    },
    image: {
        type: String
    },
    barcode: {
        type: String
    },
    qrCode: {
        type: String
    },
    shipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Method to calculate volume
itemSchema.methods.calculateVolume = function() {
    if (this.dimensions.length && this.dimensions.width && this.dimensions.height) {
        return this.dimensions.length * this.dimensions.width * this.dimensions.height;
    }
    return 0;
};

// Static method to find items by shipment
itemSchema.statics.findByShipment = function(shipmentId) {
    return this.find({ shipmentId });
};

// Static method to get item statistics
itemSchema.statics.getStatistics = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                totalValue: { $sum: '$value' },
                avgWeight: { $avg: '$weight' }
            }
        }
    ]);
    
    const result = {};
    stats.forEach(stat => {
        result[stat._id] = {
            count: stat.count,
            totalValue: stat.totalValue,
            avgWeight: stat.avgWeight
        };
    });
    
    return result;
};

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;