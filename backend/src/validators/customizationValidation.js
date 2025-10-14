const { body } = require('express-validator');

// Validation rules for creating customization
const createCustomizationValidation = [
    body('cart_item_id')
        .notEmpty()
        .withMessage('Cart item ID is required')
        .isString()
        .withMessage('Cart item ID must be a string')
        .trim(),

    body('product_id')
        .notEmpty()
        .withMessage('Product ID is required')
        .isString()
        .withMessage('Product ID must be a string')
        .trim(),

    body('variant_id')
        .notEmpty()
        .withMessage('Variant ID is required')
        .isString()
        .withMessage('Variant ID must be a string')
        .trim(),

    body('variant_size')
        .notEmpty()
        .withMessage('Variant size is required')
        .isString()
        .withMessage('Variant size must be a string')
        .trim(),

    body('production_notes')
        .optional()
        .isString()
        .withMessage('Production notes must be a string')
        .isLength({ max: 1000 })
        .withMessage('Production notes cannot exceed 1000 characters')
        .trim()
];

// Validation rules for updating customization
const updateCustomizationValidation = [
    body('production_notes')
        .optional()
        .isString()
        .withMessage('Production notes must be a string')
        .isLength({ max: 1000 })
        .withMessage('Production notes cannot exceed 1000 characters')
        .trim()
];

module.exports = {
    createCustomizationValidation,
    updateCustomizationValidation
};