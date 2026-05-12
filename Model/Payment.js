const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
    provider: { type: String, enum: ['MOCK', 'STRIPE', 'RAZORPAY'], default: 'MOCK', index: true },

    status: { type: String, enum: ['CREATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'CREATED', index: true },

    providerPaymentId: { type: String, default: '' },
    providerOrderId: { type: String, default: '' },
    providerSignature: { type: String, default: '' },

    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

paymentSchema.index({ order: 1, user: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

