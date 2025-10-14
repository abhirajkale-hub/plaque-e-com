const mongoose = require('mongoose');

// Order Item schema aligned with Supabase order_items table
const orderItemSchema = new mongoose.Schema({
    // Product references - matching Supabase structure
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required']
    },
    variant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: [true, 'Variant ID is required']
    },

    // Product details at time of order
    product_name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    variant_size: {
        type: String,
        required: [true, 'Variant size is required'],
        trim: true
    },

    // Pricing and quantity
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
        default: 1
    },

    // Award-specific fields - matching Supabase structure
    achievement_title: {
        type: String,
        trim: true,
        maxlength: [200, 'Achievement title cannot exceed 200 characters']
    },
    trader_name: {
        type: String,
        trim: true,
        maxlength: [100, 'Trader name cannot exceed 100 characters']
    },

    // Production and fulfillment
    production_notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Production notes cannot exceed 1000 characters']
    },

    // Payout tracking - matching Supabase structure
    payout_amount: {
        type: String, // Stored as string to match Supabase
        default: null
    },
    payout_date: {
        type: Date,
        default: null
    },

    // Certificate/file uploads
    certificate_uploads: [{
        file_name: String,
        file_url: String,
        file_size: Number,
        mime_type: String,
        uploaded_at: {
            type: Date,
            default: Date.now
        }
    }],

    // Customization details
    customization_details: {
        text_engraving: String,
        color_choices: [String],
        special_instructions: String,
        design_file_url: String
    },

    // Item status tracking
    item_status: {
        type: String,
        enum: ['pending', 'in_production', 'completed', 'shipped', 'delivered'],
        default: 'pending'
    },

    // Manufacturing tracking
    manufacturing: {
        started_at: Date,
        estimated_completion: Date,
        completed_at: Date,
        quality_check_passed: {
            type: Boolean,
            default: false
        },
        production_cost: {
            type: Number,
            default: 0
        }
    }
}, {
    _id: true,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Main Order schema aligned with frontend and Supabase structure
const orderSchema = new mongoose.Schema({
    // Order identification - matching Supabase structure
    order_number: {
        type: String,
        required: [true, 'Order number is required'],
        unique: true,
        trim: true,
        index: true
    },

    // User association - matching Supabase user_id
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null, // Allow guest orders
        index: true
    },

    // Order status - matching Supabase enum
    status: {
        type: String,
        enum: ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'new',
        index: true
    },

    // Order items
    items: [orderItemSchema],

    // Pricing breakdown
    total_amount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative']
    },
    subtotal: {
        type: Number,
        default: 0,
        min: [0, 'Subtotal cannot be negative']
    },
    tax_amount: {
        type: Number,
        default: 0,
        min: [0, 'Tax amount cannot be negative']
    },
    shipping_amount: {
        type: Number,
        default: 0,
        min: [0, 'Shipping amount cannot be negative']
    },
    discount_amount: {
        type: Number,
        default: 0,
        min: [0, 'Discount amount cannot be negative']
    },

    // Shipping details - flattened structure matching Supabase
    shipping_name: {
        type: String,
        required: [true, 'Shipping name is required'],
        trim: true
    },
    shipping_email: {
        type: String,
        required: [true, 'Shipping email is required'],
        trim: true,
        lowercase: true
    },
    shipping_phone: {
        type: String,
        required: [true, 'Shipping phone is required'],
        trim: true
    },
    shipping_address: {
        type: String,
        required: [true, 'Shipping address is required'],
        trim: true
    },
    shipping_city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    shipping_state: {
        type: String,
        required: [true, 'State is required'],
        trim: true
    },
    shipping_pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        trim: true
    },
    shipping_country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
        default: 'India'
    },

    // Payment information - matching Supabase structure
    payment_id: {
        type: String,
        trim: true
    },
    payment_status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
        default: 'pending',
        index: true
    },
    razorpay_order_id: {
        type: String,
        trim: true
    },
    razorpay_payment_id: {
        type: String,
        trim: true
    },
    razorpay_signature: {
        type: String,
        trim: true
    },
    payment_method: {
        type: String,
        enum: ['razorpay', 'cod', 'bank_transfer', 'upi'],
        default: 'razorpay'
    },
    payment_gateway_response: {
        type: mongoose.Schema.Types.Mixed
    },

    // Shipping and tracking
    tracking_number: {
        type: String,
        trim: true
    },
    shipping_provider: {
        type: String,
        trim: true,
        default: 'delhivery'
    },
    // Delhivery specific fields
    delhivery_waybill: {
        type: String,
        trim: true
    },
    delhivery_order_id: {
        type: String,
        trim: true
    },
    courier_name: {
        type: String,
        trim: true
    },
    tracking_url: {
        type: String,
        trim: true
    },
    shipped_at: {
        type: Date
    },
    estimated_delivery: {
        type: Date
    },
    delivered_at: {
        type: Date
    },
    pickup_scheduled_date: {
        type: Date
    },
    pickup_completed_date: {
        type: Date
    },

    // Order notes and communication
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    internal_notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Internal notes cannot exceed 1000 characters']
    },

    // Damage claims - matching Supabase structure
    damage_claim_approved: {
        type: Boolean,
        default: null
    },
    damage_claim_notes: {
        type: String,
        trim: true
    },
    replacement_order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },

    // Discount and coupon information
    coupon_code: {
        type: String,
        trim: true,
        uppercase: true
    },
    coupon_discount: {
        type: Number,
        default: 0,
        min: 0
    },

    // Affiliate tracking
    affiliate_code: {
        type: String,
        trim: true,
        uppercase: true
    },
    affiliate_commission: {
        type: Number,
        default: 0,
        min: 0
    },

    // Order lifecycle timestamps
    confirmed_at: {
        type: Date
    },
    processing_started_at: {
        type: Date
    },
    completed_at: {
        type: Date
    },
    cancelled_at: {
        type: Date
    },
    cancellation_reason: {
        type: String,
        trim: true
    },

    // Customer communication
    customer_notifications: [{
        type: {
            type: String,
            enum: ['order_confirmed', 'payment_received', 'processing_started', 'shipped', 'delivered', 'cancelled']
        },
        sent_at: {
            type: Date,
            default: Date.now
        },
        channel: {
            type: String,
            enum: ['email', 'sms', 'whatsapp'],
            default: 'email'
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'failed'],
            default: 'sent'
        }
    }],

    // Analytics and metadata
    source: {
        type: String,
        enum: ['web', 'mobile', 'admin', 'api'],
        default: 'web'
    },
    device_info: {
        user_agent: String,
        ip_address: String,
        browser: String,
        os: String
    },

    // Soft delete support
    deleted_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    collection: 'orders',
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            // Transform _id to id for frontend compatibility
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Indexes for performance
orderSchema.index({ order_number: 1 });
orderSchema.index({ user_id: 1, created_at: -1 });
orderSchema.index({ status: 1, created_at: -1 });
orderSchema.index({ payment_status: 1 });
orderSchema.index({ tracking_number: 1 });
orderSchema.index({ delhivery_waybill: 1 });
orderSchema.index({ delhivery_order_id: 1 });
orderSchema.index({ razorpay_order_id: 1 });
orderSchema.index({ affiliate_code: 1 });
orderSchema.index({ created_at: -1 });
orderSchema.index({ deleted_at: 1 });

