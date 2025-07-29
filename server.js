// server.js

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { parseRSS } from './utils/rssParser.js';

const app = express();
const PORT = process.env.PORT || 8080;

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
  const sources = req.query.sources
    ? Array.isArray(req.query.sources)
      ? req.query.sources
      : [req.query.sources]
    : [];
  const risk = req.query.risk || ''; // 'high', 'medium', or 'low'

  try {
    let items = await parseRSS(keywords.map(k => k.toLowerCase()), sources);

    // Apply risk level filtering
    if (risk) {
      items = items.filter(item => item.threatLevel === risk);
    }

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

app.listen(PORT, () => {
  console.log(`🚀 ThreatPulse API running on port ${PORT}`);
});