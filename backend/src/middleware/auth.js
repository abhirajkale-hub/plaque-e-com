const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes (authentication)
const authenticate = async (req, res, next) => {
    try {
        let token;

        console.log('Auth Middleware - Request headers:', req.headers.authorization);

        // Check for token in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('Auth Middleware - Extracted token:', token ? 'Token present' : 'No token');
        }

        if (!token) {
            console.log('Auth Middleware - No token provided');
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Access denied. No token provided',
                    code: 'NO_TOKEN'
                }
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Auth Middleware - Token decoded successfully, user ID:', decoded.id);

        // Find user and attach to request
        const user = await User.findById(decoded.id);

        if (!user) {
            console.log('Auth Middleware - User not found for ID:', decoded.id);
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Token is not valid - user not found',
                    code: 'INVALID_TOKEN'
                }
            });
        }

        if (!user.is_active) {
            console.log('Auth Middleware - User account is deactivated:', user.email);
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Account is deactivated',
                    code: 'ACCOUNT_DEACTIVATED'
                }
            });
        }

        console.log('Auth Middleware - Authentication successful for user:', user.email);
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid token',
                    code: 'INVALID_TOKEN'
                }
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Token has expired',
                    code: 'TOKEN_EXPIRED'
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Server error during authentication',
                code: 'AUTH_SERVER_ERROR'
            }
        });
    }
};

// Middleware to check for admin role (authorization)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                }
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied. Insufficient permissions',
                    code: 'INSUFFICIENT_PERMISSIONS'
                }
            });
        }

        next();
    };
};

// Middleware to check if user is admin
const isAdmin = authorize('admin');

// Middleware to check if user is customer or admin
const isCustomerOrAdmin = authorize('customer', 'admin');

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (user && user.is_active) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

module.exports = {
    authenticate,
    authorize,
    isAdmin,
    isCustomerOrAdmin,
    optionalAuth
};
