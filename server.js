// server.js

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { parseRSS } from './utils/rssParser.js';
import { scoreThreat } from './utils/threatScorer.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(morgan('dev'));

// ✅ Health check route
app.get('/health', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ status: 'ok' });
});

// ✅ RSS Feed Endpoint with keyword filtering, pagination, and threat scoring
app.get('/rss', async (req, res) => {
  const keywords = req.query.keywords ? req.query.keywords.split(',') : [];
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  try {
    let items = await parseRSS(keywords.map(k => k.toLowerCase()));

    // ✅ Attach threatScore AND threatLevel to each item
    items = items.map(item => {
      const score = scoreThreat(item);
      return {
        ...item,
        threatScore: score.value,
        threatLevel: score.level,
      };
    });

    const start = (page - 1) * limit;
    const end = start + limit;

    res.json({
      success: true,
      items: items.slice(start, end),
      page,
      limit,
      total: items.length,
    });
  } catch (err) {
    console.error('RSS Fetch Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch RSS feed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ThreatPulse API running on port ${PORT}`);
});