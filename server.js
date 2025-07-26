import express from 'express';
import cors from 'cors';
import Parser from 'rss-parser';
import morgan from 'morgan'; // ✅ Optional logging
import { fetchAndFilterFeeds } from './rssService.js';

const app = express();
const parser = new Parser();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev')); // ✅ Logs requests to console

// ✅ Part 3: Health Check Route
app.get('/', (req, res) => {
  res.send('🟢 ThreatPulse API is live');
});

app.get('/api/rss', async (req, res) => {
  const keywords = req.query.keywords ? req.query.keywords.split(',') : [];
  const page = parseInt(req.query.page) || 1;           // ✅ Part 2: Pagination
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;
  const end = start + limit;

  const feedUrls = [
    'https://rss.cnn.com/rss/edition.rss',
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.cisa.gov/news.xml'
  ];

  const results = [];

  for (const url of feedUrls) {
    try {
      const feed = await parser.parseURL(url);
      feed.items.forEach(item => {
        const match = keywords.some(keyword =>
          (item.title || '').toLowerCase().includes(keyword.toLowerCase()) ||
          (item.contentSnippet || '').toLowerCase().includes(keyword.toLowerCase())
        );
        if (match || keywords.length === 0) results.push(item);
      });
    } catch (err) {
      console.error(`Failed to parse ${url}:`, err.message);
    }
  }

  // ✅ Return only the sliced/paged portion
  const paginated = results.slice(start, end);

  res.json({
    success: true,
    items: paginated,
    page,
    limit,
    total: results.length
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ThreatPulse RSS API running on port ${PORT}`);
});
