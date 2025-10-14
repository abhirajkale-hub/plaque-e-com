const mongoose = require('mongoose');

// Cart Item schema
const cartItemSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required'],
        index: true
    },
    product_name: {
        type: String,
        required: [true, 'Product name is required']
    },
    variant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: [true, 'Variant ID is required']
    },
    variant_size: {
        type: String,
        required: [true, 'Variant size is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    image: {
        type: String,
        default: ''
    },
    customization_id: {
        type: String,
        default: null
    },
    has_customization: {
        type: Boolean,
        default: false
    },
    subtotal: {
        type: Number,
        default: 0
    }
}, {
    _id: true
});

// Calculate subtotal before save
cartItemSchema.pre('save', function (next) {
    this.subtotal = this.price * this.quantity;
    next();
});

// Cart schema
const cartSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String for guest users
        required: [true, 'User ID is required'],
        index: true
    },
    items: [cartItemSchema],
    total_amount: {
        type: Number,
        default: 0,
        min: [0, 'Total amount cannot be negative']
    },
    total_items: {
        type: Number,
        default: 0,
        min: [0, 'Total items cannot be negative']
    },
    last_updated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    collection: 'carts',
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            // Keep _id as standard MongoDB format
            delete ret.__v;
            return ret;
        }
    }
});

// Indexes
cartSchema.index({ user_id: 1 });
cartSchema.index({ last_updated: -1 });

// Virtual for total calculation
cartSchema.virtual('calculated_total').get(function () {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Methods
cartSchema.methods.calculateTotals = function () {
    // First, recalculate subtotal for each item
    this.items.forEach(item => {
        item.subtotal = item.price * item.quantity;
    });

    // Then calculate cart totals
    this.total_items = this.items.reduce((total, item) => total + item.quantity, 0);
    this.total_amount = this.items.reduce((total, item) => total + item.subtotal, 0);
    this.last_updated = new Date();
    return this;
};

cartSchema.methods.addItem = function (itemData) {
    // Check if item already exists
    const existingItemIndex = this.items.findIndex(
        item => item.product_id === itemData.product_id && item.variant_id === itemData.variant_id
    );

    if (existingItemIndex > -1) {
        // Update existing item quantity
        this.items[existingItemIndex].quantity += itemData.quantity;
    } else {
        // Add new item
        this.items.push(itemData);
    }

    this.calculateTotals();
    return this;
};

cartSchema.methods.updateItem = function (itemId, quantity) {
    const item = this.items.id(itemId);
    if (item) {
        item.quantity = quantity;
        this.calculateTotals();
    }
    return this;
};

cartSchema.methods.removeItem = function (itemId) {
    this.items.pull(itemId);
    this.calculateTotals();
    return this;
};

cartSchema.methods.clearCart = function () {
    this.items = [];
    this.total_amount = 0;
    this.total_items = 0;
    this.last_updated = new Date();
    return this;
};

cartSchema.methods.validateCart = async function () {
    const Product = require('./Product');
    const ProductVariant = require('./ProductVariant');

    const validItems = [];
    const errors = [];

    for (const item of this.items) {
        try {
            // Check if product exists and is active
            const product = await Product.findById(item.product_id);
            if (!product || !product.is_active) {
                errors.push({
                    item_id: item._id,
                    product_id: item.product_id,
                    error: 'Product not found or inactive'
                });
                continue;
            }

            // Check if variant exists and is available
            const variant = await ProductVariant.findById(item.variant_id);
            if (!variant || !variant.is_available) {
                errors.push({
                    item_id: item._id,
                    variant_id: item.variant_id,
                    error: 'Variant not found or unavailable'
                });
                continue;
            }

            // Update item with current price and product info
            item.price = variant.price;
            item.product_name = product.name;
            item.variant_size = variant.size;

            validItems.push(item);
        } catch (error) {
            errors.push({
                item_id: item._id,
                error: error.message
            });
        }
    }

    // Update cart with valid items only
    this.items = validItems;
    this.calculateTotals();

    return {
        valid: errors.length === 0,
        errors,
        updatedItems: errors.length > 0
    };
};

// Static methods
cartSchema.statics.findByUserId = function (userId) {
    return this.findOne({ user_id: userId });
};

cartSchema.statics.createOrUpdateCart = async function (userId, itemData) {
    let cart = await this.findByUserId(userId);

    if (!cart) {
        cart = new this({
            user_id: userId,
            items: [],
            total_amount: 0,
            total_items: 0
        });
    }

    cart.addItem(itemData);
    await cart.save();
    return cart;
};

module.exports = mongoose.model('Cart', cartSchema);
