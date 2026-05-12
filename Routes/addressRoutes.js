const express = require('express');
const validate = require('../Middlewares/validate');
const { protect, authorize } = require('../Middlewares/auth');
const {
  listMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../Controllers/addressController');
const { createAddressValidator, updateAddressValidator, idParam, setDefaultValidator } = require('../validators/addressValidators');

const router = express.Router();
router.use(protect, authorize('USER', 'SELLER', 'ADMIN'));

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: User shipping addresses
 */

/**
 * @swagger
 * /api/addresses:
 *   get:
 *     summary: List my addresses
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses
 */
router.get('/', listMyAddresses);

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Create an address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, phone, line1, city, state, postalCode, country]
 *             properties:
 *               label: { type: string }
 *               fullName: { type: string }
 *               phone: { type: string }
 *               line1: { type: string }
 *               line2: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               postalCode: { type: string }
 *               country: { type: string }
 *               isDefault: { type: boolean }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', createAddressValidator, validate, createAddress);

/**
 * @swagger
 * /api/addresses/{id}:
 *   patch:
 *     summary: Update an address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch('/:id', updateAddressValidator, validate, updateAddress);

/**
 * @swagger
 * /api/addresses/{id}:
 *   delete:
 *     summary: Delete an address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/:id', idParam, validate, deleteAddress);

/**
 * @swagger
 * /api/addresses/{id}/default:
 *   patch:
 *     summary: Set default address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Default set
 */
router.patch('/:id/default', setDefaultValidator, validate, setDefaultAddress);

module.exports = router;

