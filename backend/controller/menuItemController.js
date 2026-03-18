
const MenuItem = require('../models/MenuItem');
const { uploadImageBuffer, deleteImage } = require('../services/cloudinary.service');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Helper function to extract public id from cloudinary url
const extractPublicId = (url) => {
  const matches = url.match(/\/upload\/(?:v\d+\/)?([^\.\/]+)(?:\.[a-zA-Z]+)?$/);
  return matches ? matches[1] : null;
};

// Helper function to validate boolean query params
const parseBoolean = (value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

// GET: Lấy tất cả menu item
exports.getAllMenuItems = async (req, res) => {
  try {
    const filter = {};
    
    // Validate category ObjectId if provided
    if (req.query.category) {
      if (!isValidObjectId(req.query.category)) {
        return res.status(400).json({ error: 'Invalid category ID format' });
      }
      filter.category = req.query.category;
    }
    
    // Validate boolean parameters
    if (req.query.needPreOrder !== undefined) {
      const needPreOrder = parseBoolean(req.query.needPreOrder);
      if (needPreOrder === undefined) {
        return res.status(400).json({ error: 'needPreOrder must be true or false' });
      }
      filter.needPreOrder = needPreOrder;
    }
    
    if (req.query.isAvailable !== undefined) {
      const isAvailable = parseBoolean(req.query.isAvailable);
      if (isAvailable === undefined) {
        return res.status(400).json({ error: 'isAvailable must be true or false' });
      }
      filter.isAvailable = isAvailable;
    }

    const items = await MenuItem.find(filter).populate('category');
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET: Lấy menu item theo ID
exports.getMenuItemById = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid menu item ID format' });
    }

    const item = await MenuItem.findById(req.params.id).populate('category');
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST: Tạo menu item mới
exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, isAvailable, needPreOrder, category } = req.body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Validate price
    if (price && (isNaN(price) || price < 0)) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }

    // Validate category if provided
    if (category && !isValidObjectId(category)) {
      return res.status(400).json({ error: 'Invalid category ID format' });
    }

    // Validate boolean fields
    if (isAvailable !== undefined && typeof isAvailable !== 'boolean' && isAvailable !== 'true' && isAvailable !== 'false') {
      return res.status(400).json({ error: 'isAvailable must be boolean' });
    }

    if (needPreOrder !== undefined && typeof needPreOrder !== 'boolean' && needPreOrder !== 'true' && needPreOrder !== 'false') {
      return res.status(400).json({ error: 'needPreOrder must be boolean' });
    }

    // Handle image upload (Cloudinary with local fallback). Proceed without blocking creation.
    let imageUrl = null;
    if (req.file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const isAllowedType = !!req.file.mimetype && allowedTypes.includes(req.file.mimetype);

      // Multer already enforces 5MB; keep a defensive check
      const maxSize = 5 * 1024 * 1024; // 5MB
      const isTooLarge = !!req.file.size && req.file.size > maxSize;

      const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

      if (!isAllowedType) {
        // Ignore unsupported image types instead of blocking item creation
        console.warn('Unsupported image type, skipping upload:', req.file.mimetype);
      } else if (isTooLarge) {
        // Ignore oversize (should be blocked by multer), but do not block creation
        console.warn('Image too large (>5MB), skipping upload');
      } else if (!cloudinaryConfigured) {
        console.warn('Cloudinary not configured, saving image locally');
        // Save locally when Cloudinary is not configured
        try {
          const uploadsDir = path.join(__dirname, '../uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
          }
          const ext = (req.file.mimetype && req.file.mimetype.split('/')[1]) || 'png';
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const filePath = path.join(uploadsDir, fileName);
          fs.writeFileSync(filePath, req.file.buffer);
          const host = req.get('host');
          const baseUrl = `${req.protocol}://${host}`;
          imageUrl = `${baseUrl}/uploads/${fileName}`;
          console.warn('Saved image locally at', imageUrl);
        } catch (localErr) {
          console.error('Failed to save image locally, continuing without image:', localErr);
        }
      } else {
        try {
          const result = await uploadImageBuffer(req.file.buffer);
          imageUrl = result.secure_url;
        } catch (uploadError) {
          // Fallback: save to local uploads
          try {
            const uploadsDir = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir);
            }
            // Generate a simple unique filename
            const ext = (req.file.mimetype && req.file.mimetype.split('/')[1]) || 'png';
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const filePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(filePath, req.file.buffer);
            const host = req.get('host');
            const baseUrl = `${req.protocol}://${host}`;
            imageUrl = `${baseUrl}/uploads/${fileName}`;
            console.warn('Saved image locally at', imageUrl);
          } catch (localErr) {
            console.error('Failed to save image locally, continuing without image:', localErr);
          }
        }
      }
    }

    const newItem = new MenuItem({
      name: name.trim(),
      description: description ? description.trim() : undefined,
      image: imageUrl,
      price: price ? parseFloat(price) : undefined,
      isAvailable: isAvailable === 'true' || isAvailable === true,
      needPreOrder: needPreOrder === 'true' || needPreOrder === true,
      category: category || undefined
    });

    await newItem.save();
    
    // Populate category before returning
    await newItem.populate('category');
    
    res.status(201).json(newItem);
  } catch (err) {
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }
    
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Menu item with this name already exists' });
    }
    
    console.error('Create MenuItem Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT: Cập nhật menu item
exports.updateMenuItem = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid menu item ID format' });
    }

    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const { name, description, price, isAvailable, needPreOrder, category } = req.body;

    // Validate fields if provided
    if (name !== undefined && (!name || name.trim() === '')) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    if (price !== undefined && (isNaN(price) || price < 0)) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }

    if (category && !isValidObjectId(category)) {
      return res.status(400).json({ error: 'Invalid category ID format' });
    }

    // Handle image upload
    let imageUrl = item.image;
    if (req.file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Only JPEG, PNG, and WebP images are allowed' });
      }

      // Validate file size
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: 'Image size must be less than 5MB' });
      }

        try {
          const result = await uploadImageBuffer(req.file.buffer);
          imageUrl = result.secure_url;

          // Delete old image if exists
          if (item.image) {
            const publicId = extractPublicId(item.image);
            if (publicId) {
              try {
                await deleteImage(publicId);
              } catch (deleteError) {
                console.error('Failed to delete old image:', deleteError);
              }
            }
          }
        } catch (uploadError) {
          // Fallback to local save on update as well
          try {
            const uploadsDir = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
            const ext = (req.file.mimetype && req.file.mimetype.split('/')[1]) || 'png';
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const filePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(filePath, req.file.buffer);
            const host = req.get('host');
            const baseUrl = `${req.protocol}://${host}`;
            imageUrl = `${baseUrl}/uploads/${fileName}`;
          } catch (localErr) {
            console.error('Failed local image save on update:', localErr);
          }
        }
    }

    // Prepare update data
    const updateData = { ...req.body };
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : '';
    if (price !== undefined) updateData.price = parseFloat(price);
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable === 'true' || isAvailable === true;
    if (needPreOrder !== undefined) updateData.needPreOrder = needPreOrder === 'true' || needPreOrder === true;
    updateData.image = imageUrl;

    const updated = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category');

    res.json(updated);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }
    
    console.error('Update MenuItem Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE: Xoá menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid menu item ID format' });
    }

    const deleted = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Delete associated image if exists
    if (deleted.image) {
      const publicId = extractPublicId(deleted.image);
      if (publicId) {
        try {
          await deleteImage(publicId);
        } catch (deleteError) {
          console.error('Failed to delete image from Cloudinary:', deleteError);
          // Still return success since the menu item was deleted
        }
      }
    }

    res.json({ message: 'Menu item deleted successfully', deletedItem: deleted });
  } catch (err) {
    console.error('Delete MenuItem Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
