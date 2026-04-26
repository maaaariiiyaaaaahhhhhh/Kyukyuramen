/**
 * routes/auth.js  — UPDATED
 *
 * Changes from original:
 *   + sendWelcomeEmail() helper using Nodemailer
 *   + GET /api/auth/users  — admin-only, list all users (for Customers panel)
 *
 * .env variables required:
 *   MAIL_HOST=smtp.gmail.com
 *   MAIL_PORT=587
 *   MAIL_USER=your@gmail.com
 *   MAIL_PASS=your_app_password
 *   MAIL_FROM="KyuKyu Ramen 99 <noreply@kyukyuramen.ph>"
 */

const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User     = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── Nodemailer transport ─────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.MAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// ── Welcome email helper ─────────────────────────────────────
async function sendWelcomeEmail(user) {
  try {
    await transporter.sendMail({
      from:    process.env.MAIL_FROM || '"KyuKyu Ramen 99" <noreply@kyukyuramen.ph>',
      to:      user.email,
      subject: '🍜 Welcome to KyuKyu Ramen 99!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8"/>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; background:#fff8f5; margin:0; padding:0; }
            .wrapper { max-width:560px; margin:40px auto; background:#fff; border-radius:20px; overflow:hidden;
              box-shadow:0 8px 40px rgba(56,0,0,0.10); }
            .header { background:#380000; padding:36px 40px; text-align:center; }
            .logo-mark { font-size:42px; color:#fff; font-weight:900; letter-spacing:-1px; display:block; }
            .logo-sub  { font-size:12px; color:rgba(255,255,255,0.6); letter-spacing:4px; text-transform:uppercase; }
            .body  { padding:40px; }
            h1 { color:#380000; font-size:24px; font-weight:800; margin:0 0 12px; }
            p  { color:#555; font-size:15px; line-height:1.7; margin:0 0 16px; }
            .accent { color:#ab0000; font-weight:700; }
            .pill { display:inline-block; background:#380000; color:#fff; border-radius:99px;
              padding:14px 32px; font-size:15px; font-weight:700; text-decoration:none; margin-top:8px; }
            .footer { background:#fdf0ec; padding:20px 40px; text-align:center;
              font-size:12px; color:rgba(56,0,0,0.5); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <span class="logo-mark">九九</span>
              <span class="logo-sub">RAMEN 99</span>
            </div>
            <div class="body">
              <h1>Welcome, ${user.name.split(' ')[0]}! 🍜</h1>
              <p>You're now part of the <span class="accent">KyuKyu Ramen 99</span> family.
                 Get ready for bold broths, real ramen, and a promise that every bowl will
                 always cost <span class="accent">₱99</span>.</p>
              <p>Your account is ready. Order anytime from our full menu — from our signature
                 Kyu Kyu to Spicy Ichiban — delivered hot in 30 minutes.</p>
              <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/menu.html" class="pill">
                Order Your First Bowl →
              </a>
            </div>
            <div class="footer">
              © 2025 KyuKyu Ramen 99 · Metro Manila · hello@kyukyuramen.ph
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`✅ Welcome email sent to ${user.email}`);
  } catch (err) {
    // Non-fatal: log but don't fail the registration
    console.error(`⚠️  Welcome email failed for ${user.email}:`, err.message);
  }
}

// ── POST /api/auth/signup ────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const user  = await User.create({ name, email, password, phone, address });
    const token = signToken(user._id);

    // ▼ NEW: fire-and-forget welcome email
    sendWelcomeEmail(user);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      redirect: '/',
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user)  return res.status(401).json({ message: 'Invalid email or password' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      redirect: user.role === 'admin' ? '/admin.html' : '/',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
});

// ── GET /api/auth/users (admin only) ─────────────────────────  ▼ NEW
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).select('-password');
    res.json({ total: users.length, users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;