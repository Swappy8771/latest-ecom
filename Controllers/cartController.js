const Cart = require('../Model/Cart');
const Product = require('../Model/Product');
const asyncHandler = require('../utils/asyncHandler');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await Cart.findOne({ user: userId }).populate('items.product');
  }
  return cart;
}

function toCart(cart) {
  const orphaned = cart.items.filter((i) => !i.product).length;
  const items = cart.items
    .filter((i) => i.product)
    .map((i) => ({
      product: {
        id: i.product._id,
        title: i.product.title,
        price: i.product.price,
        stock: i.product.stock,
        status: i.product.status,
      },
      quantity: i.quantity,
      lineTotal: i.quantity * i.product.price,
    }));
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return {
    id: cart._id,
    items,
    subtotal,
    updatedAt: cart.updatedAt,
    ...(orphaned > 0 ? { notice: `${orphaned} item(s) were removed because the product is no longer available.` } : {}),
  };
}

const getMyCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  return res.status(200).json({ cart: toCart(cart) });
});

const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const product = await Product.findOne({ _id: productId, status: 'ACTIVE' });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((i) => i.product && i.product._id.toString() === productId);
  if (existing) {
    const nextQty = existing.quantity + Number(quantity);
    if (product.stock < nextQty) return res.status(400).json({ message: 'Insufficient stock' });
    existing.quantity = nextQty;
  } else {
    cart.items.push({ product: product._id, quantity: Number(quantity) });
  }
  await cart.save();

  const updated = await Cart.findById(cart._id).populate('items.product');
  return res.status(200).json({ message: 'Cart updated', cart: toCart(updated) });
});

const updateItemQty = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const productId = req.params.productId;

  const product = await Product.findOne({ _id: productId, status: 'ACTIVE' });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => i.product && i.product._id.toString() === productId);
  if (!item) return res.status(404).json({ message: 'Item not found in cart' });
  item.quantity = Number(quantity);
  await cart.save();

  const updated = await Cart.findById(cart._id).populate('items.product');
  return res.status(200).json({ message: 'Cart updated', cart: toCart(updated) });
});

const removeItem = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => i.product && i.product._id.toString() !== productId);
  await cart.save();

  const updated = await Cart.findById(cart._id).populate('items.product');
  return res.status(200).json({ message: 'Item removed', cart: toCart(updated) });
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();

  const updated = await Cart.findById(cart._id).populate('items.product');
  return res.status(200).json({ message: 'Cart cleared', cart: toCart(updated) });
});

module.exports = { getMyCart, addItem, updateItemQty, removeItem, clearCart };

