const express = require('express');
const validate = require('../Middlewares/validate');
const { protect, authorize } = require('../Middlewares/auth');
const { auditLog } = require('../Middlewares/auditLog');
const {
  listUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  listSellers,
  updateSellerVerification,
  updateSellerStatus,
} = require('../Controllers/adminController');
const {
  listUsersValidator,
  idParamValidator,
  updateUserStatusValidator,
  updateUserRoleValidator,
  listSellersValidator,
  updateSellerVerificationValidator,
  updateSellerStatusValidator,
} = require('../validators/adminValidators');

const router = express.Router();

router.use(protect, authorize('ADMIN'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminUser:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         name: { type: string }
 *         email: { type: string }
 *         phone: { type: string }
 *         role: { type: string, example: "USER" }
 *         isVerified: { type: boolean }
 *         status: { type: string, example: "ACTIVE" }
 *         lastLogin: { type: string }
 *         verificationStatus: { type: string, example: "PENDING" }
 *         isVerifiedSeller: { type: boolean }
 *         businessName: { type: string }
 *         gstNumber: { type: string }
 *         createdAt: { type: string }
 *         updatedAt: { type: string }
 *     PagedUsersResponse:
 *       type: object
 *       properties:
 *         page: { type: number }
 *         limit: { type: number }
 *         total: { type: number }
 *         pages: { type: number }
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdminUser'
 *     PagedSellersResponse:
 *       type: object
 *       properties:
 *         page: { type: number }
 *         limit: { type: number }
 *         total: { type: number }
 *         pages: { type: number }
 *         sellers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdminUser'
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List users (filter + search + pagination)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string, example: "swapnil" }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [USER, SELLER, ADMIN] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, PENDING, SUSPENDED] }
 *     responses:
 *       200:
 *         description: Users list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PagedUsersResponse'
 */
router.get('/users', listUsersValidator, validate, listUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user by id
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User
 *       404:
 *         description: Not found
 */
router.get('/users/:id', idParamValidator, validate, getUserById);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Update user status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [ACTIVE, PENDING, SUSPENDED] }
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch(
  '/users/:id/status',
  auditLog({ action: 'ADMIN_UPDATE_USER_STATUS', resourceType: 'User', getResourceId: (req) => req.params.id }),
  updateUserStatusValidator,
  validate,
  updateUserStatus
);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Update user role (promotion to ADMIN disabled)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [USER, SELLER, ADMIN] }
 *     responses:
 *       200:
 *         description: Updated
 *       403:
 *         description: Forbidden
 */
router.patch(
  '/users/:id/role',
  auditLog({ action: 'ADMIN_UPDATE_USER_ROLE', resourceType: 'User', getResourceId: (req) => req.params.id }),
  updateUserRoleValidator,
  validate,
  updateUserRole
);

/**
 * @swagger
 * /api/admin/sellers:
 *   get:
 *     summary: List sellers (optionally filter by verificationStatus)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: verificationStatus
 *         schema: { type: string, enum: [NONE, PENDING, APPROVED, REJECTED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200:
 *         description: Sellers list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PagedSellersResponse'
 */
router.get('/sellers', listSellersValidator, validate, listSellers);

/**
 * @swagger
 * /api/admin/sellers/{id}/verification:
 *   patch:
 *     summary: Approve/reject a seller
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [verificationStatus]
 *             properties:
 *               verificationStatus: { type: string, enum: [PENDING, APPROVED, REJECTED] }
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch(
  '/sellers/:id/verification',
  auditLog({ action: 'ADMIN_UPDATE_SELLER_VERIFICATION', resourceType: 'User', getResourceId: (req) => req.params.id }),
  updateSellerVerificationValidator,
  validate,
  updateSellerVerification
);

/**
 * @swagger
 * /api/admin/sellers/{id}/status:
 *   patch:
 *     summary: Set seller active/inactive (status)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [ACTIVE, SUSPENDED] }
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch(
  '/sellers/:id/status',
  auditLog({ action: 'ADMIN_UPDATE_SELLER_STATUS', resourceType: 'User', getResourceId: (req) => req.params.id }),
  updateSellerStatusValidator,
  validate,
  updateSellerStatus
);

module.exports = router;
