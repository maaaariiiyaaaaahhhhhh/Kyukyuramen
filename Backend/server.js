const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');
const dotenv     = require('dotenv');
const path       = require('path');  // ✅ moved to top
const fs         = require('fs');    // ✅ moved to top

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// Create uploads folder if it doesn't exist
if (!fs.existsSync('uploads/menu')) fs.mkdirSync('uploads/menu', { recursive: true });

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

// ✅ Serve uploaded images BEFORE routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontEnd')));

app.use('/api/auth',   require('./routes/auth'));
app.use('/api/menu',   require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/upload', require('./routes/upload'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

mongoose
  .connect(process.env.MONGO_URI, { dbName: 'kyukyu' })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🍜 Server running on http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌ DB connection failed:', err); process.exit(1); });