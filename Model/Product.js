const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 5000 },
    images: [{ type: String, default: '' }],
    tags: [{ type: String, trim: true, lowercase: true }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },

    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    sku: { type: String, default: '', trim: true, maxlength: 64, index: true },

    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['DRAFT', 'ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },

    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
