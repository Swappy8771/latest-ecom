const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ['LOCAL', 'CLERK'],
      default: 'LOCAL',
      index: true,
    },
    clerkUserId: {
      type: String,
      default: '',
      index: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
      maxlength: [20, 'Phone number must be at most 20 characters'],
      validate: {
        validator: (v) => !v || /^\+?[\d\s\-().]{7,20}$/.test(v),
        message: 'Phone number format is invalid',
      },
    },
    password: {
      type: String,
      required: function passwordRequired() {
        return this.authProvider === 'LOCAL';
      },
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['USER', 'SELLER', 'ADMIN'],
      default: 'USER',
    },
    avatar: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PENDING', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    isVerifiedSeller: {
      type: Boolean,
      default: false,
    },

    // Seller onboarding fields (optional)
    businessName: { type: String, default: '', trim: true },
    gstNumber: { type: String, default: '', trim: true },
    verificationStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NONE',
    },

    lastLogin: { type: Date },

    // Refresh token storage (hashed)
    refreshTokenHash: { type: String, select: false },
    refreshTokenExpiresAt: { type: Date },

    // Email OTP verification
    emailOtpHash: { type: String, select: false },
    emailOtpExpiresAt: { type: Date },

    // Password reset
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function passwordHash(next) {
  if (!this.isModified('password')) return next();
  if (!this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.setRefreshToken = function setRefreshToken(refreshToken, expiresAt) {
  this.refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  this.refreshTokenExpiresAt = expiresAt;
};

userSchema.methods.clearRefreshToken = function clearRefreshToken() {
  this.refreshTokenHash = undefined;
  this.refreshTokenExpiresAt = undefined;
};

userSchema.methods.setEmailOtp = function setEmailOtp(otp, expiresAt) {
  this.emailOtpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
  this.emailOtpExpiresAt = expiresAt;
};

userSchema.methods.clearEmailOtp = function clearEmailOtp() {
  this.emailOtpHash = undefined;
  this.emailOtpExpiresAt = undefined;
};

userSchema.methods.setPasswordResetToken = function setPasswordResetToken(resetToken, expiresAt) {
  this.passwordResetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpiresAt = expiresAt;
};

userSchema.methods.clearPasswordResetToken = function clearPasswordResetToken() {
  this.passwordResetTokenHash = undefined;
  this.passwordResetExpiresAt = undefined;
};

module.exports = mongoose.model('User', userSchema);
