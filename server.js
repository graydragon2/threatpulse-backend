import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { parseRSS } from './utils/rssParser.js';

const app = express();
const PORT = parseInt(process.env.PORT) || 3000;

app.use(cors());
app.use(morgan('dev'));

// ✅ Health Check
app.get('/', (req, res) => {
  res.send('🟢 ThreatPulse API is live');
});

// ✅ RSS Feed Endpoint (now calling utility logic)
app.get('/rss', async (req, res) => {
  const keywords = req.query.keywords ? req.query.keywords.split(',') : [];
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  try {
    const items = await parseRSS(keywords.map(k => k.toLowerCase()));
    const start = (page - 1) * limit;
    const end = start + limit;

    res.json({
      success: true,
      items: items.slice(start, end),
      page,
      limit,
      total: items.length
    });
  } catch (err) {
    console.error('RSS Fetch Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch RSS feed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ThreatPulse API running on port ${PORT}`);
});
