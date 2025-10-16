// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    console.error('Error:', err.stack);

    // JSON parsing error
    if (err.type === 'entity.parse.failed' || err.message.includes('JSON')) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid JSON format in request body',
                code: 'INVALID_JSON'
            }
        });
    }

    // Body parser errors
    if (err.status === 400 && err.body === undefined) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid request body',
                code: 'INVALID_REQUEST_BODY'
            }
        });
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        return res.status(404).json({
            success: false,
            error: {
                message,
                code: 'RESOURCE_NOT_FOUND'
            }
        });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} already exists`;
        return res.status(400).json({
            success: false,
            error: {
                message,
                code: 'DUPLICATE_FIELD',
                details: { field }
            }
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => ({
            field: val.path,
            message: val.message
        }));

        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation error',
                code: 'VALIDATION_ERROR',
                details: errors
            }
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Invalid token',
                code: 'INVALID_TOKEN'
            }
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Token expired',
                code: 'TOKEN_EXPIRED'
            }
        });
    }

    // Default error
    res.status(error.statusCode || 500).json({
        success: false,
        error: {
            message: error.message || 'Server Error',
            code: error.code || 'SERVER_ERROR'
        }
    });
};

// 404 handler
const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.originalUrl} not found`,
            code: 'ROUTE_NOT_FOUND'
        }
    });
};

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Debug middleware for request logging
const debugRequest = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`${req.method} ${req.path}`, {
            headers: req.headers,
            body: req.body,
            query: req.query
        });
    }
    next();
};

module.exports = {
    errorHandler,
    notFound,
    asyncHandler,
    debugRequest
};