import express from 'express';
import cors from 'cors';
import Parser from 'rss-parser';

const app = express();
const parser = new Parser();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/rss', async (req, res) => {
  const keywords = req.query.keywords ? req.query.keywords.split(',') : [];
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

  if (results.length === 0) {
    return res.status(500).json({ success: false, message: 'No data returned from feeds' });
  }

  res.json({ success: true, items: results.slice(0, 20) });
});

