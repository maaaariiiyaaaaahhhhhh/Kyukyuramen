const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');
const dotenv     = require('dotenv');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.use('/api/auth',   require('./routes/auth'));
app.use('/api/menu',   require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const path = require('path');
const fs   = require('fs');

// Create folder if it doesn't exist
if (!fs.existsSync('uploads/menu')) fs.mkdirSync('uploads/menu', { recursive: true });

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose
  .connect(process.env.MONGO_URI, { dbName: 'kyukyu' })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🍜 Server running on http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌ DB connection failed:', err); process.exit(1); });