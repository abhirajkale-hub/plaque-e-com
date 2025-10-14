const express = require('express');
const router = express.Router();
const {
    createCustomization,
    getCustomizationByCartItem,
    getUserCustomizations,
    updateCustomization,
    deleteCustomization,
    downloadCertificate
} = require('../controllers/customizationController');
const { uploadCertificate, handleUploadError } = require('../middleware/upload');
const { optionalAuth, authenticate } = require('../middleware/auth');
const {
    createCustomizationValidation,
    updateCustomizationValidation
} = require('../validators/customizationValidation');

// Public routes (with optional auth for guest users)
router.post(
    '/',
    optionalAuth,
    uploadCertificate,
    handleUploadError,
    createCustomizationValidation,
    createCustomization
);

router.get(
    '/cart-item/:cartItemId',
    optionalAuth,
    getCustomizationByCartItem
);

// Protected routes (require authentication)
router.get(
    '/user',
    authenticate,
    getUserCustomizations
);

router.put(
    '/:id',
    optionalAuth,
    uploadCertificate,
    handleUploadError,
    updateCustomizationValidation,
    updateCustomization
);

router.delete(
    '/:id',
    optionalAuth,
    deleteCustomization
);

router.get(
    '/:id/download',
    optionalAuth,
    downloadCertificate
);

module.exports = router;