/**
 * routes/orders.js  — UPDATED
 *
 * Changes from original:
 *   + POST /api/orders       — now accepts email, paymentMethod, calculates packagingFee
 *   + PATCH /api/orders/:id/cancel — user can cancel ONLY if status === 'new' (pending)
 *   + PATCH /api/orders/:id/status — admin only, unchanged
 */

const express  = require('express');
const router   = express.Router();
const Order    = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { protect, adminOnly } = require('../middleware/auth');

// ── Packaging fee helper ─────────────────────────────────────
// ₱20 per ramen item qty, ₱10 per rice_bowl item qty
function calculatePackagingFee(enrichedItems) {
  return enrichedItems.reduce((fee, item) => {
    if (item.category === 'ramen')      return fee + 20 * item.quantity;
    if (item.category === 'rice_bowls') return fee + 10 * item.quantity;
    return fee;
  }, 0);
}

// ── POST /api/orders ─────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      items,
      deliveryAddress,
      guestName,
      guestPhone,
      email,           // ▼ NEW
      paymentMethod,   // ▼ NEW
    } = req.body;

    if (!items?.length) return res.status(400).json({ message: 'Order must have items' });

    const enriched = [];
    for (const line of items) {
      const menuItem = await MenuItem.findById(line.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({ message: `Item "${line.name}" is unavailable` });
      }
      enriched.push({
        menuItem: menuItem._id,
        name:     menuItem.name,
        price:    menuItem.price,
        emoji:    menuItem.emoji,
        category: menuItem.category,   // ▼ NEW: stored for fee calc
        quantity: line.quantity,
        subtotal: menuItem.price * line.quantity,
      });
    }

    const subtotal    = enriched.reduce((s, i) => s + i.subtotal, 0);
    const deliveryFee = 49;
    const packagingFee = calculatePackagingFee(enriched);   // ▼ NEW
    const total        = subtotal + deliveryFee + packagingFee;

    const orderData = {
      items: enriched,
      deliveryAddress,
      subtotal,
      deliveryFee,
      packagingFee,    // ▼ NEW
      total,
      guestName,
      guestPhone,
      email: email || undefined,                        // ▼ NEW
      paymentMethod: paymentMethod || 'cash_on_delivery', // ▼ NEW
    };

    // Attach authenticated user if present
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        orderData.customer = decoded.id;
      } catch { /* guest order */ }
    }

    const order = await Order.create(orderData);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── GET /api/orders (admin) ──────────────────────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip));
    const total = await Order.countDocuments(filter);
    res.json({ total, orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/orders/my (authenticated user) ──────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/orders/:id ──────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = order.customer?._id.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/orders/:id/cancel (authenticated user, pending only) ── ▼ NEW
/**
 * Allows the order owner to cancel ONLY if current status is 'new' (pending).
 * Returns 409 if the order is already being prepared/delivered/done.
 */
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only the owner (or admin) may cancel
    const isOwner = order.customer?.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // ▼ CRITICAL: only cancel if still "new" (pending)
    if (order.status !== 'new') {
      return res.status(409).json({
        message: `Cannot cancel an order that is already "${order.status}". Please contact support.`,
      });
    }

    order.status = 'cancelled';
    await order.save();
    res.json({ message: 'Order cancelled successfully', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/orders/:id/status (admin only) ────────────────
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['new', 'preparing', 'delivering', 'done', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;