// server.js

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { parseRSS } from './utils/rssParser.js';
import { scoreThreat } from './utils/threatScorer.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan('dev'));

// ✅ Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ✅ RSS endpoint with keyword filtering, pagination, scoring
app.get('/rss', async (req, res) => {
  const keywords = req.query.keywords ? req.query.keywords.split(',') : [];
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  try {
    let items = await parseRSS(keywords.map(k => k.toLowerCase()));
    items = items.map(item => ({
      ...item,
      threatScore: scoreThreat(item)
    }));

    const total = items.length;
    const start = (page - 1) * limit;
    const paginatedItems = items.slice(start, start + limit);

    res.json({
      success: true,
      items: paginatedItems,
      page,
      limit,
      total
    });
  } catch (err) {
    console.error('RSS Fetch Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch RSS feed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ThreatPulse API running on port ${PORT}`);
});
