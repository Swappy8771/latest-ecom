const { body, param } = require('express-validator');

const productIdParam = [param('productId').isMongoId().withMessage('Invalid productId')];

const addItemValidator = [
  body('productId').isMongoId().withMessage('productId is required'),
  body('quantity').isInt({ min: 1, max: 99 }).withMessage('quantity must be 1-99'),
];

const updateItemQtyValidator = [
  ...productIdParam,
  body('quantity').isInt({ min: 1, max: 99 }).withMessage('quantity must be 1-99'),
];

module.exports = { productIdParam, addItemValidator, updateItemQtyValidator };

