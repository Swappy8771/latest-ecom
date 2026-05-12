const { body, param } = require('express-validator');

const idParam = [param('id').isMongoId().withMessage('Invalid id')];

const createCategoryValidator = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('name must be 2-80 chars'),
];
const updateCategoryValidator = [
  ...idParam,
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('name must be 2-80 chars'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

const createBrandValidator = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('name must be 2-80 chars'),
];
const updateBrandValidator = [
  ...idParam,
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('name must be 2-80 chars'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

module.exports = {
  idParam,
  createCategoryValidator,
  updateCategoryValidator,
  createBrandValidator,
  updateBrandValidator,
};

