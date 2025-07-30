// server.js

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { parseRSS } from './utils/rssParser.js';
import rssRoutes from './routes/rss.js';
import exportRoutes from './routes/export.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

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
      endDate
    } = req.query;

    const riskLevel = req.query.riskLevel ?? '';

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
