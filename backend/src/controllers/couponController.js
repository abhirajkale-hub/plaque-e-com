const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');

// Admin Coupon Management

// Get all coupons (Admin)
exports.getAllCoupons = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const coupons = await Coupon.find()
            .populate('created_by', 'first_name last_name email')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Coupon.countDocuments();

        res.json({
            success: true,
            message: 'Coupons retrieved successfully',
            data: {
                coupons,
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(total / limit),
                    total_items: total,
                    items_per_page: limit
                }
            }
        });
    } catch (error) {
        console.error('Get all coupons error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get single coupon (Admin)
exports.getCouponById = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id)
            .populate('created_by', 'first_name last_name email');

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // Get usage statistics
        const usageCount = await CouponUsage.getCouponUsageCount(coupon._id);
        const recentUsages = await CouponUsage.find({ coupon_id: coupon._id })
            .populate('user_id', 'first_name last_name email')
            .populate('order_id', 'order_number total_amount')
            .sort({ used_at: -1 })
            .limit(10);

        res.json({
            success: true,
            message: 'Coupon retrieved successfully',
            data: {
                coupon,
                usage_statistics: {
                    total_uses: usageCount,
                    recent_usages: recentUsages
                }
            }
        });
    } catch (error) {
        console.error('Get coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Create new coupon (Admin)
exports.createCoupon = async (req, res) => {
    try {
        const {
            code,
            discount_type,
            discount_value,
            min_order_amount,
            max_discount_amount,
            usage_limit,
            is_active,
            starts_at,
            expires_at,
            description
        } = req.body;

        // Validate required fields
        if (!code || !discount_type || discount_value === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Code, discount_type, and discount_value are required'
            });
        }

        // Validate discount value
        if (discount_type === 'percentage' && (discount_value <= 0 || discount_value > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Percentage discount must be between 1 and 100'
            });
        }

        if (discount_type === 'fixed' && discount_value <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Fixed discount must be greater than 0'
            });
        }

        // Validate dates
        if (starts_at && expires_at && new Date(starts_at) >= new Date(expires_at)) {
            return res.status(400).json({
                success: false,
                message: 'Start date must be before expiry date'
            });
        }

        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }

        const coupon = new Coupon({
            code: code.toUpperCase(),
            discount_type,
            discount_value,
            min_order_amount: min_order_amount || null,
            max_discount_amount: max_discount_amount || null,
            usage_limit: usage_limit || null,
            is_active: is_active !== undefined ? is_active : true,
            starts_at: starts_at || null,
            expires_at: expires_at || null,
            description: description || '',
            created_by: req.user._id
        });

        await coupon.save();

        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            data: coupon
        });
    } catch (error) {
        console.error('Create coupon error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Update coupon (Admin)
exports.updateCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        const updates = req.body;

        // Remove fields that shouldn't be updated
        delete updates.times_used;
        delete updates.created_by;
        delete updates.created_at;
        delete updates.updated_at;

        // Validate discount value if being updated
        if (updates.discount_type === 'percentage' && updates.discount_value && (updates.discount_value <= 0 || updates.discount_value > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Percentage discount must be between 1 and 100'
            });
        }

        if (updates.discount_type === 'fixed' && updates.discount_value && updates.discount_value <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Fixed discount must be greater than 0'
            });
        }

        // Validate dates if being updated
        if (updates.starts_at && updates.expires_at && new Date(updates.starts_at) >= new Date(updates.expires_at)) {
            return res.status(400).json({
                success: false,
                message: 'Start date must be before expiry date'
            });
        }

        // Convert code to uppercase if provided
        if (updates.code) {
            updates.code = updates.code.toUpperCase();

            // Check if new code already exists (exclude current coupon)
            const existingCoupon = await Coupon.findOne({
                code: updates.code,
                _id: { $ne: couponId }
            });
            if (existingCoupon) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon code already exists'
                });
            }
        }

        const coupon = await Coupon.findByIdAndUpdate(
            couponId,
            updates,
            { new: true, runValidators: true }
        ).populate('created_by', 'first_name last_name email');

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.json({
            success: true,
            message: 'Coupon updated successfully',
            data: coupon
        });
    } catch (error) {
        console.error('Update coupon error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Delete coupon (Admin)
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // Check if coupon has been used
        const usageCount = await CouponUsage.getCouponUsageCount(coupon._id);
        if (usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete coupon that has been used. Consider deactivating it instead.'
            });
        }

        await Coupon.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Coupon deleted successfully'
        });
    } catch (error) {
        console.error('Delete coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Customer Coupon Operations

// Validate coupon for customer
exports.validateCoupon = async (req, res) => {
    try {
        const { code, order_amount } = req.body;
        // userId is optional for validation - only check if user is authenticated
        const userId = req.user ? req.user._id : null;

        if (!code || !order_amount) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code and order amount are required'
            });
        }

        if (order_amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Order amount must be greater than 0'
            });
        }

        // Find the coupon
        const coupon = await Coupon.findValidCouponByCode(code);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired coupon code'
            });
        }

        // Check usage limit
        if (coupon.usage_limit) {
            const usageCount = await CouponUsage.getCouponUsageCount(coupon._id);
            if (usageCount >= coupon.usage_limit) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon usage limit reached'
                });
            }
        }

        // Check if user has already used this coupon (only if user is authenticated)
        if (userId) {
            const userUsage = await CouponUsage.hasUserUsedCoupon(userId, coupon._id);
            if (userUsage) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already used this coupon'
                });
            }
        }

        // Calculate discount
        const discountAmount = coupon.calculateDiscount(order_amount);

        if (discountAmount === 0) {
            let message = 'Coupon is not applicable to this order';
            if (coupon.min_order_amount && order_amount < coupon.min_order_amount) {
                message = `Minimum order amount of ₹${coupon.min_order_amount} required for this coupon`;
            }
            return res.status(400).json({
                success: false,
                message: message
            });
        }

        res.json({
            success: true,
            message: 'Coupon is valid',
            data: {
                coupon: {
                    id: coupon._id,
                    code: coupon.code,
                    discount_type: coupon.discount_type,
                    discount_value: coupon.discount_value,
                    description: coupon.description
                },
                discount_amount: discountAmount,
                final_amount: order_amount - discountAmount
            }
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Apply coupon to order (called during order creation)
exports.applyCoupon = async (req, res) => {
    try {
        const { coupon_id, order_id, order_amount, discount_amount } = req.body;
        const userId = req.user._id;

        // Validate the coupon one more time
        const coupon = await Coupon.findById(coupon_id);
        if (!coupon || !coupon.is_valid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coupon'
            });
        }

        // Record the usage
        const couponUsage = new CouponUsage({
            coupon_id,
            user_id: userId,
            order_id,
            discount_amount,
            order_amount
        });

        await couponUsage.save();

        // Increment the times_used counter
        await Coupon.findByIdAndUpdate(coupon_id, {
            $inc: { times_used: 1 }
        });

        res.json({
            success: true,
            message: 'Coupon applied successfully',
            data: couponUsage
        });
    } catch (error) {
        console.error('Apply coupon error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Coupon already applied to this order'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get user's coupon usage history
exports.getUserCouponHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const history = await CouponUsage.find({ user_id: userId })
            .populate('coupon_id', 'code discount_type discount_value description')
            .populate('order_id', 'order_number total_amount created_at')
            .sort({ used_at: -1 })
            .skip(skip)
            .limit(limit);

        const total = await CouponUsage.countDocuments({ user_id: userId });

        res.json({
            success: true,
            message: 'Coupon history retrieved successfully',
            data: {
                history,
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(total / limit),
                    total_items: total,
                    items_per_page: limit
                }
            }
        });
    } catch (error) {
        console.error('Get user coupon history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
