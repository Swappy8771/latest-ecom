const Product = require('../Model/Product');
const Order = require('../Model/Order');
const asyncHandler = require('../utils/asyncHandler');
const xlsx = require('xlsx');
const { asString, asNumber, splitImageUrls } = require('../utils/excel');

function toSellerProfile(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    isVerified: user.isVerified,
    status: user.status,
    businessName: user.businessName,
    gstNumber: user.gstNumber,
    verificationStatus: user.verificationStatus,
    isVerifiedSeller: user.isVerifiedSeller,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toSellerProduct(p) {
  return {
    id: p._id,
    title: p.title,
    description: p.description,
    images: p.images,
    category: p.category,
    brand: p.brand,
    tags: p.tags,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    reservedStock: p.reservedStock,
    sku: p.sku,
    lowStockThreshold: p.lowStockThreshold,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function toSellerOrder(order, sellerId) {
  const sid = sellerId.toString();
  const items = order.items
    .filter((i) => i.seller && i.seller.toString() === sid)
    .map((i) => ({
      product: i.product,
      title: i.title,
      price: i.price,
      quantity: i.quantity,
      fulfillmentStatus: i.fulfillmentStatus,
      lineTotal: i.price * i.quantity,
    }));

  return {
    id: order._id,
    user: order.user,
    items,
    subtotal: items.reduce((sum, it) => sum + it.lineTotal, 0),
    status: order.status,
    shippingAddress: order.shippingAddress,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

const me = asyncHandler(async (req, res) => {
  return res.status(200).json({ seller: toSellerProfile(req.user) });
});

const updateProfile = asyncHandler(async (req, res) => {
  // Changes to identity-critical fields require admin re-approval
  const sensitiveFields = ['businessName', 'gstNumber'];
  const allFields = ['businessName', 'gstNumber', 'phone', 'avatar'];

  const changedSensitive = sensitiveFields.some(
    (key) => req.body[key] !== undefined && req.body[key] !== req.user[key]
  );

  for (const key of allFields) {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  }

  if (changedSensitive && req.user.verificationStatus === 'APPROVED') {
    req.user.verificationStatus = 'PENDING';
    req.user.isVerifiedSeller = false;
  }

  await req.user.save();
  return res.status(200).json({ message: 'Profile updated', seller: toSellerProfile(req.user) });
});

const listMyProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filters = { seller: req.user._id };
  if (req.query.status) filters.status = req.query.status;
  const q = (req.query.q || '').toString().trim();
  if (q) filters.$text = { $search: q };

  const [items, total] = await Promise.all([
    Product.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filters),
  ]);

  return res.status(200).json({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    products: items.map(toSellerProduct),
  });
});

const updateMyProductStatus = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  product.status = req.body.status;
  await product.save();
  return res.status(200).json({ message: 'Product status updated', product: toSellerProduct(product) });
});

const listMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filters = { 'items.seller': req.user._id };
  if (req.query.status) filters.status = req.query.status;

  const [items, total] = await Promise.all([
    Order.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filters),
  ]);

  return res.status(200).json({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    orders: items.map((o) => toSellerOrder(o, req.user._id)),
  });
});

const getMyOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, 'items.seller': req.user._id });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  return res.status(200).json({ order: toSellerOrder(order, req.user._id) });
});

const updateOrderItemStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, 'items.seller': req.user._id });
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const productId = req.params.productId;
  const item = order.items.find(
    (i) => i.seller && i.seller.toString() === req.user._id.toString() && i.product.toString() === productId
  );
  if (!item) return res.status(404).json({ message: 'Order item not found' });

  // Basic guardrails
  if (order.status === 'CANCELLED') return res.status(400).json({ message: 'Order is cancelled' });
  item.fulfillmentStatus = req.body.fulfillmentStatus;
  await order.save();

  return res.status(200).json({ message: 'Item status updated', order: toSellerOrder(order, req.user._id) });
});

async function bulkUploadProductsFromExcelImpl(fileBuffer, sellerId) {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { rows: [], errors: [{ row: 0, message: 'Excel file has no sheets' }] };
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  const errors = [];
  const docs = [];

  rows.forEach((r, idx) => {
    const rowNum = idx + 2; // assuming row 1 is header
    const title = asString(r.title || r.name);
    const price = asNumber(r.price, null);
    const stock = asNumber(r.stock, null);
    const status = asString(r.status || 'ACTIVE').toUpperCase();

    const imageUrl = asString(r.imageUrl || r.image || r.imageURL);
    const images = r.images ? splitImageUrls(r.images) : imageUrl ? [imageUrl] : [];

    if (!title) errors.push({ row: rowNum, message: 'Missing title' });
    if (price === null) errors.push({ row: rowNum, message: 'Missing/invalid price' });
    if (stock === null) errors.push({ row: rowNum, message: 'Missing/invalid stock' });
    if (!['DRAFT', 'ACTIVE', 'INACTIVE'].includes(status)) errors.push({ row: rowNum, message: 'Invalid status' });

    if (!title || price === null || stock === null || !['DRAFT', 'ACTIVE', 'INACTIVE'].includes(status)) return;

    docs.push({
      title,
      description: asString(r.description),
      images,
      // For bulk upload we accept plain strings into tags only.
      // Categories/brands should be set later via IDs after admin creates them.
      tags: splitImageUrls(r.tags || '').map((t) => String(t).toLowerCase()),
      price,
      compareAtPrice: asNumber(r.compareAtPrice, undefined),
      stock,
      status,
      seller: sellerId,
      sku: asString(r.sku),
      lowStockThreshold: asNumber(r.lowStockThreshold, 5),
    });
  });

  return { docs, errors, totalRows: rows.length };
}

const bulkUploadProductsFromExcel = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) return res.status(400).json({ message: 'Excel file is required' });

  const { docs, errors, totalRows } = await bulkUploadProductsFromExcelImpl(req.file.buffer, req.user._id);

  // Insert valid rows; keep errors for invalid rows
  const inserted = docs.length > 0 ? await Product.insertMany(docs, { ordered: false }) : [];

  return res.status(201).json({
    message: 'Bulk upload processed',
    totalRows,
    insertedCount: inserted.length,
    skippedCount: totalRows - inserted.length,
    errors,
    note: 'If images/imageUrl are empty in Excel, the product will have no images; upload later via /api/uploads/product-image and update the product.',
  });
});

module.exports = {
  me,
  updateProfile,
  listMyProducts,
  updateMyProductStatus,
  bulkUploadProductsFromExcel,
  listMyOrders,
  getMyOrderById,
  updateOrderItemStatus,
};
