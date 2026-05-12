const User = require('../Model/User');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/tokens');

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const userId = decoded.sub || decoded.id;
  if (!userId) return res.status(401).json({ message: 'Invalid token' });

  const user = await User.findById(userId);
  if (!user) return res.status(401).json({ message: 'Not authorized' });
  if (user.status !== 'ACTIVE') return res.status(403).json({ message: 'Account is not active' });

  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

module.exports = { protect, authorize };

