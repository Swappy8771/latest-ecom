const User = require('../Model/User');
const asyncHandler = require('../utils/asyncHandler');
const crypto = require('crypto');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/tokens');

function toPublicUser(user) {
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
  };
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'USER', phone = '' } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const now = new Date();
  const otp = generateOtp();
  const otpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);

  const user = new User({
    name,
    email,
    phone,
    password,
    role,
    isVerified: false,
    status: role === 'SELLER' ? 'PENDING' : 'ACTIVE',
    verificationStatus: role === 'SELLER' ? 'PENDING' : 'NONE',
  });

  user.setEmailOtp(otp, otpExpiresAt);
  await user.save();

  return res.status(201).json({
    message: 'Registered successfully. Please verify OTP to activate your account.',
    user: toPublicUser(user),
    ...(process.env.NODE_ENV === 'development' ? { devOtp: otp } : {}),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshTokenHash +refreshTokenExpiresAt');
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!user.isVerified) {
    return res.status(403).json({ message: 'Please verify OTP before logging in' });
  }
  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ message: 'Account is not active' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  user.lastLogin = new Date();

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role, email: user.email });
  const refreshToken = signRefreshToken({ sub: user._id.toString(), role: user.role, email: user.email });
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  user.setRefreshToken(refreshToken, refreshExpiresAt);
  await user.save();

  return res.status(200).json({
    message: 'Logged in successfully',
    accessToken,
    refreshToken,
    user: toPublicUser(user),
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
  const user = await User.findOne({ email }).select('+emailOtpHash +emailOtpExpiresAt');
  if (!user) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  if (!user.emailOtpHash || !user.emailOtpExpiresAt || user.emailOtpExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: 'OTP expired' });
  }
  if (user.emailOtpHash !== otpHash) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  user.isVerified = true;
  user.status = user.role === 'SELLER' ? 'PENDING' : 'ACTIVE';
  user.clearEmailOtp();
  await user.save();

  return res.status(200).json({ message: 'OTP verified successfully', user: toPublicUser(user) });
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (e) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const userId = decoded.sub || decoded.id;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findById(userId).select('+refreshTokenHash +refreshTokenExpiresAt');
  if (!user || !user.refreshTokenHash || user.refreshTokenHash !== tokenHash) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
  if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt.getTime() < Date.now()) {
    return res.status(401).json({ message: 'Refresh token expired' });
  }
  if (!user.isVerified || user.status !== 'ACTIVE') {
    return res.status(403).json({ message: 'Account is not active' });
  }

  const newAccessToken = signAccessToken({ sub: user._id.toString(), role: user.role, email: user.email });
  return res.status(200).json({ accessToken: newAccessToken });
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return res.status(200).json({ message: 'Logged out' });

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (e) {
    return res.status(200).json({ message: 'Logged out' });
  }
  const userId = decoded.sub || decoded.id;
  const user = await User.findById(userId).select('+refreshTokenHash +refreshTokenExpiresAt');
  if (user) {
    user.clearRefreshToken();
    await user.save();
  }
  return res.status(200).json({ message: 'Logged out' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select('+passwordResetTokenHash +passwordResetExpiresAt');
  // Always return success to avoid email enumeration
  if (!user) return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  user.setPasswordResetToken(resetToken, resetExpiresAt);
  await user.save();

  // TODO: Integrate email provider (SendGrid/Resend/Nodemailer) to send resetToken link.
  return res.status(200).json({
    message: 'If the email exists, a reset link has been sent',
    ...(process.env.NODE_ENV === 'development' ? { devResetToken: resetToken } : {}),
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({ passwordResetTokenHash: tokenHash }).select(
    '+passwordResetTokenHash +passwordResetExpiresAt +password'
  );
  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  user.password = password;
  user.clearPasswordResetToken();
  user.clearRefreshToken();
  await user.save();

  return res.status(200).json({ message: 'Password reset successfully' });
});

const me = asyncHandler(async (req, res) => {
  return res.status(200).json({ user: toPublicUser(req.user) });
});

module.exports = { register, login, verifyOtp, refreshToken, logout, forgotPassword, resetPassword, me };
