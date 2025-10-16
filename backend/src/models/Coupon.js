const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
        match: /^[A-Z0-9]+$/
    },
    discount_type: {
        type: String,
        required: true,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
    },
    discount_value: {
        type: Number,
        required: true,
        min: 0
    },
    min_order_amount: {
        type: Number,
        default: null,
        min: 0
    },
    max_discount_amount: {
        type: Number,
        default: null,
        min: 0
    },
    usage_limit: {
        type: Number,
        default: null,
        min: 1
    },
    times_used: {
        type: Number,
        default: 0,
        min: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    starts_at: {
        type: Date,
        default: null
    },
    expires_at: {
        type: Date,
        default: null
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Index for efficient querying
couponSchema.index({ code: 1 });
couponSchema.index({ is_active: 1, starts_at: 1, expires_at: 1 });

// Virtual to check if coupon is currently valid
couponSchema.virtual('is_valid').get(function () {
    const now = new Date();

    // Check if coupon is active
    if (!this.is_active) return false;

    // Check if coupon has started
    if (this.starts_at && now < this.starts_at) return false;

    // Check if coupon has expired
    if (this.expires_at && now > this.expires_at) return false;

    // Check usage limit
    if (this.usage_limit && this.times_used >= this.usage_limit) return false;

    return true;
});

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function (orderAmount) {
    if (!this.is_valid) return 0;

    // Check minimum order amount
    if (this.min_order_amount && orderAmount < this.min_order_amount) {
        return 0;
    }

    let discountAmount = 0;

    if (this.discount_type === 'percentage') {
        discountAmount = Math.round((orderAmount * this.discount_value) / 100);
    } else {
        discountAmount = this.discount_value;
    }

    // Apply maximum discount limit
    if (this.max_discount_amount && discountAmount > this.max_discount_amount) {
        discountAmount = this.max_discount_amount;
    }

    // Ensure discount doesn't exceed order amount
    if (discountAmount > orderAmount) {
        discountAmount = orderAmount;
    }

    return Math.round(discountAmount);
};

// Static method to find valid coupon by code
couponSchema.statics.findValidCouponByCode = function (code) {
    const now = new Date();

    return this.findOne({
        code: code.toUpperCase(),
        is_active: true,
        $or: [
            { starts_at: null },
            { starts_at: { $lte: now } }
        ],
        $or: [
            { expires_at: null },
            { expires_at: { $gte: now } }
        ]
    });
};

// Pre-save middleware to ensure percentage values are valid
couponSchema.pre('save', function (next) {
    if (this.discount_type === 'percentage' && this.discount_value > 100) {
        const error = new Error('Percentage discount cannot exceed 100%');
        return next(error);
    }
    next();
});

module.exports = mongoose.model('Coupon', couponSchema);
