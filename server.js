import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { parseRSS } from './utils/rssParser.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));

// Health Check
app.get('/', (req, res) => {
  res.send('🟢 ThreatPulse API is live');
});

// RSS Feed Endpoint with optional keywords
app.get('/rss', async (req, res) => {
  const keywords = req.query.keywords ? req.query.keywords.split(',') : [];

  try {
    const items = await parseRSS(keywords.map(k => k.toLowerCase()));
    res.json({
      success: true,
      items,
      page: 1,
      limit: 20,
      total: items.length
    });
  } catch (err) {
    console.error('RSS Fetch Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch RSS feed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ThreatPulse RSS API running on port ${PORT}`);
});
