const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// Verify JWT token
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

// Generate random token
const generateRandomToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Hash token
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// Generate secure random password
const generateRandomPassword = (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
};

// Check if token is expired
const isTokenExpired = (expirationDate) => {
    return Date.now() > expirationDate;
};

module.exports = {
    generateToken,
    verifyToken,
    generateRandomToken,
    hashToken,
    generateRandomPassword,
    isTokenExpired
};