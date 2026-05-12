const { query, param, body } = require('express-validator');

const listUsersValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
  query('search').optional().isString().withMessage('search must be a string'),
  query('role').optional().isIn(['USER', 'SELLER', 'ADMIN']).withMessage('Invalid role'),
  query('status').optional().isIn(['ACTIVE', 'PENDING', 'SUSPENDED']).withMessage('Invalid status'),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid id')];

const updateUserStatusValidator = [
  ...idParamValidator,
  body('status').isIn(['ACTIVE', 'PENDING', 'SUSPENDED']).withMessage('Invalid status'),
];

const updateUserRoleValidator = [
  ...idParamValidator,
  body('role').isIn(['USER', 'SELLER', 'ADMIN']).withMessage('Invalid role'),
];

const listSellersValidator = [
  query('verificationStatus')
    .optional()
    .isIn(['NONE', 'PENDING', 'APPROVED', 'REJECTED'])
    .withMessage('Invalid verificationStatus'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
];

const updateSellerVerificationValidator = [
  ...idParamValidator,
  body('verificationStatus')
    .isIn(['PENDING', 'APPROVED', 'REJECTED'])
    .withMessage('Invalid verificationStatus'),
];

const updateSellerStatusValidator = [
  ...idParamValidator,
  body('status').isIn(['ACTIVE', 'SUSPENDED']).withMessage('status must be ACTIVE or SUSPENDED'),
];

module.exports = {
  listUsersValidator,
  idParamValidator,
  updateUserStatusValidator,
  updateUserRoleValidator,
  listSellersValidator,
  updateSellerVerificationValidator,
  updateSellerStatusValidator,
};
