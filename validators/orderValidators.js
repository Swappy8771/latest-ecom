const { body, param, query } = require('express-validator');

const orderIdParam = [param('id').isMongoId().withMessage('Invalid order id')];

const addressValidator = [
  body('shippingAddress.fullName').trim().notEmpty().withMessage('fullName is required'),
  body('shippingAddress.phone').trim().notEmpty().withMessage('phone is required'),
  body('shippingAddress.line1').trim().notEmpty().withMessage('line1 is required'),
  body('shippingAddress.line2').optional().isString().withMessage('line2 must be a string'),
  body('shippingAddress.city').trim().notEmpty().withMessage('city is required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('state is required'),
  body('shippingAddress.postalCode').trim().notEmpty().withMessage('postalCode is required'),
  body('shippingAddress.country').trim().notEmpty().withMessage('country is required'),
];

const createOrderValidator = [...addressValidator];

const createOrderV2Validator = [
  body().custom((value) => {
    const hasAddressId = value && value.addressId;
    const hasAddress = value && value.shippingAddress;
    if (!hasAddressId && !hasAddress) {
      throw new Error('addressId or shippingAddress is required');
    }
    return true;
  }),
  body('addressId').optional().isMongoId().withMessage('addressId must be a mongo id'),
  // If shippingAddress is present, validate it
  body('shippingAddress').optional().isObject().withMessage('shippingAddress must be object'),
  ...addressValidator.map((v) => v.optional({ nullable: true })),
];

const listMyOrdersValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
];

module.exports = { orderIdParam, createOrderValidator: createOrderV2Validator, listMyOrdersValidator };
