const Product = require('../Model/Product');
const Category = require('../Model/Category');
const Brand = require('../Model/Brand');
const asyncHandler = require('../utils/asyncHandler');

function toProduct(p) {
  return {
    id: p._id,
    title: p.title,
    description: p.description,
    images: p.images,
    tags: p.tags,
    category: p.category,
    brand: p.brand,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    reservedStock: p.reservedStock,
    sku: p.sku,
    lowStockThreshold: p.lowStockThreshold,
    status: p.status,
    seller: p.seller,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filters = { status: 'ACTIVE' };

  // category/brand must be resolved to ObjectId via slug — plain string IDs not accepted
  if (req.query.categorySlug) {
    const c = await Category.findOne({ slug: req.query.categorySlug, isActive: true });
    filters.category = c ? c._id : null; // null produces 0 results intentionally
  }
  if (req.query.brandSlug) {
    const b = await Brand.findOne({ slug: req.query.brandSlug, isActive: true });
    filters.brand = b ? b._id : null;
  }

  const minPrice = parseFloat(req.query.minPrice);
  const maxPrice = parseFloat(req.query.maxPrice);
  if (!isNaN(minPrice) || !isNaN(maxPrice)) {
    filters.price = {};
    if (!isNaN(minPrice)) filters.price.$gte = minPrice;
    if (!isNaN(maxPrice)) filters.price.$lte = maxPrice;
  }

  const q = (req.query.q || '').toString().trim();
  if (q) {
    filters.$text = { $search: q };
  }

  const sort = (req.query.sort || 'newest').toString();
  const sortMap = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { ratingAvg: -1, ratingCount: -1 },
  };
  const sortBy = sortMap[sort] || sortMap.newest;

  const [items, total] = await Promise.all([
    Product.find(filters).populate('category brand').sort(sortBy).skip(skip).limit(limit),
    Product.countDocuments(filters),
  ]);

  return res.status(200).json({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    products: items.map(toProduct),
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, status: 'ACTIVE' }).populate('category brand');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  return res.status(200).json({ product: toProduct(product) });
});

const createProduct = asyncHandler(async (req, res) => {
  // seller must be active and verified seller; admin can also create
  if (req.user.role === 'SELLER') {
    if (!req.user.isVerifiedSeller || req.user.verificationStatus !== 'APPROVED') {
      return res.status(403).json({ message: 'Seller is not verified' });
    }
  }

  const product = await Product.create({
    title: req.body.title,
    description: req.body.description || '',
    images: Array.isArray(req.body.images) ? req.body.images : [],
    tags: Array.isArray(req.body.tags) ? req.body.tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean) : [],
    category: req.body.categoryId || undefined,
    brand: req.body.brandId || undefined,
    price: Number(req.body.price),
    compareAtPrice: req.body.compareAtPrice === undefined ? undefined : Number(req.body.compareAtPrice),
    stock: Number(req.body.stock),
    reservedStock: 0,
    lowStockThreshold: req.body.lowStockThreshold === undefined ? 5 : Number(req.body.lowStockThreshold),
    sku: req.body.sku || '',
    status: req.body.status || 'ACTIVE',
    seller: req.user._id,
  });

  const populated = await Product.findById(product._id).populate('category brand');
  return res.status(201).json({ message: 'Product created', product: toProduct(populated) });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const isOwner = product.seller.toString() === req.user._id.toString();
  if (req.user.role !== 'ADMIN' && !isOwner) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const fields = ['title', 'description', 'images', 'price', 'compareAtPrice', 'stock', 'status', 'sku', 'lowStockThreshold'];
  for (const key of fields) if (req.body[key] !== undefined) product[key] = req.body[key];
  if (req.body.tags !== undefined) {
    product.tags = Array.isArray(req.body.tags)
      ? req.body.tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean)
      : [];
  }
  if (req.body.categoryId !== undefined) product.category = req.body.categoryId || undefined;
  if (req.body.brandId !== undefined) product.brand = req.body.brandId || undefined;
  await product.save();

  const populated = await Product.findById(product._id).populate('category brand');
  return res.status(200).json({ message: 'Product updated', product: toProduct(populated) });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const isOwner = product.seller.toString() === req.user._id.toString();
  if (req.user.role !== 'ADMIN' && !isOwner) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  product.status = 'INACTIVE';
  await product.save();

  return res.status(200).json({ message: 'Product removed' });
});

module.exports = { listProducts, getProductById, createProduct, updateProduct, deleteProduct };
