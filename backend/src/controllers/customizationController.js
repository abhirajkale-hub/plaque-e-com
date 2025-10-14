const ProductCustomization = require('../models/ProductCustomization');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// Create product customization
const createCustomization = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    details: errors.array(),
                    code: 'VALIDATION_ERROR'
                }
            });
        }

        const {
            cart_item_id,
            product_id,
            variant_id,
            variant_size,
            production_notes
        } = req.body;

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Certificate image is required',
                    code: 'CERTIFICATE_REQUIRED'
                }
            });
        }

        // Get user ID (from auth middleware or session for guest users)
        const userId = req.user ? req.user.id : req.session?.guestId || `guest_${Date.now()}`;

        // Check if customization already exists for this cart item
        const existingCustomization = await ProductCustomization.findByCartItemId(cart_item_id);
        if (existingCustomization) {
            // Delete old certificate file if exists
            if (existingCustomization.certificate_image) {
                const oldFilePath = path.join(__dirname, '../../uploads/certificates', existingCustomization.certificate_image);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
            // Remove old customization
            await ProductCustomization.findByIdAndDelete(existingCustomization._id);
        }

        // Create new customization
        const customization = new ProductCustomization({
            user_id: userId,
            cart_item_id,
            product_id,
            variant_id,
            variant_size,
            certificate_image: req.file.filename,
            certificate_original_name: req.file.originalname,
            certificate_mime_type: req.file.mimetype,
            certificate_size: req.file.size,
            production_notes: production_notes || '',
            status: 'pending'
        });

        await customization.save();

        res.status(201).json({
            success: true,
            data: {
                customization: customization.toSafeObject()
            },
            message: 'Product customization created successfully'
        });

    } catch (error) {
        console.error('Create customization error:', error);

        // Clean up uploaded file if error occurs
        if (req.file) {
            const filePath = path.join(__dirname, '../../uploads/certificates', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create product customization',
                code: 'CUSTOMIZATION_ERROR'
            }
        });
    }
};

// Get customization by cart item ID
const getCustomizationByCartItem = async (req, res) => {
    try {
        const { cartItemId } = req.params;

        const customization = await ProductCustomization.findByCartItemId(cartItemId);

        if (!customization) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Customization not found',
                    code: 'CUSTOMIZATION_NOT_FOUND'
                }
            });
        }

        res.json({
            success: true,
            data: {
                customization: customization.toSafeObject()
            }
        });

    } catch (error) {
        console.error('Get customization error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve customization',
                code: 'CUSTOMIZATION_ERROR'
            }
        });
    }
};

// Get all customizations for a user
const getUserCustomizations = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : req.session?.guestId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'User identification required',
                    code: 'USER_ID_REQUIRED'
                }
            });
        }

        const customizations = await ProductCustomization.findByUserId(userId);

        res.json({
            success: true,
            data: {
                customizations: customizations.map(c => c.toSafeObject())
            }
        });

    } catch (error) {
        console.error('Get user customizations error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve customizations',
                code: 'CUSTOMIZATION_ERROR'
            }
        });
    }
};

// Update customization
const updateCustomization = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    details: errors.array(),
                    code: 'VALIDATION_ERROR'
                }
            });
        }

        const { id } = req.params;
        const { production_notes } = req.body;

        const customization = await ProductCustomization.findById(id);

        if (!customization) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Customization not found',
                    code: 'CUSTOMIZATION_NOT_FOUND'
                }
            });
        }

        // Check ownership for authenticated users
        const userId = req.user ? req.user.id : req.session?.guestId;
        if (customization.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        // Update certificate if new file uploaded
        if (req.file) {
            // Delete old certificate file
            if (customization.certificate_image) {
                const oldFilePath = path.join(__dirname, '../../uploads/certificates', customization.certificate_image);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }

            customization.certificate_image = req.file.filename;
            customization.certificate_original_name = req.file.originalname;
            customization.certificate_mime_type = req.file.mimetype;
            customization.certificate_size = req.file.size;
        }

        // Update production notes
        if (production_notes !== undefined) {
            customization.production_notes = production_notes;
        }

        await customization.save();

        res.json({
            success: true,
            data: {
                customization: customization.toSafeObject()
            },
            message: 'Customization updated successfully'
        });

    } catch (error) {
        console.error('Update customization error:', error);

        // Clean up uploaded file if error occurs
        if (req.file) {
            const filePath = path.join(__dirname, '../../uploads/certificates', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update customization',
                code: 'CUSTOMIZATION_ERROR'
            }
        });
    }
};

// Delete customization
const deleteCustomization = async (req, res) => {
    try {
        const { id } = req.params;

        const customization = await ProductCustomization.findById(id);

        if (!customization) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Customization not found',
                    code: 'CUSTOMIZATION_NOT_FOUND'
                }
            });
        }

        // Check ownership for authenticated users
        const userId = req.user ? req.user.id : req.session?.guestId;
        if (customization.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        // Delete certificate file
        if (customization.certificate_image) {
            const filePath = path.join(__dirname, '../../uploads/certificates', customization.certificate_image);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Soft delete
        customization.is_active = false;
        await customization.save();

        res.json({
            success: true,
            message: 'Customization deleted successfully'
        });

    } catch (error) {
        console.error('Delete customization error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete customization',
                code: 'CUSTOMIZATION_ERROR'
            }
        });
    }
};

// Download certificate file
const downloadCertificate = async (req, res) => {
    try {
        const { id } = req.params;

        const customization = await ProductCustomization.findById(id);

        if (!customization) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Customization not found',
                    code: 'CUSTOMIZATION_NOT_FOUND'
                }
            });
        }

        const filePath = path.join(__dirname, '../../uploads/certificates', customization.certificate_image);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Certificate file not found',
                    code: 'FILE_NOT_FOUND'
                }
            });
        }

        // Set appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename="${customization.certificate_original_name}"`);
        res.setHeader('Content-Type', customization.certificate_mime_type);

        // Send file
        res.sendFile(filePath);

    } catch (error) {
        console.error('Download certificate error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to download certificate',
                code: 'DOWNLOAD_ERROR'
            }
        });
    }
};

module.exports = {
    createCustomization,
    getCustomizationByCartItem,
    getUserCustomizations,
    updateCustomization,
    deleteCustomization,
    downloadCertificate
};