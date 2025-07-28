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

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/rss', async (req, res) => {
  const keywords = req.query.keywords ? req.query.keywords.split(',') : [];
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  try {
    let items = await parseRSS(keywords.map(k => k.toLowerCase()));

    items = items.map(item => {
      const threatScore = scoreThreat(item);
      let threatLevel = 'low';
      if (threatScore >= 75) threatLevel = 'high';
      else if (threatScore >= 40) threatLevel = 'medium';

      return { ...item, threatScore, threatLevel };
    });

    const total = items.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const pagedItems = items.slice(start, end);

    res.json({
      success: true,
      items: pagedItems,
      page,
      limit,
      total,
    });
  } catch (err) {
    console.error('RSS error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch RSS' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ThreatPulse API running on port ${PORT}`);
});