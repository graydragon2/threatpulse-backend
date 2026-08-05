// server.js

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const rssRoutes = require('./routes/rss');
const exportRoutes = require('./routes/export');
const historyRoutes = require('./routes/history');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/history', historyRoutes);

// Serve previously generated exports so saved reports can be re-downloaded
app.use('/downloads', express.static(path.join(__dirname, 'data/exports')));

// API Routes
app.use('/export', exportRoutes);
app.use('/rss', rssRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Dynamic port for Railway/Vercel
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 ThreatPulse API running on port ${PORT}`);
});
