/**
 * models/Order.js  — UPDATED
 * Changes from original:
 *   + paymentMethod field  (gcash | maya | cash_on_delivery)
 *   + packagingFee field   (calculated from item categories)
 *   + email field          (for order confirmations)
 *   + status "pending" is now the default alias — "new" kept for compatibility
 */

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    menuItem:  { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name:      { type: String, required: true },
    price:     { type: Number, required: true },
    emoji:     { type: String },
    quantity:  { type: Number, required: true, min: 1 },
    subtotal:  { type: Number, required: true },
    // ▼ NEW: store category snapshot for packaging fee recalculation
    category:  { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    guestName:  { type: String, trim: true },
    guestPhone: { type: String, trim: true },

    // ▼ NEW: email for order confirmation
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    deliveryAddress: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true,
    },

    items: {
      type: [orderItemSchema],
      validate: { validator: arr => arr.length > 0, message: 'Order must have at least one item' },
    },

    subtotal:    { type: Number, required: true },
    deliveryFee: { type: Number, default: 49 },

    // ▼ NEW: packaging fee (₱10 per rice bowl item, ₱20 per ramen item)
    packagingFee: { type: Number, default: 0 },

    total:       { type: Number, required: true },

    // ▼ NEW: payment method
    paymentMethod: {
      type: String,
      enum: ['gcash', 'maya', 'cash_on_delivery', 'credit_card'],
      default: 'cash_on_delivery',
    },

    status: {
      type: String,
      // "new" kept for backward compatibility; treat "new" === "pending" in business logic
      enum: ['new', 'preparing', 'delivering', 'done', 'cancelled'],
      default: 'new',
    },

    notes: { type: String },
  },
  { timestamps: true }
);

orderSchema.virtual('displayId').get(function () {
  const seq = this._id.toString().slice(-4).toUpperCase();
  return `#KYU-${seq}`;
});
orderSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);