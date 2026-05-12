const AuditLog = require('../Model/AuditLog');

const MAX_BODY_KEYS = 30;
const MAX_STRING_VALUE_LEN = 500;

function redact(obj, depth = 0) {
  if (!obj || typeof obj !== 'object') {
    // Truncate long string values to avoid bloating the DB record
    if (typeof obj === 'string' && obj.length > MAX_STRING_VALUE_LEN) return obj.slice(0, MAX_STRING_VALUE_LEN) + '…';
    return obj;
  }
  const forbiddenKeys = new Set([
    'password', 'token', 'accessToken', 'refreshToken',
    'devOtp', 'devResetToken', 'otp', 'signature',
  ]);

  if (Array.isArray(obj)) return obj.slice(0, 20).map((v) => redact(v, depth + 1));
  if (depth > 4) return '[truncated]';

  const entries = Object.entries(obj).slice(0, MAX_BODY_KEYS);
  const out = {};
  for (const [k, v] of entries) {
    if (forbiddenKeys.has(k)) out[k] = '[REDACTED]';
    else out[k] = redact(v, depth + 1);
  }
  return out;
}

function auditLog({ action, resourceType = '', getResourceId } = {}) {
  return function auditMiddleware(req, res, next) {
    res.on('finish', async () => {
      try {
        if (!req.user) return;
        // Skip logging GETs unless explicitly used (keep logs smaller)
        if (req.method === 'GET') return;

        const resourceId = typeof getResourceId === 'function' ? String(getResourceId(req) || '') : '';

        await AuditLog.create({
          actor: req.user._id,
          actorRole: req.user.role,
          action: action || `${req.method} ${req.baseUrl}${req.path}`,
          resourceType,
          resourceId,
          method: req.method,
          path: `${req.baseUrl}${req.path}`,
          statusCode: res.statusCode,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
          request: {
            params: redact(req.params),
            query: redact(req.query),
            body: redact(req.body),
          },
        });
      } catch (e) {
        // Never block request lifecycle because of audit logging issues
        // eslint-disable-next-line no-console
        console.error('AUDIT_LOG_ERROR', e.message || e);
      }
    });
    next();
  };
}

module.exports = { auditLog };

