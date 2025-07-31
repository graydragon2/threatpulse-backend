const express = require('express');
const { parseRSS } = require('../utils/rssParser');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      keywords = '',
      sources = [],
      startDate,
      endDate,
      riskLevel = '',
      tags = ''
    } = req.query;

    const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const sourceList = [].concat(sources);
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const allItems = await parseRSS(keywordList, sourceList, start, end, tagList);
    const filtered = riskLevel
      ? allItems.filter(item => item.threatLevel === riskLevel)
      : allItems;

    res.json({ success: true, items: filtered, total: filtered.length });
  } catch (err) {
    console.error('RSS route error:', err);
    res.status(500).json({ error: 'Failed to fetch threats' });
  }
});

module.exports = router;
