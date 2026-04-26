/**
 * models/MenuItem.js — UPDATED
 * Change: + imageUrl field for real food photos
 */

const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ['ramen', 'rice_bowls', 'side_dish', 'drinks'],
    },
    emoji: {
      type: String,
      default: '🍜',
    },
    // ▼ NEW: URL to uploaded food photo (e.g. /uploads/menu/item-123.webp)
    imageUrl: {
      type: String,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 99,
    },
  },
  { timestamps: true }
);

menuItemSchema.index({ category: 1, isAvailable: 1, sortOrder: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);