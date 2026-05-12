const { body, param, query } = require('express-validator');

const listMyProductsValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
  query('status').optional().isIn(['DRAFT', 'ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
  query('q').optional().isString().withMessage('q must be a string'),
];

const productIdParam = [param('id').isMongoId().withMessage('Invalid product id')];

const updateMyProductStatusValidator = [
  ...productIdParam,
  body('status').isIn(['DRAFT', 'ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
];

const updateSellerProfileValidator = [
  body('businessName').optional().isString().isLength({ max: 120 }).withMessage('businessName too long'),
  body('gstNumber').optional().isString().isLength({ max: 40 }).withMessage('gstNumber too long'),
  body('phone').optional().isString().isLength({ max: 30 }).withMessage('phone too long'),
  body('avatar').optional().isString().withMessage('avatar must be a string'),
];

const listSellerOrdersValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
  query('status').optional().isIn(['PLACED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']).withMessage('Invalid status'),
];

const orderIdParam = [param('id').isMongoId().withMessage('Invalid order id')];

const updateOrderItemStatusValidator = [
  ...orderIdParam,
  param('productId').isMongoId().withMessage('Invalid productId'),
  body('fulfillmentStatus')
    .isIn(['PENDING', 'ACCEPTED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .withMessage('Invalid fulfillmentStatus'),
];

module.exports = {
  listMyProductsValidator,
  updateMyProductStatusValidator,
  updateSellerProfileValidator,
  listSellerOrdersValidator,
  orderIdParam,
  updateOrderItemStatusValidator,
};
