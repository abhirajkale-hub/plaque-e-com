const Gallery = require('../models/Gallery');
const path = require('path');
const fs = require('fs');

// @desc    Get all gallery images
// @route   GET /api/gallery
// @access  Public
const getGalleryImages = async (req, res) => {
    try {
        const images = await Gallery.find({ isActive: true })
            .sort({ sortOrder: 1, createdAt: -1 })
            .populate('uploadedBy', 'first_name last_name email')
            .lean();

        const formattedImages = images.map(image => ({
            id: image._id,
            title: image.title,
            description: image.description,
            imageUrl: image.imageUrl,
            customerName: image.customerName,
            customerRole: image.customerRole,
            isLocalUpload: image.isLocalUpload,
            createdAt: image.createdAt
        }));

        res.status(200).json({
            success: true,
            data: formattedImages,
            count: formattedImages.length
        });

    } catch (error) {
        console.error('Error fetching gallery images:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch gallery images',
                code: 'FETCH_ERROR'
            }
        });
    }
};

// @desc    Get all gallery images (Admin view with more details)
// @route   GET /api/admin/gallery
// @access  Private (Admin)
const getAdminGalleryImages = async (req, res) => {
    try {
        const images = await Gallery.find()
            .sort({ sortOrder: 1, createdAt: -1 })
            .populate('uploadedBy', 'first_name last_name email')
            .lean();

        res.status(200).json({
            success: true,
            data: images,
            count: images.length
        });

    } catch (error) {
        console.error('Error fetching admin gallery images:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch gallery images',
                code: 'FETCH_ERROR'
            }
        });
    }
};

// @desc    Upload gallery image
// @route   POST /api/admin/gallery/upload
// @access  Private (Admin)
const uploadGalleryImage = async (req, res) => {
    try {
        const { title, description, customerName, customerRole } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'No image file uploaded',
                    code: 'NO_FILE'
                }
            });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Title is required',
                    code: 'MISSING_TITLE'
                }
            });
        }

        const imageUrl = `/uploads/gallery/${req.file.filename}`;

        const galleryImage = new Gallery({
            title: title.trim(),
            description: description?.trim() || '',
            imageUrl,
            isLocalUpload: true,
            fileName: req.file.filename,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            customerName: customerName?.trim() || 'Valued Customer',
            customerRole: customerRole?.trim() || 'Funded Trader',
            uploadedBy: req.user._id
        });

        await galleryImage.save();

        // Populate the uploadedBy field for response
        await galleryImage.populate('uploadedBy', 'first_name last_name email');

        res.status(201).json({
            success: true,
            data: galleryImage,
            message: 'Gallery image uploaded successfully'
        });

    } catch (error) {
        console.error('Error uploading gallery image:', error);

        // Clean up uploaded file if database save fails
        if (req.file) {
            const filePath = path.join(__dirname, '../../uploads/gallery', req.file.filename);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (cleanupError) {
                    console.error('Error cleaning up file:', cleanupError);
                }
            }
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to upload gallery image',
                code: 'UPLOAD_ERROR'
            }
        });
    }
};

// @desc    Add gallery image from URL
// @route   POST /api/admin/gallery/url
// @access  Private (Admin)
const addGalleryImageFromUrl = async (req, res) => {
    try {
        const { title, description, imageUrl, customerName, customerRole } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Title is required',
                    code: 'MISSING_TITLE'
                }
            });
        }

        if (!imageUrl || !imageUrl.trim()) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Image URL is required',
                    code: 'MISSING_URL'
                }
            });
        }

        const galleryImage = new Gallery({
            title: title.trim(),
            description: description?.trim() || '',
            imageUrl: imageUrl.trim(),
            isLocalUpload: false,
            customerName: customerName?.trim() || 'Valued Customer',
            customerRole: customerRole?.trim() || 'Funded Trader',
            uploadedBy: req.user._id
        });

        await galleryImage.save();

        // Populate the uploadedBy field for response
        await galleryImage.populate('uploadedBy', 'first_name last_name email');

        res.status(201).json({
            success: true,
            data: galleryImage,
            message: 'Gallery image added successfully'
        });

    } catch (error) {
        console.error('Error adding gallery image from URL:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to add gallery image',
                code: 'ADD_ERROR'
            }
        });
    }
};

// @desc    Update gallery image
// @route   PUT /api/admin/gallery/:id
// @access  Private (Admin)
const updateGalleryImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, customerName, customerRole, isActive, sortOrder } = req.body;

        const galleryImage = await Gallery.findById(id);

        if (!galleryImage) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Gallery image not found',
                    code: 'NOT_FOUND'
                }
            });
        }

        // Update fields
        if (title !== undefined) galleryImage.title = title.trim();
        if (description !== undefined) galleryImage.description = description.trim();
        if (customerName !== undefined) galleryImage.customerName = customerName.trim();
        if (customerRole !== undefined) galleryImage.customerRole = customerRole.trim();
        if (isActive !== undefined) galleryImage.isActive = isActive;
        if (sortOrder !== undefined) galleryImage.sortOrder = sortOrder;

        await galleryImage.save();

        // If sort order changed, update other items
        if (sortOrder !== undefined) {
            await Gallery.updateSortOrder(galleryImage._id);
        }

        await galleryImage.populate('uploadedBy', 'first_name last_name email');

        res.status(200).json({
            success: true,
            data: galleryImage,
            message: 'Gallery image updated successfully'
        });

    } catch (error) {
        console.error('Error updating gallery image:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update gallery image',
                code: 'UPDATE_ERROR'
            }
        });
    }
};

// @desc    Delete gallery image
// @route   DELETE /api/admin/gallery/:id
// @access  Private (Admin)
const deleteGalleryImage = async (req, res) => {
    try {
        const { id } = req.params;

        const galleryImage = await Gallery.findById(id);

        if (!galleryImage) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Gallery image not found',
                    code: 'NOT_FOUND'
                }
            });
        }

        // Delete physical file if it's a local upload
        if (galleryImage.isLocalUpload && galleryImage.fileName) {
            const filePath = path.join(__dirname, '../../uploads/gallery', galleryImage.fileName);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (fileError) {
                    console.error('Error deleting physical file:', fileError);
                    // Continue with database deletion even if file deletion fails
                }
            }
        }

        await Gallery.findByIdAndDelete(id);

        // Update sort order for remaining items
        await Gallery.updateSortOrder();

        res.status(200).json({
            success: true,
            message: 'Gallery image deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting gallery image:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete gallery image',
                code: 'DELETE_ERROR'
            }
        });
    }
};

// @desc    Reorder gallery images
// @route   PUT /api/admin/gallery/reorder
// @access  Private (Admin)
const reorderGalleryImages = async (req, res) => {
    try {
        const { imageIds } = req.body;

        if (!Array.isArray(imageIds)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Image IDs must be an array',
                    code: 'INVALID_DATA'
                }
            });
        }

        // Update sort order for each image
        for (let i = 0; i < imageIds.length; i++) {
            await Gallery.findByIdAndUpdate(imageIds[i], { sortOrder: i });
        }

        res.status(200).json({
            success: true,
            message: 'Gallery images reordered successfully'
        });

    } catch (error) {
        console.error('Error reordering gallery images:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to reorder gallery images',
                code: 'REORDER_ERROR'
            }
        });
    }
};

module.exports = {
    getGalleryImages,
    getAdminGalleryImages,
    uploadGalleryImage,
    addGalleryImageFromUrl,
    updateGalleryImage,
    deleteGalleryImage,
    reorderGalleryImages
};