const express = require('express');
const {
  register,
  login,
  verifyOtp,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  me,
} = require('../Controllers/authController');
const {
  registerValidator,
  loginValidator,
  verifyOtpValidator,
  refreshValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/authValidators');
const validate = require('../Middlewares/validate');
const { protect } = require('../Middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required: [name, email, password]
 *       properties:
 *         name: { type: string, example: "Swapnil" }
 *         email: { type: string, example: "swapnil@example.com" }
 *         password: { type: string, example: "Password@123" }
 *         phone: { type: string, example: "+91XXXXXXXXXX" }
 *         role: { type: string, example: "USER", description: "USER or SELLER" }
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email: { type: string, example: "swapnil@example.com" }
 *         password: { type: string, example: "Password@123" }
 *     VerifyOtpRequest:
 *       type: object
 *       required: [email, otp]
 *       properties:
 *         email: { type: string, example: "swapnil@example.com" }
 *         otp: { type: string, example: "123456" }
 *     RefreshRequest:
 *       type: object
 *       required: [refreshToken]
 *       properties:
 *         refreshToken: { type: string }
 *     ForgotPasswordRequest:
 *       type: object
 *       required: [email]
 *       properties:
 *         email: { type: string, example: "swapnil@example.com" }
 *     ResetPasswordRequest:
 *       type: object
 *       required: [token, password]
 *       properties:
 *         token: { type: string }
 *         password: { type: string, example: "NewPass@123" }
 *     LoginResponse:
 *       type: object
 *       properties:
 *         message: { type: string }
 *         accessToken: { type: string }
 *         refreshToken: { type: string }
 *         user:
 *           type: object
 *           properties:
 *             id: { type: string }
 *             name: { type: string }
 *             email: { type: string }
 *             role: { type: string, example: "USER" }
 *     MeResponse:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             id: { type: string }
 *             name: { type: string }
 *             email: { type: string }
 *             role: { type: string }
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       409:
 *         description: Email already in use
 */
router.post('/register', registerValidator, validate, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginValidator, validate, login);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify email OTP
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpRequest'
 *     responses:
 *       200:
 *         description: Verified
 */
router.post('/verify-otp', verifyOtpValidator, validate, verifyOtp);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Get a new access token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: New access token
 */
router.post('/refresh-token', refreshValidator, validate, refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout (invalidate refresh token)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', refreshValidator, validate, logout);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Reset token generated (email sending is TODO)
 */
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using reset token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset
 */
router.post('/reset-password', resetPasswordValidator, validate, resetPassword);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeResponse'
 *       401:
 *         description: Not authorized
 */
router.get('/me', protect, me);

module.exports = router;
