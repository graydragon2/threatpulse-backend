// routes/feeds.js

const express = require('express');
const Parser = require('rss-parser');
const { scoreThreat, classifyThreat } = require('../utils/threatScorer');

const router = express.Router();
const parser = new Parser();

const feeds = [
  { name: 'CNN', url: 'http://rss.cnn.com/rss/edition.rss' },
  { name: 'BBC', url: 'http://feeds.bbci.co.uk/news/rss.xml' },
  { name: 'Reuters', url: 'http://feeds.reuters.com/reuters/topNews' }
];

router.get('/', async (req, res) => {
  try {
    const keyword = (req.query.keyword || '').toLowerCase();
    const sourceFilter = req.query.source || '';

    let allItems = [];

    for (const feed of feeds) {
      const rss = await parser.parseURL(feed.url);
      const items = rss.items.map((item) => {
        const scoreData = scoreThreat(item);
        return {
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          contentSnippet: item.contentSnippet || '',
          source: feed.name,
          score: scoreData.value,
          threatLevel: scoreData.level,
          category: classifyThreat(item)
        };
      });

      allItems.push(...items);
    }

    // Filter by keyword
    if (keyword) {
      allItems = allItems.filter(item =>
        item.title.toLowerCase().includes(keyword) ||
        item.contentSnippet.toLowerCase().includes(keyword)
      );
    }

    // Filter by source
    if (sourceFilter) {
      allItems = allItems.filter(item => item.source.toLowerCase() === sourceFilter.toLowerCase());
    }

    res.json(allItems);
  } catch (error) {
    console.error('Error fetching/parsing RSS:', error.message);
    res.status(500).json({ error: 'Failed to fetch feeds' });
  }
});

module.exports = router;
