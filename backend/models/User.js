const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    phone: {
        type: String,
        trim: true,
        match: [/^\+?[0-9]{10,15}$/, 'Please provide a valid phone number']
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    avatar: {
        type: String,
        default: ''
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get full name
userSchema.methods.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

// Method to get user profile without sensitive data
userSchema.methods.getProfile = function() {
    return {
        id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        phone: this.phone,
        role: this.role,
        avatar: this.avatar,
        address: this.address,
        isActive: this.isActive,
        lastLogin: this.lastLogin,
        emailVerified: this.emailVerified,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

// Static method to find user by email with password
userSchema.statics.findByEmailWithPassword = function(email) {
    return this.findOne({ email }).select('+password');
};

// Static method to find user by reset token
userSchema.statics.findByResetToken = function(resetPasswordToken) {
    return this.findOne({
        resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() }
    }).select('+password');
};

const User = mongoose.model('User', userSchema);

module.exports = User;