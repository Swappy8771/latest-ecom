module.exports = function requireVerifiedSeller(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (req.user.role !== 'SELLER') return res.status(403).json({ message: 'Forbidden' });
  if (req.user.status !== 'ACTIVE') return res.status(403).json({ message: 'Seller account is not active' });
  if (!req.user.isVerified || req.user.verificationStatus !== 'APPROVED' || !req.user.isVerifiedSeller) {
    return res.status(403).json({ message: 'Seller is not verified' });
  }
  next();
};

