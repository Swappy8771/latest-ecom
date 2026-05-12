const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fulfillmentStatus: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
  },
  {}
);

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    line1: { type: String, required: true, trim: true, maxlength: 120 },
    line2: { type: String, default: '', trim: true, maxlength: 120 },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    state: { type: String, required: true, trim: true, maxlength: 60 },
    postalCode: { type: String, required: true, trim: true, maxlength: 20 },
    country: { type: String, required: true, trim: true, maxlength: 60 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: addressSchema, required: true },

    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['PLACED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PLACED',
      index: true,
    },
    cancelledAt: { type: Date },

    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'UNPAID',
      index: true,
    },
    paymentProvider: { type: String, enum: ['MOCK', 'STRIPE', 'RAZORPAY'], default: 'MOCK' },
    paymentReference: { type: String, default: '' },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
