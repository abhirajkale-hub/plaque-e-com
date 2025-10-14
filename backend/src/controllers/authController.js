const User = require('../models/User');
const { generateToken, generateRandomToken, hashToken } = require('../utils/tokenUtils');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        console.log('=== REGISTRATION REQUEST ===');
        console.log('Request body:', req.body);
        console.log('============================');

        const { email, password, full_name, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'User with this email already exists',
                    code: 'USER_EXISTS'
                }
            });
        }

        // Create new user
        const user = new User({
            email,
            password,
            full_name,
            phone
        });

        await user.save();

        // Generate JWT token
        const token = generateToken(user._id);

        // Send welcome email (don't wait for it)
        sendWelcomeEmail(user.email, user.full_name).catch(error => {
            console.error('Failed to send welcome email:', error);
        });

        res.status(201).json({
            success: true,
            data: {
                user: user.getSummary(),
                token
            },
            message: 'User registered successfully'
        });
    } catch (error) {
        console.error('Registration error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Email already exists',
                    code: 'DUPLICATE_EMAIL'
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Server error during registration',
                code: 'REGISTRATION_ERROR'
            }
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user with password field
        const user = await User.findByEmail(email).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid email or password',
                    code: 'INVALID_CREDENTIALS'
                }
            });
        }

        // Check if account is active
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Account is deactivated. Please contact support',
                    code: 'ACCOUNT_DEACTIVATED'
                }
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid email or password',
                    code: 'INVALID_CREDENTIALS'
                }
            });
        }

        // Update last login
        await user.updateLastLogin();

        // Generate JWT token
        const token = generateToken(user._id);

        res.json({
            success: true,
            data: {
                user: user.getSummary(),
                token
            },
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Server error during login',
                code: 'LOGIN_ERROR'
            }
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        // req.user is already the full user object from auth middleware
        const user = req.user;

        res.json({
            success: true,
            data: user.getSummary(), // Return user data directly in data field
            message: 'User profile retrieved successfully'
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Server error retrieving user profile',
                code: 'PROFILE_ERROR'
            }
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
    try {
        // Note: With JWT, logout is mainly handled on the client side
        // Here we could implement token blacklisting if needed

        res.json({
            success: true,
            data: {},
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Server error during logout',
                code: 'LOGOUT_ERROR'
            }
        });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findByEmail(email);

        if (!user) {
            // Don't reveal if email exists for security
            return res.json({
                success: true,
                data: {},
                message: 'If an account with that email exists, a password reset link has been sent'
            });
        }

        // Generate reset token
        const resetToken = generateRandomToken();
        const hashedToken = hashToken(resetToken);

        // Save reset token to user
        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save({ validateBeforeSave: false });

        try {
            // Send password reset email
            await sendPasswordResetEmail(user.email, user.full_name, resetToken);

            res.json({
                success: true,
                data: {},
                message: 'Password reset link sent to email'
            });
        } catch (emailError) {
            // Reset the token fields if email fails
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            console.error('Password reset email error:', emailError);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Error sending password reset email',
                    code: 'EMAIL_ERROR'
                }
            });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Server error during password reset request',
                code: 'FORGOT_PASSWORD_ERROR'
            }
        });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Hash the token to compare with stored token
        const hashedToken = hashToken(token);

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid or expired reset token',
                    code: 'INVALID_RESET_TOKEN'
                }
            });
        }

        // Set new password
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Generate new JWT token
        const jwtToken = generateToken(user._id);

        res.json({
            success: true,
            data: {
                user: user.profile,
                token: jwtToken
            },
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Server error during password reset',
                code: 'RESET_PASSWORD_ERROR'
            }
        });
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');

        // Check current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);

        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Current password is incorrect',
                    code: 'INVALID_CURRENT_PASSWORD'
                }
            });
        }

        // Set new password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            data: {},
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Server error during password change',
                code: 'CHANGE_PASSWORD_ERROR'
            }
        });
    }
};

module.exports = {
    register,
    login,
    getMe,
    logout,
    forgotPassword,
    resetPassword,
    changePassword
};
