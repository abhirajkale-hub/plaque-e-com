class ResponseUtils {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {Number} statusCode - HTTP status code
   * @param {Object} data - Response data
   * @param {String} message - Success message
   */
  static success(res, statusCode = 200, data = null, message = 'Operation successful') {
    const response = {
      success: true,
      message,
      ...(data && { data })
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {Number} statusCode - HTTP status code
   * @param {String} message - Error message
   * @param {String} code - Error code
   * @param {Object} details - Additional error details
   */
  static error(res, statusCode = 500, message = 'Internal server error', code = 'INTERNAL_ERROR', details = null) {
    const response = {
      success: false,
      error: {
        message,
        code,
        ...(details && { details })
      }
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   * @param {Object} res - Express response object
   * @param {Array} errors - Validation errors
   */
  static validationError(res, errors) {
    return this.error(res, 400, 'Validation failed', 'VALIDATION_ERROR', { errors });
  }

  /**
   * Send unauthorized response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static unauthorized(res, message = 'Access denied. Authentication required.') {
    return this.error(res, 401, message, 'UNAUTHORIZED');
  }

  /**
   * Send forbidden response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static forbidden(res, message = 'Access denied. Insufficient permissions.') {
    return this.error(res, 403, message, 'FORBIDDEN');
  }

  /**
   * Send not found response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, 404, message, 'NOT_FOUND');
  }

  /**
   * Send paginated response
   * @param {Object} res - Express response object
   * @param {Array} data - Response data
   * @param {Number} page - Current page
   * @param {Number} limit - Items per page
   * @param {Number} total - Total items
   * @param {String} message - Success message
   */
  static paginated(res, data, page, limit, total, message = 'Data retrieved successfully') {
    const totalPages = Math.ceil(total / limit);
    
    const response = {
      success: true,
      message,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

    return res.status(200).json(response);
  }
}

module.exports = ResponseUtils;