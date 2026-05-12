require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../Model/User');

function getEnv(name) {
  const v = process.env[name];
  return typeof v === 'string' ? v.trim() : '';
}

async function main() {
  const mongoUri = getEnv('MONGO_URI');
  const email = getEnv('ADMIN_EMAIL');
  const password = getEnv('ADMIN_PASSWORD');
  const name = getEnv('ADMIN_NAME') || 'Admin';
  const confirm = getEnv('ADMIN_SEED_CONFIRM'); // require YES in production

  if (!mongoUri) throw new Error('Missing MONGO_URI');
  if (!email) throw new Error('Missing ADMIN_EMAIL');
  if (!password) throw new Error('Missing ADMIN_PASSWORD');

  if (process.env.NODE_ENV === 'production' && confirm !== 'YES') {
    throw new Error('Refusing to seed admin in production without ADMIN_SEED_CONFIRM=YES');
  }

  await mongoose.connect(mongoUri);

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${existing.email} (${existing._id})`);
    return;
  }

  const admin = await User.create({
    name,
    email,
    password,
    role: 'ADMIN',
    isVerified: true,
    status: 'ACTIVE',
    verificationStatus: 'NONE',
    isVerifiedSeller: false,
  });

  console.log(`Seeded admin: ${admin.email} (${admin._id})`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });

