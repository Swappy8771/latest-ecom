const { body, param } = require('express-validator');

const idParam = [param('id').isMongoId().withMessage('Invalid address id')];

const addressBody = [
  body('label').optional().isString().isLength({ max: 40 }).withMessage('label must be at most 40 chars'),
  body('fullName').trim().notEmpty().withMessage('fullName is required').isLength({ max: 80 }).withMessage('fullName too long'),
  body('phone').trim().notEmpty().withMessage('phone is required').isLength({ max: 30 }).withMessage('phone too long'),
  body('line1').trim().notEmpty().withMessage('line1 is required').isLength({ max: 120 }).withMessage('line1 too long'),
  body('line2').optional().isString().isLength({ max: 120 }).withMessage('line2 too long'),
  body('city').trim().notEmpty().withMessage('city is required').isLength({ max: 60 }).withMessage('city too long'),
  body('state').trim().notEmpty().withMessage('state is required').isLength({ max: 60 }).withMessage('state too long'),
  body('postalCode').trim().notEmpty().withMessage('postalCode is required').isLength({ max: 20 }).withMessage('postalCode too long'),
  body('country').trim().notEmpty().withMessage('country is required').isLength({ max: 60 }).withMessage('country too long'),
];

const createAddressValidator = [
  ...addressBody,
  body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean'),
];

const updateAddressValidator = [
  ...idParam,
  body('label').optional().isString().isLength({ max: 40 }).withMessage('label too long'),
  body('fullName').optional().isString().isLength({ max: 80 }).withMessage('fullName too long'),
  body('phone').optional().isString().isLength({ max: 30 }).withMessage('phone too long'),
  body('line1').optional().isString().isLength({ max: 120 }).withMessage('line1 too long'),
  body('line2').optional().isString().isLength({ max: 120 }).withMessage('line2 too long'),
  body('city').optional().isString().isLength({ max: 60 }).withMessage('city too long'),
  body('state').optional().isString().isLength({ max: 60 }).withMessage('state too long'),
  body('postalCode').optional().isString().isLength({ max: 20 }).withMessage('postalCode too long'),
  body('country').optional().isString().isLength({ max: 60 }).withMessage('country too long'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean'),
];

const setDefaultValidator = [...idParam];

module.exports = { idParam, createAddressValidator, updateAddressValidator, setDefaultValidator };
