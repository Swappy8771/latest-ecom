const { param, body } = require('express-validator');

const orderIdParam = [param('orderId').isMongoId().withMessage('Invalid orderId')];

const createPaymentValidator = [
  ...orderIdParam,
  body('provider').optional().isIn(['MOCK', 'STRIPE', 'RAZORPAY']).withMessage('Invalid provider'),
  body('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('currency must be 3 letters'),
];

const confirmMockPaymentValidator = [
  ...orderIdParam,
  body('paymentId').optional().isString().withMessage('paymentId must be a string'),
];

module.exports = { orderIdParam, createPaymentValidator, confirmMockPaymentValidator };

