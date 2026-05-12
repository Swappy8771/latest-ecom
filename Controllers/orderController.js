const mongoose = require('mongoose');
const Cart = require('../Model/Cart');
const Order = require('../Model/Order');
const Product = require('../Model/Product');
const Address = require('../Model/Address');
const asyncHandler = require('../utils/asyncHandler');

function toOrder(order) {
  return {
    id: order._id,
    user: order.user,
    items: order.items.map((i) => ({
      product: i.product,
      title: i.title,
      price: i.price,
      quantity: i.quantity,
      seller: i.seller,
      lineTotal: i.price * i.quantity,
    })),
    shippingAddress: order.shippingAddress,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    status: order.status,
    cancelledAt: order.cancelledAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

const createOrderFromCart = asyncHandler(async (req, res) => {
  let shippingAddress = req.body.shippingAddress;
  if (!shippingAddress && req.body.addressId) {
    const addr = await Address.findOne({ _id: req.body.addressId, user: req.user._id });
    if (!addr) return res.status(404).json({ message: 'Address not found' });
    shippingAddress = {
      fullName: addr.fullName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
    };
  }
  if (!shippingAddress) return res.status(400).json({ message: 'addressId or shippingAddress is required' });

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

  // Snapshot items before entering transaction
  const itemSnapshots = [];
  for (const cartItem of cart.items) {
    const p = cartItem.product;
    if (!p || p.status !== 'ACTIVE') return res.status(400).json({ message: 'Cart contains unavailable items' });
    if (p.stock < cartItem.quantity) return res.status(400).json({ message: `Insufficient stock for ${p.title}` });
    itemSnapshots.push({
      product: p._id,
      title: p.title,
      price: p.price,
      quantity: cartItem.quantity,
      seller: p.seller,
    });
  }

  const subtotal = itemSnapshots.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingFee = 0;
  const total = subtotal + shippingFee;

  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      // Atomically decrement stock for every item; abort if any product no longer has enough stock
      for (const item of itemSnapshots) {
        const result = await Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session }
        );
        if (result.modifiedCount === 0) {
          throw Object.assign(new Error(`Insufficient stock for product ${item.title}`), { statusCode: 400 });
        }
      }

      const [created] = await Order.create(
        [
          {
            user: req.user._id,
            items: itemSnapshots,
            shippingAddress,
            subtotal,
            shippingFee,
            total,
            status: 'PLACED',
          },
        ],
        { session }
      );
      order = created;

      await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } }, { session });
    });
  } finally {
    session.endSession();
  }

  return res.status(201).json({ message: 'Order placed', order: toOrder(order) });
});

const listMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filters = { user: req.user._id };
  const [items, total] = await Promise.all([
    Order.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filters),
  ]);

  return res.status(200).json({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    orders: items.map(toOrder),
  });
});

const getMyOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  return res.status(200).json({ order: toOrder(order) });
});

const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.status !== 'PLACED') return res.status(400).json({ message: 'Order cannot be cancelled' });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      order.status = 'CANCELLED';
      order.cancelledAt = new Date();
      await order.save({ session });

      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } },
          { session }
        );
      }
    });
  } finally {
    session.endSession();
  }

  return res.status(200).json({ message: 'Order cancelled', order: toOrder(order) });
});

module.exports = { createOrderFromCart, listMyOrders, getMyOrderById, cancelMyOrder };
