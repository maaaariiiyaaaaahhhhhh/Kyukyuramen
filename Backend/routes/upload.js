const express = require('express');
const router  = express.Router();
const upload  = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/menu', protect, adminOnly, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const imageUrl = `http://localhost:5000/uploads/menu/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;