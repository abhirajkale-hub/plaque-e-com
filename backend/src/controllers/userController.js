const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    full_name: user.full_name,
                    phone: user.phone,
                    role: user.role,
                    is_active: user.is_active,
                    email_verified: user.email_verified,
                    last_login: user.last_login,
                    created_at: user.created_at,
                    addresses: user.addresses,
                    preferences: user.preferences,
                    referral_code: user.referral_code
                }
            }
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch profile',
                code: 'FETCH_PROFILE_ERROR'
            }
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const { full_name, phone } = req.body;

        // Validate input
        if (!full_name || full_name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Full name must be at least 2 characters long',
                    code: 'INVALID_NAME'
                }
            });
        }

        if (phone && !/^\+?[\d\s-()]+$/.test(phone)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Please provide a valid phone number',
                    code: 'INVALID_PHONE'
                }
            });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        // Update fields
        user.full_name = full_name.trim();
        if (phone) {
            user.phone = phone.trim();
        }

        await user.save();

        res.status(200).json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    full_name: user.full_name,
                    phone: user.phone,
                    role: user.role,
                    is_active: user.is_active,
                    email_verified: user.email_verified,
                    last_login: user.last_login,
                    created_at: user.created_at,
                    updated_at: user.updated_at
                }
            },
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Error updating user profile:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));

            return res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: errors
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update profile',
                code: 'UPDATE_PROFILE_ERROR'
            }
        });
    }
};

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const role = req.query.role || 'all';
        const status = req.query.status || 'all';

        // Build query
        let query = {};

        if (search) {
            query.$or = [
                { full_name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role !== 'all') {
            query.role = role;
        }

        if (status !== 'all') {
            query.is_active = status === 'active';
        }

        const users = await User.find(query)
            .select('-password -password_reset_token -password_reset_expires -email_verification_token -__v')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);
        const pages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages
            }
        });

    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch users',
                code: 'FETCH_USERS_ERROR'
            }
        });
    }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Validate role
        if (!['admin', 'customer'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid role. Must be admin or customer',
                    code: 'INVALID_ROLE'
                }
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        // Prevent admin from changing their own role
        if (user._id.equals(req.user._id)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Cannot change your own role',
                    code: 'CANNOT_CHANGE_OWN_ROLE'
                }
            });
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                data: {
                    _id: user._id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    updated_at: user.updated_at
                }
            },
            message: 'User role updated successfully'
        });

    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update user role',
                code: 'UPDATE_ROLE_ERROR'
            }
        });
    }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        // Prevent admin from deleting themselves
        if (user._id.equals(req.user._id)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Cannot delete your own account',
                    code: 'CANNOT_DELETE_SELF'
                }
            });
        }

        // Soft delete by deactivating user instead of hard delete
        user.isActive = false;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User deactivated successfully'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete user',
                code: 'DELETE_USER_ERROR'
            }
        });
    }
};

// @desc    Get user addresses
// @route   GET /api/users/addresses
// @access  Private
const getUserAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('addresses');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                addresses: user.addresses
            }
        });

    } catch (error) {
        console.error('Error fetching user addresses:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch addresses',
                code: 'FETCH_ADDRESSES_ERROR'
            }
        });
    }
};

// @desc    Add user address
// @route   POST /api/users/addresses
// @access  Private
const addUserAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        const addressData = {
            type: req.body.type,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            company: req.body.company,
            address1: req.body.address1,
            address2: req.body.address2,
            city: req.body.city,
            state: req.body.state,
            postalCode: req.body.postalCode,
            country: req.body.country || 'India',
            phone: req.body.phone,
            isDefault: req.body.isDefault || false
        };

        await user.addAddress(addressData);

        res.status(201).json({
            success: true,
            data: {
                message: 'Address added successfully',
                address: user.addresses[user.addresses.length - 1]
            }
        });

    } catch (error) {
        console.error('Error adding user address:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to add address',
                code: 'ADD_ADDRESS_ERROR'
            }
        });
    }
};

// @desc    Update user address
// @route   PUT /api/users/addresses/:addressId
// @access  Private
const updateUserAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        const updateData = {
            type: req.body.type,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            company: req.body.company,
            address1: req.body.address1,
            address2: req.body.address2,
            city: req.body.city,
            state: req.body.state,
            postalCode: req.body.postalCode,
            country: req.body.country,
            phone: req.body.phone,
            isDefault: req.body.isDefault
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        await user.updateAddress(req.params.addressId, updateData);

        const updatedAddress = user.addresses.id(req.params.addressId);

        res.status(200).json({
            success: true,
            data: {
                message: 'Address updated successfully',
                address: updatedAddress
            }
        });

    } catch (error) {
        console.error('Error updating user address:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to update address',
                code: 'UPDATE_ADDRESS_ERROR'
            }
        });
    }
};

// @desc    Delete user address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
const deleteUserAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        await user.deleteAddress(req.params.addressId);

        res.status(200).json({
            success: true,
            data: {
                message: 'Address deleted successfully'
            }
        });

    } catch (error) {
        console.error('Error deleting user address:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to delete address',
                code: 'DELETE_ADDRESS_ERROR'
            }
        });
    }
};

// @desc    Set default user address
// @route   PATCH /api/users/addresses/:addressId/default
// @access  Private
const setDefaultAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        await user.setDefaultAddress(req.params.addressId);

        const defaultAddress = user.getDefaultAddress();

        res.status(200).json({
            success: true,
            data: {
                message: 'Default address updated successfully',
                address: defaultAddress
            }
        });

    } catch (error) {
        console.error('Error setting default address:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to set default address',
                code: 'SET_DEFAULT_ADDRESS_ERROR'
            }
        });
    }
};

// @desc    Get user preferences
// @route   GET /api/users/preferences
// @access  Private
const getUserPreferences = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('preferences');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                preferences: user.preferences
            }
        });

    } catch (error) {
        console.error('Error fetching user preferences:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch preferences',
                code: 'FETCH_PREFERENCES_ERROR'
            }
        });
    }
};

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
const updateUserPreferences = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        await user.updatePreferences(req.body);

        res.status(200).json({
            success: true,
            data: {
                message: 'Preferences updated successfully',
                preferences: user.preferences
            }
        });

    } catch (error) {
        console.error('Error updating user preferences:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to update preferences',
                code: 'UPDATE_PREFERENCES_ERROR'
            }
        });
    }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
const deleteUserAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        // For safety, we'll deactivate instead of hard delete
        // You can modify this logic based on your requirements
        user.isActive = false;
        user.email = `deleted_${Date.now()}_${user.email}`;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                message: 'Account deleted successfully'
            }
        });

    } catch (error) {
        console.error('Error deleting user account:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete account',
                code: 'DELETE_ACCOUNT_ERROR'
            }
        });
    }
};

// @desc    Download user data (GDPR compliance)
// @route   GET /api/users/download-data
// @access  Private
const downloadUserData = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        // Include related data like orders
        const Order = require('../models/Order');
        const orders = await Order.find({ user_id: req.user._id });

        const userData = {
            profile: user.toObject(),
            orders: orders,
            exportedAt: new Date(),
            dataRetentionPolicy: 'Data will be retained according to our privacy policy'
        };

        res.status(200).json({
            success: true,
            data: userData
        });

    } catch (error) {
        console.error('Error downloading user data:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to download user data',
                code: 'DOWNLOAD_DATA_ERROR'
            }
        });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    updateUserRole,
    deleteUser,
    getUserAddresses,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress,
    setDefaultAddress,
    getUserPreferences,
    updateUserPreferences,
    deleteUserAccount,
    downloadUserData
};