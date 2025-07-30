// routes/rss.js

import express from 'express';
import { parseRSS } from '../utils/rssParser.js';

const router = express.Router();

router.get('/feeds', async (req, res) => {
  try {
    const {
      keywords = '',
      sources = [],
      riskLevel = '',
      startDate,
      endDate,
      tags = [],
    } = req.query;

    const keywordArr = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const sourceArr = [].concat(sources).filter(Boolean);
    const tagArr = [].concat(tags).filter(Boolean);

    const items = await parseRSS(
      keywordArr,
      sourceArr,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null,
      tagArr
    );

    const filtered = riskLevel
      ? items.filter(item => item.threatLevel === riskLevel)
      : items;

    res.json({ items: filtered });
  } catch (err) {
    console.error('Error in /feeds route:', err);
    res.status(500).json({ error: 'Failed to fetch feed data' });
  }
});

export default router;
