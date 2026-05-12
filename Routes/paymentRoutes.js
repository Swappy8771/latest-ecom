const express = require('express');
const validate = require('../Middlewares/validate');
const { protect, authorize } = require('../Middlewares/auth');
const {
  createPaymentForOrder,
  confirmMockPayment,
  getMyOrderPayment,
} = require('../Controllers/paymentController');
const { createPaymentValidator, confirmMockPaymentValidator, orderIdParam } = require('../validators/paymentValidators');

const router = express.Router();

router.use(protect, authorize('USER'));

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment APIs (MVP uses MOCK provider)
 */

/**
 * @swagger
 * /api/payments/orders/{orderId}:
 *   get:
 *     summary: Get my order payment status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment status
 */
router.get('/orders/:orderId', orderIdParam, validate, getMyOrderPayment);

/**
 * @swagger
 * /api/payments/orders/{orderId}/create:
 *   post:
 *     summary: Create a payment attempt for an order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider: { type: string, enum: [MOCK, STRIPE, RAZORPAY], example: "MOCK" }
 *               currency: { type: string, example: "INR" }
 *     responses:
 *       201:
 *         description: Payment created
 */
router.post('/orders/:orderId/create', createPaymentValidator, validate, createPaymentForOrder);

/**
 * @swagger
 * /api/payments/orders/{orderId}/confirm-mock:
 *   post:
 *     summary: Confirm MOCK payment (dev/testing only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentId: { type: string, example: "mock_pay_123" }
 *     responses:
 *       200:
 *         description: Payment confirmed
 */
router.post('/orders/:orderId/confirm-mock', confirmMockPaymentValidator, validate, confirmMockPayment);

module.exports = router;

