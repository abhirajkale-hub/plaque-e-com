const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema({
    coupon_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    discount_amount: {
        type: Number,
        required: true,
        min: 0
    },
    order_amount: {
        type: Number,
        required: true,
        min: 0
    },
    used_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate usage in same order
couponUsageSchema.index({ coupon_id: 1, order_id: 1 }, { unique: true });

// Index for efficient querying
couponUsageSchema.index({ user_id: 1, coupon_id: 1 });
couponUsageSchema.index({ coupon_id: 1, used_at: -1 });

// Static method to check if user has already used a coupon
couponUsageSchema.statics.hasUserUsedCoupon = function (userId, couponId) {
    return this.findOne({
        user_id: userId,
        coupon_id: couponId
    });
};

// Static method to get usage count for a coupon
couponUsageSchema.statics.getCouponUsageCount = function (couponId) {
    return this.countDocuments({ coupon_id: couponId });
};

// Static method to get user's coupon usage history
couponUsageSchema.statics.getUserCouponHistory = function (userId) {
    return this.find({ user_id: userId })
        .populate('coupon_id', 'code discount_type discount_value')
        .populate('order_id', 'order_number total_amount')
        .sort({ used_at: -1 });
};

module.exports = mongoose.model('CouponUsage', couponUsageSchema);