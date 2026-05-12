const express = require('express');
const validate = require('../Middlewares/validate');
const { protect, authorize } = require('../Middlewares/auth');
const requireVerifiedSeller = require('../Middlewares/seller');
const { auditLog } = require('../Middlewares/auditLog');
const multer = require('multer');
const {
  me,
  updateProfile,
  listMyProducts,
  updateMyProductStatus,
  listMyOrders,
  getMyOrderById,
  updateOrderItemStatus,
  bulkUploadProductsFromExcel,
} = require('../Controllers/sellerController');
const {
  listMyProductsValidator,
  updateMyProductStatusValidator,
  updateSellerProfileValidator,
  listSellerOrdersValidator,
  orderIdParam,
  updateOrderItemStatusValidator,
} = require('../validators/sellerValidators');

const router = express.Router();
const uploadExcel = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(protect, authorize('SELLER'));

/**
 * @swagger
 * tags:
 *   name: Seller
 *   description: Seller APIs (requires SELLER role)
 */

/**
 * @swagger
 * /api/seller/me:
 *   get:
 *     summary: Get current seller profile
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller profile
 */
router.get('/me', me);

/**
 * @swagger
 * /api/seller/profile:
 *   patch:
 *     summary: Update seller profile (business details)
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName: { type: string }
 *               gstNumber: { type: string }
 *               phone: { type: string }
 *               avatar: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch(
  '/profile',
  auditLog({ action: 'SELLER_UPDATE_PROFILE', resourceType: 'User', getResourceId: (req) => req.user?._id }),
  updateSellerProfileValidator,
  validate,
  updateProfile
);

/**
 * @swagger
 * /api/seller/products:
 *   get:
 *     summary: List my products (all statuses)
 *     tags: [Seller]
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
 *         name: status
 *         schema: { type: string, enum: [DRAFT, ACTIVE, INACTIVE] }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Products list
 */
router.get('/products', requireVerifiedSeller, listMyProductsValidator, validate, listMyProducts);

/**
 * @swagger
 * /api/seller/products/{id}/status:
 *   patch:
 *     summary: Update my product status
 *     tags: [Seller]
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
 *               status: { type: string, enum: [DRAFT, ACTIVE, INACTIVE] }
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch(
  '/products/:id/status',
  requireVerifiedSeller,
  auditLog({ action: 'SELLER_UPDATE_PRODUCT_STATUS', resourceType: 'Product', getResourceId: (req) => req.params.id }),
  updateMyProductStatusValidator,
  validate,
  updateMyProductStatus
);

/**
 * @swagger
 * /api/seller/orders:
 *   get:
 *     summary: List orders containing my items
 *     tags: [Seller]
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
 *         name: status
 *         schema: { type: string, enum: [PLACED, PAID, SHIPPED, DELIVERED, CANCELLED] }
 *     responses:
 *       200:
 *         description: Orders list
 */
router.get('/orders', requireVerifiedSeller, listSellerOrdersValidator, validate, listMyOrders);

/**
 * @swagger
 * /api/seller/orders/{id}:
 *   get:
 *     summary: Get a single order (only my items shown)
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order
 *       404:
 *         description: Not found
 */
router.get('/orders/:id', requireVerifiedSeller, orderIdParam, validate, getMyOrderById);

/**
 * @swagger
 * /api/seller/orders/{id}/items/{productId}/status:
 *   patch:
 *     summary: Update fulfillment status for one of my order items (by productId)
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fulfillmentStatus]
 *             properties:
 *               fulfillmentStatus: { type: string, enum: [PENDING, ACCEPTED, PACKED, SHIPPED, DELIVERED, CANCELLED] }
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch(
  '/orders/:id/items/:productId/status',
  requireVerifiedSeller,
  auditLog({
    action: 'SELLER_UPDATE_ORDER_ITEM_STATUS',
    resourceType: 'Order',
    getResourceId: (req) => req.params.id,
  }),
  updateOrderItemStatusValidator,
  validate,
  updateOrderItemStatus
);

/**
 * @swagger
 * /api/seller/products/bulk-upload:
 *   post:
 *     summary: Bulk upload products from Excel (.xlsx). Optional imageUrl/images columns.
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Bulk upload result
 */
router.post(
  '/products/bulk-upload',
  requireVerifiedSeller,
  uploadExcel.single('file'),
  auditLog({ action: 'SELLER_BULK_UPLOAD_PRODUCTS', resourceType: 'Product' }),
  bulkUploadProductsFromExcel
);

module.exports = router;
