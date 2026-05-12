const User = require('../Model/User');
const asyncHandler = require('../utils/asyncHandler');

function toAdminUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    isVerified: user.isVerified,
    status: user.status,
    lastLogin: user.lastLogin,
    verificationStatus: user.verificationStatus,
    isVerifiedSeller: user.isVerifiedSeller,
    businessName: user.businessName,
    gstNumber: user.gstNumber,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function buildUserSearch(search) {
  if (!search) return null;
  const trimmed = String(search).trim();
  if (!trimmed) return null;
  // Limit length to prevent ReDoS via oversized patterns
  const safe = trimmed.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(safe, 'i');
  return { $or: [{ name: regex }, { email: regex }, { phone: regex }] };
}

const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filters = {};
  const search = buildUserSearch(req.query.search);
  if (search) Object.assign(filters, search);
  if (req.query.role) filters.role = req.query.role;
  if (req.query.status) filters.status = req.query.status;

  const [items, total] = await Promise.all([
    User.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filters),
  ]);

  return res.status(200).json({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    users: items.map(toAdminUser),
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.status(200).json({ user: toAdminUser(user) });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const prevStatus = user.status;
  user.status = req.body.status;
  if (user.status !== 'ACTIVE') {
    user.clearRefreshToken?.();
  }
  await user.save();

  return res.status(200).json({ message: 'Status updated', user: toAdminUser(user) });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Prevent promoting to ADMIN via API by default (seed script recommended)
  if (req.body.role === 'ADMIN' && user.role !== 'ADMIN') {
    const allow = String(process.env.ALLOW_ADMIN_PROMOTION || '').toLowerCase() === 'true';
    if (!allow) return res.status(403).json({ message: 'Promoting to ADMIN is disabled via API' });
  }

  // Prevent an admin from demoting themselves
  if (req.user._id.toString() === user._id.toString() && req.body.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admins cannot change their own role' });
  }

  const prevRole = user.role;
  user.role = req.body.role;
  await user.save();

  return res.status(200).json({ message: 'Role updated', user: toAdminUser(user) });
});

const listSellers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filters = { role: 'SELLER' };
  if (req.query.verificationStatus) filters.verificationStatus = req.query.verificationStatus;

  const [items, total] = await Promise.all([
    User.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filters),
  ]);

  return res.status(200).json({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    sellers: items.map(toAdminUser),
  });
});

const updateSellerVerification = asyncHandler(async (req, res) => {
  const seller = await User.findById(req.params.id);
  if (!seller || seller.role !== 'SELLER') {
    return res.status(404).json({ message: 'Seller not found' });
  }

  const prevStatus = seller.verificationStatus;
  const nextStatus = req.body.verificationStatus;
  seller.verificationStatus = nextStatus;

  if (nextStatus === 'APPROVED') {
    seller.isVerifiedSeller = true;
    seller.status = 'ACTIVE';
  }
  if (nextStatus === 'REJECTED') {
    seller.isVerifiedSeller = false;
    seller.status = seller.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';
  }
  if (nextStatus === 'PENDING') {
    seller.isVerifiedSeller = false;
    seller.status = 'PENDING';
  }

  await seller.save();
  return res.status(200).json({ message: 'Seller verification updated', seller: toAdminUser(seller) });
});

const updateSellerStatus = asyncHandler(async (req, res) => {
  const seller = await User.findById(req.params.id);
  if (!seller || seller.role !== 'SELLER') {
    return res.status(404).json({ message: 'Seller not found' });
  }

  const prevStatus = seller.status;
  seller.status = req.body.status;
  if (seller.status !== 'ACTIVE') {
    seller.clearRefreshToken?.();
  }
  await seller.save();

  return res.status(200).json({ message: 'Seller status updated', seller: toAdminUser(seller) });
});

module.exports = {
  listUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  listSellers,
  updateSellerVerification,
  updateSellerStatus,
};
