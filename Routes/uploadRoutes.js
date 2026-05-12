const express = require('express');
const { protect, authorize } = require('../Middlewares/auth');
const { uploadImage } = require('../utils/upload');

const router = express.Router();

router.use(protect, authorize('SELLER', 'ADMIN'));

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: File uploads (product images)
 */

/**
 * @swagger
 * /api/uploads/product-image:
 *   post:
 *     summary: Upload a product image (SELLER/ADMIN)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Uploaded
 */
router.post('/product-image', uploadImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const urlPath = `/uploads/${req.file.filename}`;
  return res.status(201).json({
    message: 'Uploaded',
    file: { filename: req.file.filename, url: urlPath, mimetype: req.file.mimetype, size: req.file.size },
  });
});

module.exports = router;

