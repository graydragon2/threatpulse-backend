import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { fetchAndFilterFeeds } from './utils/rssParser.js'; // ✅ Update path if needed

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send('🟢 ThreatPulse API is live');
});

app.get('/rss', async (req, res) => {
  const keywords = req.query.keywords ? req.query.keywords.split(',') : [];
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const start = (page - 1) * limit;

  const feedUrls = [
    'https://rss.cnn.com/rss/edition.rss',
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.cisa.gov/news.xml'
  ];

  const allItems = await fetchAndFilterFeeds(feedUrls, keywords);
  const paginated = allItems.slice(start, start + limit);

  res.json({
    success: true,
    items: paginated,
    page,
    limit,
    total: allItems.length
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ThreatPulse API running on port ${PORT}`);
});
