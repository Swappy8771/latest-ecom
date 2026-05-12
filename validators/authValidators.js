const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 chars'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 chars')
    .matches(/[A-Z]/)
    .withMessage('Password must include an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must include a number')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must include a special character'),
  body('role').optional().isIn(['USER', 'SELLER']).withMessage('Role must be USER or SELLER'),
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const verifyOtpValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('otp').trim().isLength({ min: 4, max: 8 }).withMessage('OTP is required'),
];

const refreshValidator = [body('refreshToken').notEmpty().withMessage('refreshToken is required')];

const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 chars')
    .matches(/[A-Z]/)
    .withMessage('Password must include an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must include a number')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must include a special character'),
];

module.exports = {
  registerValidator,
  loginValidator,
  verifyOtpValidator,
  refreshValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