// Removed virtual 'id' property - using _id directly for consistency

// Virtual for order total items count
orderSchema.virtual('total_items').get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for order status display
orderSchema.virtual('status_display').get(function () {
    const statusMap = {
        'new': 'New Order',
        'confirmed': 'Confirmed',
        'processing': 'In Production',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    return statusMap[this.status] || this.status;
});

// Virtual for payment status display
orderSchema.virtual('payment_status_display').get(function () {
    const statusMap = {
        'pending': 'Payment Pending',
        'processing': 'Processing Payment',
        'completed': 'Payment Completed',
        'failed': 'Payment Failed',
        'refunded': 'Refunded',
        'cancelled': 'Payment Cancelled'
    };
    return statusMap[this.payment_status] || this.payment_status;
});

// Pre-save middleware
orderSchema.pre('save', function (next) {
    // Auto-generate order number if not provided
    if (this.isNew && !this.order_number) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.order_number = `ORD-${timestamp}-${random}`;
    }

    // Calculate totals if items exist
    if (this.items && this.items.length > 0) {
        this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Calculate total amount if not already set
        if (!this.total_amount || this.total_amount === 0) {
            this.total_amount = this.subtotal + this.tax_amount + this.shipping_amount - this.discount_amount;
        }
    }

    // Update status timestamps
    if (this.isModified('status')) {
        const now = new Date();
        switch (this.status) {
            case 'confirmed':
                if (!this.confirmed_at) this.confirmed_at = now;
                break;
            case 'processing':
                if (!this.processing_started_at) this.processing_started_at = now;
                break;
            case 'shipped':
                if (!this.shipped_at) this.shipped_at = now;
                break;
            case 'delivered':
                if (!this.delivered_at) this.delivered_at = now;
                if (!this.completed_at) this.completed_at = now;
                break;
            case 'cancelled':
                if (!this.cancelled_at) this.cancelled_at = now;
                break;
        }
    }

    next();
});

