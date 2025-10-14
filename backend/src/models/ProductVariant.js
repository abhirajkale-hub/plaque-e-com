const mongoose = require('mongoose');

// Product Variant schema - simplified structure matching frontend expectations
const productVariantSchema = new mongoose.Schema({
    // Reference to parent product
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required'],
        index: true
    },

    // Variant identification
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },

    // Size specification (main variant differentiator)
    size: {
        type: String,
        enum: [
            '15x15 cm',
            '18x18 cm',
            '20x20 cm',
            '22x22 cm',
            '25x25 cm',
            '30x30 cm',
            '35x35 cm'
        ],
        required: [true, 'Size is required'],
        trim: true
    },

    // Pricing
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    compare_at_price: {
        type: Number,
        min: [0, 'Compare at price cannot be negative'],
        default: null
    },

    // Availability
    is_available: {
        type: Boolean,
        default: true,
        index: true
    },

    // Stock management
    stock_quantity: {
        type: Number,
        default: 50,
        min: [0, 'Stock quantity cannot be negative']
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    collection: 'product_variants',
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            // Keep _id as standard MongoDB format
            delete ret.__v;
            return ret;
        }
    }
});

// Indexes for performance
productVariantSchema.index({ product_id: 1, is_available: 1 });
productVariantSchema.index({ sku: 1 });
productVariantSchema.index({ price: 1 });
productVariantSchema.index({ size: 1 });

// Virtual for discount percentage
productVariantSchema.virtual('discount_percentage').get(function () {
    if (this.compare_at_price && this.compare_at_price > this.price) {
        return Math.round(((this.compare_at_price - this.price) / this.compare_at_price) * 100);
    }
    return 0;
});

// Static methods
productVariantSchema.statics.findByProduct = function (productId) {
    return this.find({
        product_id: productId,
        is_available: true
    });
};

productVariantSchema.statics.findBySku = function (sku) {
    return this.findOne({
        sku: sku.toUpperCase(),
        is_available: true
    });
};

module.exports = mongoose.model('ProductVariant', productVariantSchema);
