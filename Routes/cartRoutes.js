const express = require('express');
const validate = require('../Middlewares/validate');
const { protect, authorize } = require('../Middlewares/auth');
const { getMyCart, addItem, updateItemQty, removeItem, clearCart } = require('../Controllers/cartController');
const { addItemValidator, updateItemQtyValidator, productIdParam } = require('../validators/cartValidators');

const router = express.Router();
router.use(protect, authorize('USER'));

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: User cart APIs
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get my cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart
 */
router.get('/', getMyCart);

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: string }
 *               quantity: { type: number, example: 1 }
 *     responses:
 *       200:
 *         description: Updated cart
 */
router.post('/items', addItemValidator, validate, addItem);

/**
 * @swagger
 * /api/cart/items/{productId}:
 *   patch:
 *     summary: Update item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: number, example: 2 }
 *     responses:
 *       200:
 *         description: Updated cart
 */
router.patch('/items/:productId', updateItemQtyValidator, validate, updateItemQty);

/**
 * @swagger
 * /api/cart/items/{productId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated cart
 */
router.delete('/items/:productId', productIdParam, validate, removeItem);

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Clear cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cleared
 */
router.delete('/clear', clearCart);

module.exports = router;

