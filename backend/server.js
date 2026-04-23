require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const tokenRoutes = require('./routes/tokens');
const { invRouter, auditRouter } = require('./routes/inventoryAudit');

const app = express();
connectDB();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
    ];
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting — anti-abuse (NFR-04)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
const tokenLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { success: false, message: 'Too many token requests' } });
app.use(limiter);

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tokens', tokenLimiter, tokenRoutes);
app.use('/api/inventory', invRouter);
app.use('/api/audit', auditRouter);

app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`));

module.exports = app;
