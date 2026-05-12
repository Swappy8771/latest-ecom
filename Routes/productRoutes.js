const express = require('express');
const validate = require('../Middlewares/validate');
const { protect, authorize } = require('../Middlewares/auth');
const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../Controllers/productController');
const {
  productIdParam,
  listProductsValidator,
  createProductValidator,
  updateProductValidator,
} = require('../validators/productValidators');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product catalog
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         title: { type: string }
 *         description: { type: string }
 *         images: { type: array, items: { type: string } }
 *         category: { type: string }
 *         brand: { type: string }
 *         price: { type: number }
 *         compareAtPrice: { type: number }
 *         stock: { type: number }
 *         status: { type: string, enum: [DRAFT, ACTIVE, INACTIVE] }
 *         seller: { type: string }
 *         createdAt: { type: string }
 *         updatedAt: { type: string }
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List active products (public)
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *       - in: query
 *         name: q
 *         schema: { type: string, example: "shoes" }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: categorySlug
 *         schema: { type: string }
 *       - in: query
 *         name: brand
 *         schema: { type: string }
 *       - in: query
 *         name: brandSlug
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, price_asc, price_desc, rating] }
 *     responses:
 *       200:
 *         description: Product list
 */
router.get('/', listProductsValidator, validate, listProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by id (public, ACTIVE only)
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product
 *       404:
 *         description: Not found
 */
router.get('/:id', productIdParam, validate, getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a product (SELLER/ADMIN)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, price, stock]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               images: { type: array, items: { type: string } }
 *               tags: { type: array, items: { type: string } }
 *               categoryId: { type: string }
 *               brandId: { type: string }
 *               price: { type: number }
 *               compareAtPrice: { type: number }
 *               stock: { type: number }
 *               sku: { type: string }
 *               lowStockThreshold: { type: number }
 *               status: { type: string, enum: [DRAFT, ACTIVE, INACTIVE] }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', protect, authorize('SELLER', 'ADMIN'), createProductValidator, validate, createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Update a product (owner SELLER or ADMIN)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch('/:id', protect, authorize('SELLER', 'ADMIN'), updateProductValidator, validate, updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Remove product (soft-delete sets status INACTIVE)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Removed
 */
router.delete('/:id', protect, authorize('SELLER', 'ADMIN'), productIdParam, validate, deleteProduct);

module.exports = router;
