const express = require('express');
const { parseRSS } = require('../utils/rssParser');
const { scoreThreatsWithAI } = require('../utils/threatAgent');
const { filterThreats } = require('../utils/filterThreats');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      keywords = '',
      sources = [],
      startDate,
      endDate,
      riskLevel = '',
      tags = '',
      compareAI = ''
    } = req.query;

    const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const sourceList = [].concat(sources);
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const allItems = await parseRSS(keywordList, sourceList, start, end);
    let filtered = filterThreats(allItems, { riskLevel, tags: tagList });

    // ?compareAI=true annotates each item with an LLM-scored aiScore/aiLevel/
    // aiTags/aiRationale alongside the keyword-based threatScore/threatLevel,
    // so the two scorers can be compared side by side.
    if (compareAI === 'true' && filtered.length) {
      filtered = await scoreThreatsWithAI(filtered);
    }

    res.json({ success: true, items: filtered, total: filtered.length });
  } catch (err) {
    console.error('RSS route error:', err);
    res.status(500).json({ error: 'Failed to fetch threats' });
  }
});

module.exports = router;
