// server.js

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { parseRSS } = require('./utils/rssParser');
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

// API Routes
app.use('/export', exportRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Main RSS route
app.get('/rss', async (req, res) => {
  try {
    const {
      keywords = '',
      sources = [],
      startDate,
      endDate,
      riskLevel = ''
    } = req.query;

    const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const sourceList = [].concat(sources); // normalize single/multi

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const allItems = await parseRSS(keywordList, sourceList, start, end);

    const items = riskLevel
      ? allItems.filter(item => item.threatLevel === riskLevel)
      : allItems;

    res.json({ success: true, items, total: items.length });
  } catch (error) {
    console.error('RSS fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch RSS feeds' });
  }
});

// Dynamic port for Railway/Vercel
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 ThreatPulse API running on port ${PORT}`);
});