// Instance Methods

// Get order summary
orderSchema.methods.getSummary = function () {
    return {
        id: this._id,
        order_number: this.order_number,
        status: this.status,
        status_display: this.status_display,
        total_amount: this.total_amount,
        total_items: this.total_items,
        shipping_name: this.shipping_name,
        created_at: this.created_at,
        payment_status: this.payment_status
    };
};

// Update order status with notification
orderSchema.methods.updateStatus = async function (newStatus, notes = null) {
    const oldStatus = this.status;
    this.status = newStatus;

    if (notes) {
        this.internal_notes = (this.internal_notes || '') + `\n[${new Date().toISOString()}] Status changed from ${oldStatus} to ${newStatus}: ${notes}`;
    }

    // Add notification record
    this.customer_notifications.push({
        type: this.getNotificationTypeForStatus(newStatus),
        sent_at: new Date(),
        channel: 'email',
        status: 'sent'
    });

    return this.save();
};

// Helper method for notification types
orderSchema.methods.getNotificationTypeForStatus = function (status) {
    const notificationMap = {
        'confirmed': 'order_confirmed',
        'processing': 'processing_started',
        'shipped': 'shipped',
        'delivered': 'delivered',
        'cancelled': 'cancelled'
    };
    return notificationMap[status] || 'order_confirmed';
};

// Add tracking information - Updated for Delhivery
orderSchema.methods.addTracking = function (trackingData) {
    // Handle both legacy format (trackingNumber, shippingProvider) and new Delhivery format
    if (typeof trackingData === 'string') {
        // Legacy format
        this.tracking_number = trackingData;
        this.shipping_provider = arguments[1] || 'delhivery';
    } else if (trackingData && typeof trackingData === 'object') {
        // New Delhivery format
        this.tracking_number = trackingData.waybill || trackingData.tracking_number;
        this.delhivery_waybill = trackingData.waybill;
        this.delhivery_order_id = trackingData.delhivery_order_id;
        this.courier_name = trackingData.courier_name;
        this.tracking_url = trackingData.tracking_url;
        this.shipping_provider = 'delhivery';
        if (trackingData.estimated_delivery_date) {
            this.estimated_delivery = new Date(trackingData.estimated_delivery_date);
        }
    }

    this.status = 'shipped';
    this.shipped_at = new Date();

    // Add notification
    this.customer_notifications.push({
        type: 'shipped',
        sent_at: new Date(),
        channel: 'email',
        status: 'sent'
    });

    return this.save();
};

