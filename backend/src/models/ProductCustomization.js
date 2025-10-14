const mongoose = require('mongoose');

const productCustomizationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String for guest users
        required: [true, 'User ID is required']
    },
    cart_item_id: {
        type: String,
        required: [true, 'Cart item ID is required']
    },
    product_id: {
        type: String,
        required: [true, 'Product ID is required']
    },
    variant_id: {
        type: String,
        required: [true, 'Variant ID is required']
    },
    variant_size: {
        type: String,
        required: [true, 'Variant size is required']
    },
    certificate_image: {
        type: String,
        required: [true, 'Certificate image is required']
    },
    certificate_original_name: {
        type: String,
        required: [true, 'Certificate original name is required']
    },
    certificate_mime_type: {
        type: String,
        required: [true, 'Certificate mime type is required']
    },
    certificate_size: {
        type: Number,
        required: [true, 'Certificate size is required']
    },
    production_notes: {
        type: String,
        default: '',
        maxlength: [1000, 'Production notes cannot exceed 1000 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'in_production', 'completed', 'cancelled'],
        default: 'pending'
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    collection: 'product_customizations',
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id.toHexString();
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Indexes
productCustomizationSchema.index({ user_id: 1, product_id: 1 });
productCustomizationSchema.index({ cart_item_id: 1 });
productCustomizationSchema.index({ status: 1 });
productCustomizationSchema.index({ created_at: -1 });

// Virtual for certificate URL
productCustomizationSchema.virtual('certificate_url').get(function () {
    if (this.certificate_image) {
        return `/uploads/certificates/${this.certificate_image}`;
    }
    return null;
});

// Methods
productCustomizationSchema.methods.toSafeObject = function () {
    const obj = this.toObject();
    return {
        id: obj.id,
        cart_item_id: obj.cart_item_id,
        product_id: obj.product_id,
        variant_id: obj.variant_id,
        variant_size: obj.variant_size,
        certificate_url: obj.certificate_url,
        certificate_original_name: obj.certificate_original_name,
        production_notes: obj.production_notes,
        status: obj.status,
        created_at: obj.created_at,
        updated_at: obj.updated_at
    };
};

// Static methods
productCustomizationSchema.statics.findByUserId = function (userId) {
    return this.find({ user_id: userId, is_active: true })
        .sort({ created_at: -1 });
};

productCustomizationSchema.statics.findByCartItemId = function (cartItemId) {
    return this.findOne({ cart_item_id: cartItemId, is_active: true });
};

productCustomizationSchema.statics.findByProductId = function (productId) {
    return this.find({ product_id: productId, is_active: true })
        .sort({ created_at: -1 });
};

const ProductCustomization = mongoose.model('ProductCustomization', productCustomizationSchema);

module.exports = ProductCustomization;