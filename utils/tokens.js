const jwt = require('jsonwebtoken');

function getEnv(name) {
  const value = process.env[name];
  if (typeof value !== 'string') return '';
  return value.trim();
}

function assertSecret(name, value) {
  if (!value || value.length < 32) {
    throw new Error(
      `[startup] ${name} is missing or too short (minimum 32 chars). ` +
        'Generate a strong secret: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
  }
}

// Validate secrets at module load time so the server refuses to start with weak config
const _accessSecret = getEnv('JWT_SECRET');
const _refreshSecret = getEnv('JWT_REFRESH_SECRET') || _accessSecret;

assertSecret('JWT_SECRET', _accessSecret);
assertSecret('JWT_REFRESH_SECRET', _refreshSecret);

// Enforce that access and refresh secrets are different
if (_accessSecret === _refreshSecret) {
  throw new Error(
    '[startup] JWT_SECRET and JWT_REFRESH_SECRET must be different values. ' +
      'Using the same secret for both allows refresh tokens to be used as access tokens.'
  );
}

function signAccessToken(payload) {
  const expiresIn = getEnv('JWT_EXPIRES_IN') || '15m';
  return jwt.sign(payload, _accessSecret, { expiresIn });
}

function signRefreshToken(payload) {
  const expiresIn = getEnv('JWT_REFRESH_EXPIRES_IN') || '30d';
  return jwt.sign(payload, _refreshSecret, { expiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, _accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, _refreshSecret);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
