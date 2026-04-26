/**
 * routes/menu.js  — UPDATED
 *
 * Changes from original:
 *   + POST   /api/menu        — create item (admin only)
 *   + PATCH  /api/menu/:id    — update item (admin only)
 *   + DELETE /api/menu/:id    — delete item (admin only)
 *   - /seed route kept for dev use
 *
 * Image handling: items store an `imageUrl` string.
 * Upload images separately using the /api/upload route (see middleware/upload.js).
 * The admin panel sends the returned URL in the PATCH/POST body.
 */

const express  = require('express');
const router   = express.Router();
const MenuItem = require('../models/MenuItem');
const { protect, adminOnly } = require('../middleware/auth');

const SEED_ITEMS = [
  { name: 'Spicy Ichiban',   category: 'ramen',      price: 99, emoji: '🌶️', sortOrder: 1, description: 'Bold, fiery broth with thick-cut chashu, soft egg, and a house chili paste.' },
  { name: 'Kyu Kyu',         category: 'ramen',      price: 99, emoji: '🍜', tags: ['Most Ordered'], sortOrder: 2, description: 'Our signature bowl.' },
  { name: 'Tonkotsu',        category: 'ramen',      price: 99, emoji: '🥣', sortOrder: 3, description: '12-hour simmered pork bone broth.' },
  { name: 'Cheesy Tonkotsu', category: 'ramen',      price: 99, emoji: '🧀', sortOrder: 4, description: 'Classic tonkotsu with a molten cheese sauce swirl.' },
  { name: 'Ichiban',         category: 'ramen',      price: 99, emoji: '🏆', tags: ['Most Ordered'], sortOrder: 5, description: 'Umami-forward broth with layered toppings.' },
  { name: 'Tantanmen',       category: 'ramen',      price: 99, emoji: '🌋', sortOrder: 6, description: 'Sesame-rich dandan-style broth.' },
  { name: 'Chashu Don',      category: 'rice_bowls', price: 99, emoji: '🍚', sortOrder: 1, description: 'Rice topped with thick chashu slices.' },
  { name: 'Gyudon',          category: 'rice_bowls', price: 99, emoji: '🥩', sortOrder: 2, description: 'Thinly sliced seasoned beef over fluffy rice.' },
  { name: 'Gyoza',           category: 'side_dish',  price: 79, emoji: '🥟', tags: ['Most Ordered'], sortOrder: 1, description: 'Pan-fried pork and cabbage dumplings.' },
  { name: 'Red Iced Tea',    category: 'drinks',     price: 49, emoji: '🧋', sortOrder: 1, description: 'Chilled house-brewed hibiscus-black tea.' },
];

// ── GET /api/menu (public) ───────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter = { isAvailable: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.all === 'true') delete filter.isAvailable; // admin can see all
    const items = await MenuItem.find(filter).sort({ sortOrder: 1 });
    res.json({ count: items.length, items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/menu/:id (public) ───────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/menu (admin only) ──────────────────────────────  ▼ NEW
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, price, category, emoji, imageUrl, tags, isAvailable, sortOrder } = req.body;
    const item = await MenuItem.create({
      name, description, price, category,
      emoji: emoji || '🍜',
      imageUrl: imageUrl || null,
      tags: tags || [],
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      sortOrder: sortOrder || 99,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PATCH /api/menu/:id (admin only) ────────────────────────  ▼ NEW
router.patch('/:id', protect, adminOnly, async (req, res) => {
  try {
    const allowed = ['name', 'description', 'price', 'category', 'emoji', 'imageUrl', 'tags', 'isAvailable', 'sortOrder'];
    const updates = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

    const item = await MenuItem.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── DELETE /api/menu/:id (admin only) ───────────────────────  ▼ NEW
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/menu/seed (dev only) ──────────────────────────
router.post('/seed', async (req, res) => {
  try {
    await MenuItem.deleteMany({});
    const inserted = await MenuItem.insertMany(SEED_ITEMS);
    res.status(201).json({ message: `Seeded ${inserted.length} items`, items: inserted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const upload = require('../middleware/upload');
const fs     = require('fs');

// Upload image for a menu item
router.patch('/:id/image', upload.single('image'), async (req, res) => {
  try {
    const imageUrl = `/uploads/menu/${req.file.filename}`;
    const item     = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { imageUrl },
      { new: true }
    );
    res.json({ imageUrl: item.imageUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;