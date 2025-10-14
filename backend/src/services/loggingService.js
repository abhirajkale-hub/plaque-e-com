const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for structured logging
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...meta
        };

        // Add correlation ID if available
        if (meta.correlationId) {
            logEntry.correlationId = meta.correlationId;
        }

        return JSON.stringify(logEntry);
    })
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let logMessage = `${timestamp} [${level}] ${message}`;

        if (meta.correlationId) {
            logMessage += ` [${meta.correlationId}]`;
        }

        if (meta.userId) {
            logMessage += ` [User: ${meta.userId}]`;
        }

        if (meta.orderId) {
            logMessage += ` [Order: ${meta.orderId}]`;
        }

        if (Object.keys(meta).length > 0) {
            // Filter out already displayed metadata
            const filteredMeta = { ...meta };
            delete filteredMeta.correlationId;
            delete filteredMeta.userId;
            delete filteredMeta.orderId;

            if (Object.keys(filteredMeta).length > 0) {
                logMessage += ` ${JSON.stringify(filteredMeta)}`;
            }
        }

        return logMessage;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: {
        service: 'my-trade-award-backend',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // Error log file
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),

        // Combined log file
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 10
        }),

        // Payment audit log
        new winston.transports.File({
            filename: path.join(logsDir, 'payments.log'),
            level: 'info',
            maxsize: 10485760, // 10MB
            maxFiles: 20,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),

        // Shipping audit log
        new winston.transports.File({
            filename: path.join(logsDir, 'shipping.log'),
            level: 'info',
            maxsize: 10485760, // 10MB
            maxFiles: 20,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),

        // Security events log
        new winston.transports.File({
            filename: path.join(logsDir, 'security.log'),
            level: 'warn',
            maxsize: 5242880, // 5MB
            maxFiles: 10
        })
    ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Generate correlation ID for request tracking
const generateCorrelationId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Enhanced logging methods
class LoggingService {
    static generateCorrelationId() {
        return generateCorrelationId();
    }

    // General logging methods
    static info(message, meta = {}) {
        logger.info(message, meta);
    }

    static warn(message, meta = {}) {
        logger.warn(message, meta);
    }

    static error(message, meta = {}) {
        logger.error(message, meta);
    }

    static debug(message, meta = {}) {
        logger.debug(message, meta);
    }

    // Payment-specific logging
    static paymentInfo(message, paymentData = {}) {
        const logData = {
            category: 'PAYMENT',
            ...paymentData,
            timestamp: new Date().toISOString()
        };

        logger.info(message, logData);

        // Also log to payment-specific file
        const paymentLogger = winston.createLogger({
            transports: [
                new winston.transports.File({
                    filename: path.join(logsDir, 'payments.log'),
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    )
                })
            ]
        });

        paymentLogger.info(message, logData);
    }

    static paymentError(message, paymentData = {}, error = null) {
        const logData = {
            category: 'PAYMENT_ERROR',
            ...paymentData,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : null,
            timestamp: new Date().toISOString()
        };

        logger.error(message, logData);
    }

    static paymentAudit(action, paymentData = {}) {
        const auditData = {
            category: 'PAYMENT_AUDIT',
            action,
            ...paymentData,
            timestamp: new Date().toISOString()
        };

        this.paymentInfo(`Payment Audit: ${action}`, auditData);
    }

    // Shipping-specific logging
    static shippingInfo(message, shippingData = {}) {
        const logData = {
            category: 'SHIPPING',
            ...shippingData,
            timestamp: new Date().toISOString()
        };

        logger.info(message, logData);

        // Also log to shipping-specific file
        const shippingLogger = winston.createLogger({
            transports: [
                new winston.transports.File({
                    filename: path.join(logsDir, 'shipping.log'),
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    )
                })
            ]
        });

        shippingLogger.info(message, logData);
    }

    static shippingError(message, shippingData = {}, error = null) {
        const logData = {
            category: 'SHIPPING_ERROR',
            ...shippingData,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : null,
            timestamp: new Date().toISOString()
        };

        logger.error(message, logData);
    }

    static shippingAudit(action, shippingData = {}) {
        const auditData = {
            category: 'SHIPPING_AUDIT',
            action,
            ...shippingData,
            timestamp: new Date().toISOString()
        };

        this.shippingInfo(`Shipping Audit: ${action}`, auditData);
    }

    // Security logging
    static securityEvent(message, securityData = {}) {
        const logData = {
            category: 'SECURITY',
            ...securityData,
            timestamp: new Date().toISOString(),
            severity: 'HIGH'
        };

        logger.warn(message, logData);
    }

    static authAttempt(success, userData = {}) {
        const logData = {
            category: 'AUTH_ATTEMPT',
            success,
            ...userData,
            timestamp: new Date().toISOString()
        };

        if (success) {
            logger.info('Authentication successful', logData);
        } else {
            logger.warn('Authentication failed', logData);
        }
    }

    // API request logging
    static apiRequest(method, path, statusCode, responseTime, requestData = {}) {
        const logData = {
            category: 'API_REQUEST',
            method,
            path,
            statusCode,
            responseTime,
            ...requestData,
            timestamp: new Date().toISOString()
        };

        const level = statusCode >= 400 ? 'warn' : 'info';
        logger[level](`${method} ${path} - ${statusCode} (${responseTime}ms)`, logData);
    }

    // Database operation logging
    static dbOperation(operation, collection, result, duration, operationData = {}) {
        const logData = {
            category: 'DATABASE',
            operation,
            collection,
            result,
            duration,
            ...operationData,
            timestamp: new Date().toISOString()
        };

        logger.debug(`DB ${operation} on ${collection}`, logData);
    }

    // Business logic logging
    static businessEvent(event, data = {}) {
        const logData = {
            category: 'BUSINESS_EVENT',
            event,
            ...data,
            timestamp: new Date().toISOString()
        };

        logger.info(`Business Event: ${event}`, logData);
    }

    // Performance monitoring
    static performance(operation, duration, performanceData = {}) {
        const logData = {
            category: 'PERFORMANCE',
            operation,
            duration,
            ...performanceData,
            timestamp: new Date().toISOString()
        };

        const level = duration > 5000 ? 'warn' : 'info'; // Warn if operation takes > 5 seconds
        logger[level](`Performance: ${operation} took ${duration}ms`, logData);
    }
}

module.exports = {
    logger,
    LoggingService,
    generateCorrelationId
};