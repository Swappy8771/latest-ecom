const { body, param, query } = require('express-validator');

const productIdParam = [param('id').isMongoId().withMessage('Invalid product id')];

const listProductsValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
  query('q').optional().isString().withMessage('q must be a string'),
  query('category').optional().isString().withMessage('category must be a string'),
  query('brand').optional().isString().withMessage('brand must be a string'),
  query('categorySlug').optional().isString().withMessage('categorySlug must be a string'),
  query('brandSlug').optional().isString().withMessage('brandSlug must be a string'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice must be >= 0'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice must be >= 0'),
  query('sort').optional().isIn(['newest', 'price_asc', 'price_desc', 'rating']).withMessage('Invalid sort'),
];

const createProductValidator = [
  body('title').trim().isLength({ min: 2, max: 120 }).withMessage('title must be 2-120 chars'),
  body('description').optional().isString().withMessage('description must be a string'),
  body('images').optional().isArray().withMessage('images must be an array'),
  body('tags').optional().isArray().withMessage('tags must be an array'),
  body('categoryId').optional().isMongoId().withMessage('categoryId must be a mongo id'),
  body('brandId').optional().isMongoId().withMessage('brandId must be a mongo id'),
  body('price').isFloat({ min: 0 }).withMessage('price must be >= 0'),
  body('compareAtPrice').optional().isFloat({ min: 0 }).withMessage('compareAtPrice must be >= 0'),
  body('stock').isInt({ min: 0 }).withMessage('stock must be >= 0'),
  body('sku').optional().isString().isLength({ max: 64 }).withMessage('sku too long'),
  body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('lowStockThreshold must be >=0'),
  body('status').optional().isIn(['DRAFT', 'ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
];

const updateProductValidator = [
  ...productIdParam,
  body('title').optional().trim().isLength({ min: 2, max: 120 }).withMessage('title must be 2-120 chars'),
  body('description').optional().isString().withMessage('description must be a string'),
  body('images').optional().isArray().withMessage('images must be an array'),
  body('tags').optional().isArray().withMessage('tags must be an array'),
  body('categoryId').optional().isMongoId().withMessage('categoryId must be a mongo id'),
  body('brandId').optional().isMongoId().withMessage('brandId must be a mongo id'),
  body('price').optional().isFloat({ min: 0 }).withMessage('price must be >= 0'),
  body('compareAtPrice').optional().isFloat({ min: 0 }).withMessage('compareAtPrice must be >= 0'),
  body('stock').optional().isInt({ min: 0 }).withMessage('stock must be >= 0'),
  body('sku').optional().isString().isLength({ max: 64 }).withMessage('sku too long'),
  body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('lowStockThreshold must be >=0'),
  body('status').optional().isIn(['DRAFT', 'ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
];

module.exports = {
  productIdParam,
  listProductsValidator,
  createProductValidator,
  updateProductValidator,
};
