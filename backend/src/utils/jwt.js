const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTUtils {
  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {String} JWT token
   */
  static generateToken(user) {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.full_name
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'my-trade-award',
      audience: 'my-trade-award-users'
    });
  }

  /**
   * Verify JWT token
   * @param {String} token - JWT token
   * @returns {Object} Decoded token payload
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'my-trade-award',
        audience: 'my-trade-award-users'
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate password reset token
   * @returns {String} Reset token
   */
  static generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate email verification token
   * @returns {String} Verification token
   */
  static generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash token for storage
   * @param {String} token - Token to hash
   * @returns {String} Hashed token
   */
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Extract token from Authorization header
   * @param {String} authHeader - Authorization header value
   * @returns {String|null} Token or null
   */
  static extractTokenFromHeader(authHeader) {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }
}

module.exports = JWTUtils;