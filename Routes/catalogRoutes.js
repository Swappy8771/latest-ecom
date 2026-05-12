const express = require('express');
const validate = require('../Middlewares/validate');
const { protect, authorize } = require('../Middlewares/auth');
const {
  listCategories,
  createCategory,
  updateCategory,
  listBrands,
  createBrand,
  updateBrand,
} = require('../Controllers/catalogController');
const {
  idParam,
  createCategoryValidator,
  updateCategoryValidator,
  createBrandValidator,
  updateBrandValidator,
} = require('../validators/catalogValidators');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Catalog
 *   description: Categories and brands
 */

/**
 * @swagger
 * /api/catalog/categories:
 *   get:
 *     summary: List categories (public)
 *     tags: [Catalog]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: all
 *         schema: { type: boolean }
 *         description: If true, include inactive (admin use)
 *     responses:
 *       200:
 *         description: Categories
 */
router.get('/categories', listCategories);

/**
 * @swagger
 * /api/catalog/brands:
 *   get:
 *     summary: List brands (public)
 *     tags: [Catalog]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: all
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Brands
 */
router.get('/brands', listBrands);

// Admin-managed
router.post('/categories', protect, authorize('ADMIN'), createCategoryValidator, validate, createCategory);
router.patch('/categories/:id', protect, authorize('ADMIN'), updateCategoryValidator, validate, updateCategory);
router.post('/brands', protect, authorize('ADMIN'), createBrandValidator, validate, createBrand);
router.patch('/brands/:id', protect, authorize('ADMIN'), updateBrandValidator, validate, updateBrand);

module.exports = router;

