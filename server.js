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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ status: 'ok' });
});

app.get('/rss', async (req, res) => {
  const keywords = req.query.keywords ? req.query.keywords.split(',') : [];
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const sourceFilter = req.query.source || '';

  try {
    let items = await parseRSS(keywords.map(k => k.toLowerCase()), sourceFilter);

    items = items.map(item => {
      const score = scoreThreat(item);
      return {
        ...item,
        threatScore: score,
        threatLevel:
          score >= 75 ? 'high' :
          score >= 40 ? 'medium' :
          'low'
      };
    });

    const start = (page - 1) * limit;
    const paginatedItems = items.slice(start, start + limit);

    res.json({
      success: true,
      items: paginatedItems,
      total: items.length,
      page,
      limit
    });
  } catch (err) {
    console.error('RSS fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch RSS feed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ThreatPulse API running on port ${PORT}`);
});
