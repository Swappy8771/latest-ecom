const Category = require('../Model/Category');
const Brand = require('../Model/Brand');
const asyncHandler = require('../utils/asyncHandler');
const { slugify } = require('../utils/slug');

function toCategory(c) {
  return { id: c._id, name: c.name, slug: c.slug, isActive: c.isActive, createdAt: c.createdAt, updatedAt: c.updatedAt };
}
function toBrand(b) {
  return { id: b._id, name: b.name, slug: b.slug, isActive: b.isActive, createdAt: b.createdAt, updatedAt: b.updatedAt };
}

const listCategories = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'ADMIN';
  const showAll = isAdmin && req.query.all === 'true';
  const filters = showAll ? {} : { isActive: true };
  const items = await Category.find(filters).sort({ name: 1 });
  return res.status(200).json({ categories: items.map(toCategory) });
});

const createCategory = asyncHandler(async (req, res) => {
  const slug = slugify(req.body.name);
  const exists = await Category.findOne({ slug });
  if (exists) return res.status(409).json({ message: 'Category already exists' });
  const category = await Category.create({ name: req.body.name, slug });
  return res.status(201).json({ message: 'Category created', category: toCategory(category) });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  if (req.body.name !== undefined) {
    const slug = slugify(req.body.name);
    const clash = await Category.findOne({ slug, _id: { $ne: category._id } });
    if (clash) return res.status(409).json({ message: 'Category slug already exists' });
    category.name = req.body.name;
    category.slug = slug;
  }
  if (req.body.isActive !== undefined) category.isActive = req.body.isActive;
  await category.save();
  return res.status(200).json({ message: 'Category updated', category: toCategory(category) });
});

const listBrands = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'ADMIN';
  const showAll = isAdmin && req.query.all === 'true';
  const filters = showAll ? {} : { isActive: true };
  const items = await Brand.find(filters).sort({ name: 1 });
  return res.status(200).json({ brands: items.map(toBrand) });
});

const createBrand = asyncHandler(async (req, res) => {
  const slug = slugify(req.body.name);
  const exists = await Brand.findOne({ slug });
  if (exists) return res.status(409).json({ message: 'Brand already exists' });
  const brand = await Brand.create({ name: req.body.name, slug });
  return res.status(201).json({ message: 'Brand created', brand: toBrand(brand) });
});

const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) return res.status(404).json({ message: 'Brand not found' });
  if (req.body.name !== undefined) {
    const slug = slugify(req.body.name);
    const clash = await Brand.findOne({ slug, _id: { $ne: brand._id } });
    if (clash) return res.status(409).json({ message: 'Brand slug already exists' });
    brand.name = req.body.name;
    brand.slug = slug;
  }
  if (req.body.isActive !== undefined) brand.isActive = req.body.isActive;
  await brand.save();
  return res.status(200).json({ message: 'Brand updated', brand: toBrand(brand) });
});

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  listBrands,
  createBrand,
  updateBrand,
};

