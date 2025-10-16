const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 255
    },
    imageUrl: {
        type: String,
        required: true
    },
    isLocalUpload: {
        type: Boolean,
        default: false
    },
    fileName: {
        type: String,
        required: function () {
            return this.isLocalUpload;
        }
    },
    fileSize: {
        type: Number,
        required: function () {
            return this.isLocalUpload;
        }
    },
    mimeType: {
        type: String,
        required: function () {
            return this.isLocalUpload;
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    customerName: {
        type: String,
        default: 'Valued Customer'
    },
    customerRole: {
        type: String,
        default: 'Funded Trader'
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for sorting and querying
gallerySchema.index({ isActive: 1, sortOrder: 1, createdAt: -1 });

// Virtual for full image URL
gallerySchema.virtual('fullImageUrl').get(function () {
    if (this.isLocalUpload) {
        return this.imageUrl; // Already contains the relative path
    }
    return this.imageUrl; // External URL
});

// Method to increment sort order for all other items
gallerySchema.statics.updateSortOrder = async function (excludeId = null) {
    const filter = { isActive: true };
    if (excludeId) {
        filter._id = { $ne: excludeId };
    }

    const items = await this.find(filter).sort({ sortOrder: 1, createdAt: 1 });

    for (let i = 0; i < items.length; i++) {
        items[i].sortOrder = i;
        await items[i].save();
    }
};

// Pre-save middleware to handle sort order
gallerySchema.pre('save', async function (next) {
    if (this.isNew) {
        const maxSortOrder = await this.constructor.findOne({ isActive: true })
            .sort({ sortOrder: -1 })
            .select('sortOrder');

        this.sortOrder = maxSortOrder ? maxSortOrder.sortOrder + 1 : 0;
    }
    next();
});

module.exports = mongoose.model('Gallery', gallerySchema);