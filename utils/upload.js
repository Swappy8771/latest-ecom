const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const uploadRoot = path.join(__dirname, '..', 'uploads');

// Blocked MIME types that can carry executable content when served in a browser
const BLOCKED_MIME = new Set([
  'image/svg+xml',  // SVG can embed JS → XSS
  'image/xml',
  'text/html',
  'application/xhtml+xml',
]);

function ensureUploadDir() {
  if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, uploadRoot);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').replace(/[^a-zA-Z0-9.]/g, '');
    const unique = crypto.randomBytes(16).toString('hex');
    cb(null, `${unique}${ext}`);
  },
});

function imageFileFilter(req, file, cb) {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image uploads are allowed'));
  }
  if (BLOCKED_MIME.has(file.mimetype)) {
    return cb(new Error(`Uploads of type '${file.mimetype}' are not allowed`));
  }
  cb(null, true);
}

const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { uploadRoot, uploadImage };
