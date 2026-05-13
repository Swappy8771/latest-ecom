const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');

function toProfile(user) {
  return {
    id:           user._id,
    name:         user.name,
    email:        user.email,
    phone:        user.phone,
    role:         user.role,
    avatar:       user.avatar,
    isVerified:   user.isVerified,
    status:       user.status,
    lastLogin:    user.lastLogin,
    createdAt:    user.createdAt,
    updatedAt:    user.updatedAt,
    // Seller-specific fields — present but null for USER role
    businessName:       user.businessName       || null,
    gstNumber:          user.gstNumber          || null,
    verificationStatus: user.verificationStatus || null,
    isVerifiedSeller:   user.isVerifiedSeller   ?? null,
  };
}

// GET /api/profile
const getProfile = asyncHandler(async (req, res) => {
  return res.status(200).json({ profile: toProfile(req.user) });
});

// PATCH /api/profile
// Allowed fields: name, phone, avatar
const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'avatar'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  }
  await req.user.save();
  return res.status(200).json({ message: 'Profile updated', profile: toProfile(req.user) });
});

// PATCH /api/profile/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // re-fetch with password field since it's select:false
  const User = require('../Model/User');
  const userWithPwd = await User.findById(req.user._id).select('+password');

  const isMatch = await userWithPwd.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ message: 'New password must differ from current password' });
  }

  userWithPwd.password = newPassword; // pre-save hook hashes it
  // Invalidate all refresh tokens so existing sessions are forced to re-login
  userWithPwd.clearRefreshToken();
  await userWithPwd.save();

  return res.status(200).json({ message: 'Password changed successfully. Please sign in again.' });
});

// DELETE /api/profile
// Soft-deletes the account: status → SUSPENDED, tokens cleared.
// Requires password confirmation to prevent accidental/CSRF deletion.
const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  const User = require('../Model/User');
  const userWithPwd = await User.findById(req.user._id).select('+password');

  const isMatch = await userWithPwd.comparePassword(password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Password is incorrect' });
  }

  userWithPwd.status = 'SUSPENDED';
  userWithPwd.clearRefreshToken();
  // Anonymise PII so the record is retained for order history but not identifiable
  const stamp = crypto.randomBytes(4).toString('hex');
  userWithPwd.email    = `deleted_${stamp}@removed.invalid`;
  userWithPwd.name     = 'Deleted User';
  userWithPwd.phone    = '';
  userWithPwd.avatar   = '';
  await userWithPwd.save();

  return res.status(200).json({ message: 'Account deleted successfully' });
});

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };
