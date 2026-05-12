const crypto = require('crypto');
const Order = require('../Model/Order');
const Payment = require('../Model/Payment');
const asyncHandler = require('../utils/asyncHandler');

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(10).toString('hex')}`;
}

function toPayment(p) {
  return {
    id: p._id,
    order: p.order,
    user: p.user,
    amount: p.amount,
    currency: p.currency,
    provider: p.provider,
    status: p.status,
    providerPaymentId: p.providerPaymentId,
    providerOrderId: p.providerOrderId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

const createPaymentForOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.status === 'CANCELLED') return res.status(400).json({ message: 'Order is cancelled' });
  if (order.paymentStatus === 'PAID') return res.status(400).json({ message: 'Order already paid' });

  const provider = (req.body.provider || order.paymentProvider || 'MOCK').toString().toUpperCase();
  const currency = (req.body.currency || 'INR').toString().toUpperCase();

  // Create a new payment record (one per attempt)
  const payment = await Payment.create({
    order: order._id,
    user: req.user._id,
    amount: order.total,
    currency,
    provider,
    status: 'PENDING',
    providerOrderId: provider === 'MOCK' ? randomId('mock_order') : '',
  });

  order.paymentStatus = 'PENDING';
  order.paymentProvider = provider;
  await order.save();

  // Provider-agnostic response. Integrate Stripe/Razorpay later.
  return res.status(201).json({
    message: 'Payment created',
    payment: toPayment(payment),
    checkout: {
      provider,
      amount: payment.amount,
      currency: payment.currency,
      providerOrderId: payment.providerOrderId,
    },
  });
});

const confirmMockPayment = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.status === 'CANCELLED') return res.status(400).json({ message: 'Order is cancelled' });
  if (order.paymentProvider !== 'MOCK') {
    return res.status(400).json({ message: 'This endpoint is only for MOCK payments' });
  }

  const payment = await Payment.findOne({ order: order._id, user: req.user._id, provider: 'MOCK', status: 'PENDING' })
    .sort({ createdAt: -1 });
  if (!payment) return res.status(404).json({ message: 'No pending payment found' });

  payment.status = 'PAID';
  payment.providerPaymentId = req.body.paymentId || randomId('mock_pay');
  await payment.save();

  order.paymentStatus = 'PAID';
  order.status = 'PAID';
  order.paymentReference = payment.providerPaymentId;
  order.paidAt = new Date();
  await order.save();

  return res.status(200).json({ message: 'Payment confirmed', payment: toPayment(payment), orderId: order._id });
});

const getMyOrderPayment = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const payment = await Payment.findOne({ order: order._id, user: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json({
    order: {
      id: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentProvider: order.paymentProvider,
      paymentReference: order.paymentReference,
      paidAt: order.paidAt,
      total: order.total,
    },
    payment: payment ? toPayment(payment) : null,
  });
});

module.exports = { createPaymentForOrder, confirmMockPayment, getMyOrderPayment };

