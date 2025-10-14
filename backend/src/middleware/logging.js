/**
 * Logging Middleware for HTTP Requests
 */

const { LoggingService } = require('../services/loggingService');

// Utility function to generate correlation ID
const generateCorrelationId = () => {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    // Generate correlation ID for request tracking
    req.correlationId = generateCorrelationId();

    // Capture request start time
    req.startTime = Date.now();

    // Extract user information if available
    const userId = req.user?._id || req.user?.id || 'anonymous';
    const userEmail = req.user?.email || 'unknown';

    // Log request start
    LoggingService.info('HTTP Request started', {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId,
        userEmail: userEmail !== 'unknown' ? userEmail : undefined,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        bodySize: req.get('Content-Length') || 0
    });

    // Capture original send function
    const originalSend = res.send;

    // Override send function to log response
    res.send = function (data) {
        const responseTime = Date.now() - req.startTime;

        // Log response
        LoggingService.apiRequest(
            req.method,
            req.path,
            res.statusCode,
            responseTime,
            {
                correlationId: req.correlationId,
                userId,
                userEmail: userEmail !== 'unknown' ? userEmail : undefined,
                responseSize: data ? data.length : 0,
                ip: req.ip || req.connection.remoteAddress
            }
        );

        // Log performance warning if request is slow
        if (responseTime > 3000) {
            LoggingService.performance('Slow HTTP Request', responseTime, {
                correlationId: req.correlationId,
                method: req.method,
                path: req.path,
                userId,
                statusCode: res.statusCode
            });
        }

        // Call original send
        return originalSend.call(this, data);
    };

    next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
    const responseTime = Date.now() - (req.startTime || Date.now());

    LoggingService.error('HTTP Request error', {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode || 500,
        responseTime,
        userId: req.user?._id || req.user?.id || 'anonymous',
        userEmail: req.user?.email || 'unknown',
        ip: req.ip || req.connection.remoteAddress,
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack
        }
    });

    // Log security events for certain error types
    if (err.name === 'UnauthorizedError' || err.status === 401) {
        LoggingService.securityEvent('Unauthorized access attempt', {
            correlationId: req.correlationId,
            path: req.path,
            method: req.method,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        });
    }

    next(err);
};

// Payment-specific request logger
const paymentRequestLogger = (req, res, next) => {
    const paymentAction = req.path.split('/').pop();

    LoggingService.paymentInfo('Payment API request', {
        correlationId: req.correlationId,
        action: paymentAction,
        method: req.method,
        path: req.path,
        userId: req.user?._id || 'anonymous',
        userEmail: req.user?.email || 'unknown',
        ip: req.ip || req.connection.remoteAddress,
        orderId: req.body?.orderId || req.params?.orderId || undefined,
        amount: req.body?.amount || undefined,
        razorpayOrderId: req.body?.razorpayOrderId || undefined
    });

    next();
};

// Shipping-specific request logger
const shippingRequestLogger = (req, res, next) => {
    const shippingAction = req.path.split('/').pop();

    LoggingService.shippingInfo('Shipping API request', {
        correlationId: req.correlationId,
        action: shippingAction,
        method: req.method,
        path: req.path,
        userId: req.user?._id || 'anonymous',
        userEmail: req.user?.email || 'unknown',
        ip: req.ip || req.connection.remoteAddress,
        orderId: req.body?.orderId || req.params?.orderId || undefined,
        awbCode: req.body?.awbCode || req.params?.identifier || undefined
    });

    next();
};

module.exports = {
    requestLogger,
    errorLogger,
    paymentRequestLogger,
    shippingRequestLogger
};