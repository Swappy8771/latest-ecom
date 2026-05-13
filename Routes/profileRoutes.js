const express = require('express');
const { protect } = require('../Middlewares/auth');
const validate = require('../Middlewares/validate');
const { getProfile, updateProfile, changePassword, deleteAccount } = require('../Controllers/profileController');
const {
  updateProfileValidator,
  changePasswordValidator,
  deleteAccountValidator,
} = require('../validators/profileValidators');

const router = express.Router();

// All profile routes require a valid access token
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Authenticated user's own profile (any role)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       properties:
 *         id:                 { type: string }
 *         name:               { type: string }
 *         email:              { type: string }
 *         phone:              { type: string }
 *         role:               { type: string, example: "USER" }
 *         avatar:             { type: string }
 *         isVerified:         { type: boolean }
 *         status:             { type: string, example: "ACTIVE" }
 *         lastLogin:          { type: string, format: date-time }
 *         createdAt:          { type: string, format: date-time }
 *         updatedAt:          { type: string, format: date-time }
 *         businessName:       { type: string, nullable: true }
 *         gstNumber:          { type: string, nullable: true }
 *         verificationStatus: { type: string, nullable: true }
 *         isVerifiedSeller:   { type: boolean, nullable: true }
 */

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get current user's full profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Not authorized
 */
router.get('/', getProfile);

/**
 * @swagger
 * /api/profile:
 *   patch:
 *     summary: Update profile (name, phone, avatar)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:   { type: string, minLength: 2, maxLength: 50 }
 *               phone:  { type: string, example: "+91XXXXXXXXXX" }
 *               avatar: { type: string, format: uri }
 *     responses:
 *       200:
 *         description: Updated profile
 *       400:
 *         description: Validation error
 */
router.patch('/', updateProfileValidator, validate, updateProfile);

/**
 * @swagger
 * /api/profile/change-password:
 *   patch:
 *     summary: Change password (requires current password)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: "Min 8 chars, uppercase, number, special char"
 *     responses:
 *       200:
 *         description: Password changed — all sessions invalidated
 *       400:
 *         description: Incorrect current password or same password used
 */
router.patch('/change-password', changePasswordValidator, validate, changePassword);

/**
 * @swagger
 * /api/profile:
 *   delete:
 *     summary: Delete (deactivate) account — requires password confirmation
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Account deleted and PII anonymised
 *       400:
 *         description: Incorrect password
 */
router.delete('/', deleteAccountValidator, validate, deleteAccount);

module.exports = router;
