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

  res.json({ success: true, items: results });
});

// Log uncaught promise rejections to debug Railway crashes
process.on('unhandledRejection', err => {
  console.error('Unhandled rejection:', err);
});

// Start the server using Railway-assigned port
app.listen(PORT, () => {
  console.log(`✅ ThreatPulse RSS API running on port ${PORT}`);
});
