import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false, // Do not expose password in queries
  },
  role: {
    type: String,
    enum: ['user', 'seller', 'admin'],
    default: 'user',
  },

  isVerifiedSeller: {
    type: Boolean,
    default: false,
  },
  avatar: {
    type: String, 
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
