const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Address sub-schema aligned with frontend expectations
const addressSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['home', 'work', 'other'],
        default: 'home'
    },
    first_name: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    last_name: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    company: {
        type: String,
        trim: true,
        maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    address_line_1: {
        type: String,
        required: [true, 'Address line 1 is required'],
        trim: true,
        maxlength: [200, 'Address line 1 cannot exceed 200 characters']
    },
    address_line_2: {
        type: String,
        trim: true,
        maxlength: [200, 'Address line 2 cannot exceed 200 characters']
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
        maxlength: [100, 'State cannot exceed 100 characters']
    },
    postal_code: {
        type: String,
        required: [true, 'Postal code is required'],
        trim: true,
        maxlength: [20, 'Postal code cannot exceed 20 characters']
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
        default: 'India',
        maxlength: [100, 'Country cannot exceed 100 characters']
    },
    is_default: {
        type: Boolean,
        default: false
    }
}, {
    _id: true,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Main user schema aligned with frontend MockUser interface and Supabase types
const userSchema = new mongoose.Schema({
    // Core identification - aligned with frontend MockUser
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email'
        ],
        index: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Don't include password in queries by default
    },
    full_name: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },

    // Role system aligned with frontend expectations
    role: {
        type: String,
        enum: ['admin', 'customer'],
        default: 'customer',
        index: true
    },

    // Status fields - using snake_case for frontend compatibility
    is_active: {
        type: Boolean,
        default: true,
        index: true
    },
    email_verified: {
        type: Boolean,
        default: false
    },

    // Profile fields aligned with Supabase profiles table
    profile_id: {
        type: String, // For Supabase compatibility
        unique: true,
        sparse: true
    },

    // Security and verification tokens
    email_verification_token: {
        type: String,
        select: false
    },
    password_reset_token: {
        type: String,
        select: false
    },
    password_reset_expires: {
        type: Date,
        select: false
    },

    // Activity tracking
    last_login: {
        type: Date
    },
    login_count: {
        type: Number,
        default: 0
    },

    // Address management - aligned with frontend address structure
    addresses: [addressSchema],
    default_address_id: {
        type: mongoose.Schema.Types.ObjectId
    },

    // User preferences and settings
    preferences: {
        newsletter_subscribed: {
            type: Boolean,
            default: false
        },
        marketing_emails: {
            type: Boolean,
            default: false
        },
        currency: {
            type: String,
            default: 'INR'
        },
        language: {
            type: String,
            default: 'en'
        }
    },

    // Social/affiliate tracking
    referral_code: {
        type: String,
        uppercase: true,
        sparse: true,
        unique: true
    },
    referred_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Metadata for analytics
    signup_source: {
        type: String,
        enum: ['web', 'mobile', 'admin', 'affiliate', 'social'],
        default: 'web'
    },
    user_agent: String,
    ip_address: String,

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
    collection: 'users',
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            // Keep _id as standard MongoDB format
            delete ret.__v;
            delete ret.password;
            delete ret.email_verification_token;
            delete ret.password_reset_token;
            delete ret.password_reset_expires;
            return ret;
        }
    }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ is_active: 1 });
userSchema.index({ referral_code: 1 });
userSchema.index({ created_at: -1 });
userSchema.index({ deleted_at: 1 });

// Virtual for user's full address
userSchema.virtual('default_address').get(function () {
    if (this.default_address_id && this.addresses && this.addresses.length > 0) {
        return this.addresses.id(this.default_address_id);
    }
    return this.addresses && this.addresses.length > 0 ? this.addresses[0] : null;
});

// Pre-save middleware for password hashing
userSchema.pre('save', async function (next) {
    // Only hash password if it's been modified (or is new)
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

// Pre-save middleware for referral code generation
userSchema.pre('save', function (next) {
    if (!this.referral_code && this.isNew) {
        // Generate referral code from full name or email
        const baseName = this.full_name || this.email.split('@')[0];
        this.referral_code = baseName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6) +
            Math.random().toString(36).substring(2, 5).toUpperCase();
    }
    next();
});

// Instance Methods

// Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) {
        throw new Error('Password not available for comparison');
    }
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.password_reset_token = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.password_reset_expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
};

// Generate email verification token
userSchema.methods.createEmailVerificationToken = function () {
    const verificationToken = crypto.randomBytes(32).toString('hex');

    this.email_verification_token = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    return verificationToken;
};

// Get user's primary address
userSchema.methods.getPrimaryAddress = function () {
    if (this.default_address_id) {
        return this.addresses.id(this.default_address_id);
    }
    return this.addresses && this.addresses.length > 0 ? this.addresses[0] : null;
};

// Add or update address
userSchema.methods.addAddress = function (addressData) {
    this.addresses.push(addressData);

    // Set as default if it's the first address or explicitly marked as default
    if (this.addresses.length === 1 || addressData.is_default) {
        this.default_address_id = this.addresses[this.addresses.length - 1]._id;

        // Remove default flag from other addresses
        this.addresses.forEach((addr, index) => {
            if (index !== this.addresses.length - 1) {
                addr.is_default = false;
            }
        });
    }

    return this.addresses[this.addresses.length - 1];
};

// Update login tracking
userSchema.methods.updateLastLogin = function () {
    this.last_login = new Date();
    this.login_count = (this.login_count || 0) + 1;
    return this.save({ validateBeforeSave: false });
};

// Check if user can perform admin actions
userSchema.methods.isAdmin = function () {
    return this.role === 'admin' && this.is_active;
};

// Get user summary for frontend
userSchema.methods.getSummary = function () {
    return {
        _id: this._id,
        email: this.email,
        full_name: this.full_name,
        role: this.role,
        is_active: this.is_active,
        email_verified: this.email_verified,
        created_at: this.created_at,
        last_login: this.last_login
    };
};

// Static Methods

// Find user by email (case insensitive)
userSchema.statics.findByEmail = function (email) {
    return this.findOne({
        email: email.toLowerCase(),
        deleted_at: null
    });
};

// Find active users
userSchema.statics.findActive = function () {
    return this.find({
        is_active: true,
        deleted_at: null
    });
};

// Find by role
userSchema.statics.findByRole = function (role) {
    return this.find({
        role: role,
        is_active: true,
        deleted_at: null
    });
};

// Get user statistics
userSchema.statics.getStats = async function () {
    const stats = await this.aggregate([
        { $match: { deleted_at: null } },
        {
            $group: {
                _id: null,
                total_users: { $sum: 1 },
                active_users: {
                    $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] }
                },
                verified_users: {
                    $sum: { $cond: [{ $eq: ['$email_verified', true] }, 1, 0] }
                },
                admin_users: {
                    $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
                },
                customer_users: {
                    $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] }
                }
            }
        }
    ]);

    return stats[0] || {
        total_users: 0,
        active_users: 0,
        verified_users: 0,
        admin_users: 0,
        customer_users: 0
    };
};

// Soft delete user
userSchema.statics.softDelete = function (userId) {
    return this.findByIdAndUpdate(
        userId,
        {
            deleted_at: new Date(),
            is_active: false
        },
        { new: true }
    );
};

// Restore soft deleted user
userSchema.statics.restore = function (userId) {
    return this.findByIdAndUpdate(
        userId,
        {
            deleted_at: null,
            is_active: true
        },
        { new: true }
    );
};

module.exports = mongoose.model('User', userSchema);