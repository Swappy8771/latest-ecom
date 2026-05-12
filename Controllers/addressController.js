const Address = require('../Model/Address');
const asyncHandler = require('../utils/asyncHandler');

function toAddress(a) {
  return {
    id: a._id,
    label: a.label,
    fullName: a.fullName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    postalCode: a.postalCode,
    country: a.country,
    isDefault: a.isDefault,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

async function unsetDefault(userId) {
  await Address.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } });
}

const listMyAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, updatedAt: -1 });
  return res.status(200).json({ addresses: addresses.map(toAddress) });
});

const MAX_ADDRESSES_PER_USER = 10;

const createAddress = asyncHandler(async (req, res) => {
  const count = await Address.countDocuments({ user: req.user._id });
  if (count >= MAX_ADDRESSES_PER_USER) {
    return res.status(400).json({ message: `Maximum ${MAX_ADDRESSES_PER_USER} addresses allowed per account` });
  }

  if (req.body.isDefault) {
    await unsetDefault(req.user._id);
  }
  const address = await Address.create({ ...req.body, user: req.user._id });

  // Auto-default the very first address
  if (count === 0 && !address.isDefault) {
    address.isDefault = true;
    await address.save();
  }

  return res.status(201).json({ message: 'Address created', address: toAddress(address) });
});

const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) return res.status(404).json({ message: 'Address not found' });

  if (req.body.isDefault === true) {
    await unsetDefault(req.user._id);
  }

  const fields = ['label', 'fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country', 'isDefault'];
  for (const key of fields) {
    if (req.body[key] !== undefined) address[key] = req.body[key];
  }
  await address.save();
  return res.status(200).json({ message: 'Address updated', address: toAddress(address) });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) return res.status(404).json({ message: 'Address not found' });

  // If deleted default, set newest as default
  if (address.isDefault) {
    const replacement = await Address.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
    if (replacement) {
      await unsetDefault(req.user._id);
      replacement.isDefault = true;
      await replacement.save();
    }
  }

  return res.status(200).json({ message: 'Address deleted' });
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) return res.status(404).json({ message: 'Address not found' });
  await unsetDefault(req.user._id);
  address.isDefault = true;
  await address.save();
  return res.status(200).json({ message: 'Default address set', address: toAddress(address) });
});

module.exports = { listMyAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress };

