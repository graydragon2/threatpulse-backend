
import express from 'express';
import cors from 'cors';
import { parseRSS } from './rssParser.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/rss', async (req, res) => {
    const keywords = (req.query.keywords || '').split(',').map(k => k.trim().toLowerCase());
    try {
        const filteredItems = await parseRSS(keywords);
        res.json({ success: true, items: filteredItems });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error parsing RSS feed' });
    }
});

app.listen(PORT, () => {
    console.log(`ThreatPulse RSS API running on port ${PORT}`);
});
