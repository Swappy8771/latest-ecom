const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, default: '', index: true },
    resourceId: { type: String, default: '' },
    method: { type: String, default: '' },
    path: { type: String, default: '' },
    statusCode: { type: Number, default: 0, index: true },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    request: { type: Object, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
// Auto-delete audit logs after 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

