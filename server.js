import express from 'express';
import cors from 'cors';
import Parser from 'rss-parser';

const app = express();
const parser = new Parser();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/rss', async (req, res) => {
  try {
    const keywords = req.query.keywords ? req.query.keywords.split(',') : [];
    const feedUrls = [
      'https://rss.cnn.com/rss/edition.rss',
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://www.cisa.gov/news.xml'
    ];

    const results = [];

    for (const url of feedUrls) {
      const feed = await parser.parseURL(url);
      feed.items.forEach(item => {
        const match = keywords.some(keyword =>
          item.title?.toLowerCase().includes(keyword.toLowerCase()) ||
          item.content?.toLowerCase().includes(keyword.toLowerCase())
        );
        if (match) results.push(item);
      });
    }

    res.json({ success: true, items: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error parsing RSS feed' });
  }
});

app.listen(PORT, () => {
  console.log(`ThreatPulse RSS API running on port ${PORT}`);
});

