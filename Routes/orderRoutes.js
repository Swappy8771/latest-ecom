const express = require('express');
const validate = require('../Middlewares/validate');
const { protect, authorize } = require('../Middlewares/auth');
const {
  createOrderFromCart,
  listMyOrders,
  getMyOrderById,
  cancelMyOrder,
} = require('../Controllers/orderController');
const { orderIdParam, createOrderValidator, listMyOrdersValidator } = require('../validators/orderValidators');

const router = express.Router();
router.use(protect, authorize('USER'));

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: User orders APIs
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order from cart (addressId or shippingAddress snapshot)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               addressId:
 *                 type: string
 *                 description: Use a saved address id to snapshot into order
 *               shippingAddress:
 *                 type: object
 *                 description: Provide full address to snapshot into order
 *                 required: [fullName, phone, line1, city, state, postalCode, country]
 *                 properties:
 *                   fullName: { type: string }
 *                   phone: { type: string }
 *                   line1: { type: string }
 *                   line2: { type: string }
 *                   city: { type: string }
 *                   state: { type: string }
 *                   postalCode: { type: string }
 *                   country: { type: string }
 *     responses:
 *       201:
 *         description: Order placed
 */
router.post('/', createOrderValidator, validate, createOrderFromCart);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: List my orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200:
 *         description: Orders list
 */
router.get('/', listMyOrdersValidator, validate, listMyOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get my order by id
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order
 *       404:
 *         description: Not found
 */
router.get('/:id', orderIdParam, validate, getMyOrderById);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancel my order (only if PLACED)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cancelled
 */
router.post('/:id/cancel', orderIdParam, validate, cancelMyOrder);

module.exports = router;
