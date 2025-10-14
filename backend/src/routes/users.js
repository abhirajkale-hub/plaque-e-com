const express = require('express');
const {
    getUserProfile,
    updateUserProfile,
    getUserAddresses,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress,
    setDefaultAddress,
    getUserPreferences,
    updateUserPreferences,
    deleteUserAccount,
    downloadUserData
} = require('../controllers/userController');

const { authenticate } = require('../middleware/auth');

const router = express.Router();

// User profile routes
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile);

// User address routes
router.get('/addresses', authenticate, getUserAddresses);
router.post('/addresses', authenticate, addUserAddress);
router.put('/addresses/:addressId', authenticate, updateUserAddress);
router.delete('/addresses/:addressId', authenticate, deleteUserAddress);
router.patch('/addresses/:addressId/default', authenticate, setDefaultAddress);

// User preferences routes
router.get('/preferences', authenticate, getUserPreferences);
router.put('/preferences', authenticate, updateUserPreferences);

// User account management
router.delete('/account', authenticate, deleteUserAccount);
router.get('/download-data', authenticate, downloadUserData);

// Note: Admin user management routes are in admin.js (/admin/users/*)

module.exports = router;