/**
 * middleware/auth.js
 * JWT protect middleware + adminOnly guard.
 * Used by protected routes: orders (admin), menu (admin), auth/users (admin).
 *
 * Place this file at: middleware/auth.js
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — verifies JWT and attaches req.user
 */
async function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or deactivated.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

/**
 * adminOnly — must be used AFTER protect
 */
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}

module.exports = { protect, adminOnly };