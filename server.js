// server.js

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { parseRSS } from './utils/rssParser.js';

const app = express();

// Always use dynamic port assignment first; fallback only if not deployed
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ status: 'ok' });
});

app.get('/rss', async (req, res) => {
  const keywords = req.query.keywords ? req.query.keywords.split(',') : [];
  const sources = req.query.sources ? [].concat(req.query.sources) : [];
  const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
  const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  try {
    let items = await parseRSS(keywords.map(k => k.toLowerCase()), sources, startDate, endDate);

    const start = (page - 1) * limit;
    const end = start + limit;

    res.json({
      success: true,
      items: items.slice(start, end),
      page,
      limit,
      total: items.length
    });
  } catch (err) {
    console.error('RSS Fetch Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch RSS feed' });
  }
});

// Add try/catch to trap bind failures
try {
  app.listen(PORT, () => {
    console.log(`🚀 ThreatPulse API running on port ${PORT}`);
  });
} catch (err) {
  console.error(`❌ Failed to start server on port ${PORT}:`, err);
}
