const mongoose = require('mongoose');

// Product schema aligned with frontend mockProducts.ts and Supabase types
const productSchema = new mongoose.Schema({
    // Core product information - exactly matching frontend structure
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [200, 'Product name cannot exceed 200 characters'],
        index: true
    },
    slug: {
        type: String,
        required: [true, 'Product slug is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true
    },

    // Material information - matching frontend expectations
    material: {
        type: String,
        enum: [
            '20mm Clear Acrylic',
            '25mm Premium Clear Acrylic',
            '30mm Premium Clear Acrylic',
            '30mm Ultra-Clear Crystal Acrylic',
            '30mm Premium Clear Acrylic with Diamond Cutting'
        ],
        default: '25mm Premium Clear Acrylic',
        trim: true,
        index: true
    },

    // Status field - aligned with frontend is_active
    is_active: {
        type: Boolean,
        default: true,
        index: true
    },

    // SEO fields - matching frontend meta fields
    meta_title: {
        type: String,
        trim: true,
        maxlength: [160, 'Meta title cannot exceed 160 characters']
    },
    meta_description: {
        type: String,
        trim: true,
        maxlength: [320, 'Meta description cannot exceed 320 characters']
    },
    meta_keywords: [{
        type: String,
        trim: true
    }],

    // Product categorization
    category: {
        type: String,
        required: [true, 'Product category is required'],
        enum: ['award', 'trophy', 'plaque', 'certificate', 'medal', 'custom'],
        default: 'award',
        index: true
    },
    sub_category: {
        type: String,
        enum: [
            'precious_metals',
            'elite_collection',
            'diamond_collection',
            'starter_collection',
            'crystal_collection'
        ],
        trim: true,
        index: true
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],

    // Physical properties
    weight: {
        type: Number,
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
        },
        unit: {
            type: String,
            enum: ['mm', 'cm', 'inch'],
            default: 'cm'
        }
    },

    // Product features
    features: [{
        type: String,
        trim: true
    }],

    // Customization options
    customization: {
        is_customizable: {
            type: Boolean,
            default: true
        },
        options: [{
            name: {
                type: String,
                required: true,
                trim: true
            },
            type: {
                type: String,
                enum: ['text', 'select', 'color', 'image'],
                required: true
            },
            required: {
                type: Boolean,
                default: false
            },
            options: [String] // For select type
        }]
    },

    // Image management
    images: [{
        url: {
            type: String,
            required: true
        },
        alt_text: String,
        is_primary: {
            type: Boolean,
            default: false
        },
        sort_order: {
            type: Number,
            default: 0
        }
    }],

    // Inventory and availability
    stock_management: {
        track_inventory: {
            type: Boolean,
            default: false
        },
        stock_quantity: {
            type: Number,
            default: 0,
            min: 0
        },
        low_stock_threshold: {
            type: Number,
            default: 5,
            min: 0
        }
    },

    // Pricing information (base price if no variants)
    base_price: {
        type: Number,
        min: [0, 'Base price cannot be negative']
    },

    // Manufacturing and fulfillment
    manufacturing: {
        production_time: {
            type: Number, // in days
            default: 7
        },
        complexity_level: {
            type: String,
            enum: ['simple', 'moderate', 'complex'],
            default: 'moderate'
        },
        requires_approval: {
            type: Boolean,
            default: true
        }
    },

    // Analytics and performance tracking
    analytics: {
        view_count: {
            type: Number,
            default: 0
        },
        order_count: {
            type: Number,
            default: 0
        },
        revenue_generated: {
            type: Number,
            default: 0
        },
        average_rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        review_count: {
            type: Number,
            default: 0
        }
    },

    // Status and visibility
    status: {
        type: String,
        enum: ['draft', 'active', 'inactive', 'discontinued'],
        default: 'active',
        index: true
    },

    // Featured product flag - only one product can be featured at a time
    is_featured: {
        type: Boolean,
        default: false,
        index: true
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
    collection: 'products',
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
productSchema.index({ name: 'text', description: 'text' }); // Text search
productSchema.index({ slug: 1 });
productSchema.index({ category: 1, sub_category: 1 });
productSchema.index({ is_active: 1, status: 1 });
productSchema.index({ material: 1 });
productSchema.index({ created_at: -1 });
productSchema.index({ 'analytics.view_count': -1 });
productSchema.index({ 'analytics.order_count': -1 });
productSchema.index({ deleted_at: 1 });

// Removed virtual 'id' property - using _id directly for consistency// Virtual to get primary image
productSchema.virtual('primary_image').get(function () {
    if (this.images && this.images.length > 0) {
        const primary = this.images.find(img => img.is_primary);
        return primary || this.images[0];
    }
    return null;
});

// Virtual to get available variants (will be populated from ProductVariant model)
productSchema.virtual('product_variants', {
    ref: 'ProductVariant',
    localField: '_id',
    foreignField: 'product_id'
});

// Virtual for stock status
productSchema.virtual('stock_status').get(function () {
    if (!this.stock_management.track_inventory) {
        return 'unlimited';
    }

    if (this.stock_management.stock_quantity <= 0) {
        return 'out_of_stock';
    }

    if (this.stock_management.stock_quantity <= this.stock_management.low_stock_threshold) {
        return 'low_stock';
    }

    return 'in_stock';
});

// Pre-save middleware
productSchema.pre('save', function (next) {
    // Auto-generate slug if not provided
    if (this.isNew && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    // Ensure only one primary image
    if (this.images && this.images.length > 0) {
        let primaryCount = 0;
        this.images.forEach((image, index) => {
            if (image.is_primary) {
                if (primaryCount > 0) {
                    image.is_primary = false;
                } else {
                    primaryCount++;
                }
            }
        });

        // If no primary image, make the first one primary
        if (primaryCount === 0) {
            this.images[0].is_primary = true;
        }
    }

    next();
});

// Pre-save middleware to ensure only one product can be featured
productSchema.pre('save', async function (next) {
    // If this product is being set as featured
    if (this.isModified('is_featured') && this.is_featured) {
        // Remove featured status from all other products
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, is_featured: true },
            { $set: { is_featured: false } }
        );
    }
    next();
});

// Instance Methods

// Get product summary for listing
productSchema.methods.getSummary = function () {
    return {
        id: this._id,
        name: this.name,
        slug: this.slug,
        description: this.description,
        material: this.material,
        is_active: this.is_active,
        category: this.category,
        primary_image: this.primary_image,
        base_price: this.base_price,
        stock_status: this.stock_status,
        created_at: this.created_at
    };
};

// Add image to product
productSchema.methods.addImage = function (imageData) {
    // If this is the first image, make it primary
    if (!this.images || this.images.length === 0) {
        imageData.is_primary = true;
    }

    this.images.push(imageData);
    return this.images[this.images.length - 1];
};

// Update view count
productSchema.methods.incrementViewCount = function () {
    this.analytics.view_count = (this.analytics.view_count || 0) + 1;
    return this.save({ validateBeforeSave: false });
};

// Update order statistics
productSchema.methods.updateOrderStats = function (quantity, amount) {
    this.analytics.order_count = (this.analytics.order_count || 0) + 1;
    this.analytics.revenue_generated = (this.analytics.revenue_generated || 0) + amount;
    return this.save({ validateBeforeSave: false });
};

// Check if product is available
productSchema.methods.isAvailable = function () {
    return this.is_active &&
        this.status === 'active' &&
        !this.deleted_at &&
        (this.stock_status === 'unlimited' || this.stock_status === 'in_stock');
};

// Static Methods

// Find active products
productSchema.statics.findActive = function () {
    return this.find({
        is_active: true,
        status: 'active',
        deleted_at: null
    });
};

// Find by category
productSchema.statics.findByCategory = function (category, subCategory = null) {
    const query = {
        category: category,
        is_active: true,
        status: 'active',
        deleted_at: null
    };

    if (subCategory) {
        query.sub_category = subCategory;
    }

    return this.find(query);
};

// Search products
productSchema.statics.searchProducts = function (searchTerm, filters = {}) {
    const query = {
        $text: { $search: searchTerm },
        is_active: true,
        status: 'active',
        deleted_at: null,
        ...filters
    };

    return this.find(query, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
};

// Get product statistics
productSchema.statics.getStats = async function () {
    const stats = await this.aggregate([
        { $match: { deleted_at: null } },
        {
            $group: {
                _id: null,
                total_products: { $sum: 1 },
                active_products: {
                    $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] }
                },
                total_views: { $sum: '$analytics.view_count' },
                total_orders: { $sum: '$analytics.order_count' },
                total_revenue: { $sum: '$analytics.revenue_generated' }
            }
        }
    ]);

    const categoryStats = await this.aggregate([
        { $match: { deleted_at: null, is_active: true } },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 }
            }
        }
    ]);

    return {
        ...stats[0] || {
            total_products: 0,
            active_products: 0,
            total_views: 0,
            total_orders: 0,
            total_revenue: 0
        },
        by_category: categoryStats.reduce((acc, cat) => {
            acc[cat._id] = cat.count;
            return acc;
        }, {})
    };
};

// Get popular products
productSchema.statics.getPopular = function (limit = 10) {
    return this.find({
        is_active: true,
        status: 'active',
        deleted_at: null
    })
        .sort({ 'analytics.order_count': -1, 'analytics.view_count': -1 })
        .limit(limit);
};

// Soft delete product
productSchema.statics.softDelete = function (productId) {
    return this.findByIdAndUpdate(
        productId,
        {
            deleted_at: new Date(),
            is_active: false,
            status: 'discontinued'
        },
        { new: true }
    );
};

// Restore soft deleted product
productSchema.statics.restore = function (productId) {
    return this.findByIdAndUpdate(
        productId,
        {
            deleted_at: null,
            is_active: true,
            status: 'active'
        },
        { new: true }
    );
};

module.exports = mongoose.model('Product', productSchema);