// Process payment
orderSchema.methods.processPayment = function (paymentData) {
    this.payment_id = paymentData.payment_id;
    this.razorpay_payment_id = paymentData.razorpay_payment_id;
    this.razorpay_signature = paymentData.razorpay_signature;
    this.payment_status = 'completed';
    this.payment_gateway_response = paymentData;

    if (this.status === 'new') {
        this.status = 'confirmed';
        this.confirmed_at = new Date();
    }

    return this.save();
};

// Calculate shipping cost
orderSchema.methods.calculateShipping = function () {
    // Basic shipping calculation - can be enhanced
    const baseShipping = 50; // Base shipping cost
    const weightBasedShipping = this.items.reduce((sum, item) => sum + (item.quantity * 10), 0);

    return Math.max(baseShipping, weightBasedShipping);
};

// Check if order can be cancelled
orderSchema.methods.canBeCancelled = function () {
    return ['new', 'confirmed'].includes(this.status) &&
        this.payment_status !== 'completed';
};

// Cancel order
orderSchema.methods.cancel = function (reason) {
    if (!this.canBeCancelled()) {
        throw new Error('Order cannot be cancelled in current status');
    }

    this.status = 'cancelled';
    this.cancelled_at = new Date();
    this.cancellation_reason = reason;

    if (this.payment_status === 'completed') {
        this.payment_status = 'refunded';
    } else {
        this.payment_status = 'cancelled';
    }

    return this.save();
};

// Static Methods

// Find orders by user
orderSchema.statics.findByUser = function (userId, status = null) {
    const query = {
        user_id: userId,
        deleted_at: null
    };

    if (status) {
        query.status = status;
    }

    return this.find(query).sort({ created_at: -1 });
};

// Find by order number
orderSchema.statics.findByOrderNumber = function (orderNumber) {
    return this.findOne({
        order_number: orderNumber,
        deleted_at: null
    });
};

// Find by status
orderSchema.statics.findByStatus = function (status) {
    return this.find({
        status: status,
        deleted_at: null
    }).sort({ created_at: -1 });
};

// Get order statistics
orderSchema.statics.getStats = async function (dateRange = null) {
    const matchQuery = { deleted_at: null };

    if (dateRange) {
        matchQuery.created_at = {
            $gte: dateRange.start,
            $lte: dateRange.end
        };
    }

    const stats = await this.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                total_orders: { $sum: 1 },
                total_revenue: { $sum: '$total_amount' },
                average_order_value: { $avg: '$total_amount' },
                new_orders: {
                    $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
                },
                confirmed_orders: {
                    $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
                },
                processing_orders: {
                    $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
                },
                shipped_orders: {
                    $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] }
                },
                delivered_orders: {
                    $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                },
                cancelled_orders: {
                    $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                }
            }
        }
    ]);

    return stats[0] || {
        total_orders: 0,
        total_revenue: 0,
        average_order_value: 0,
        new_orders: 0,
        confirmed_orders: 0,
        processing_orders: 0,
        shipped_orders: 0,
        delivered_orders: 0,
        cancelled_orders: 0
    };
};

// Get recent orders
orderSchema.statics.getRecent = function (limit = 10) {
    return this.find({ deleted_at: null })
        .sort({ created_at: -1 })
        .limit(limit)
        .populate('user_id', 'full_name email');
};

// Soft delete order
orderSchema.statics.softDelete = function (orderId) {
    return this.findByIdAndUpdate(
        orderId,
        { deleted_at: new Date() },
        { new: true }
    );
};

// Restore soft deleted order
orderSchema.statics.restore = function (orderId) {
    return this.findByIdAndUpdate(
        orderId,
        { deleted_at: null },
        { new: true }
    );
};

module.exports = mongoose.model('Order', orderSchema);