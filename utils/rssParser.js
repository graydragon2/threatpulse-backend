// utils/rssParser.js
import Parser from 'rss-parser';
const parser = new Parser();

const FEEDS = [
  'https://rss.cnn.com/rss/edition.rss',
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://www.cisa.gov/news.xml'
];

export async function fetchAndFilterFeeds({ keywords = [], page = 1, limit = 20 }) {
  const results = [];

  for (const url of FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      feed.items.forEach(item => {
        const match = keywords.some(keyword =>
          (item.title || '').toLowerCase().includes(keyword.toLowerCase()) ||
          (item.contentSnippet || '').toLowerCase().includes(keyword.toLowerCase())
        );
        if (match || keywords.length === 0) {
          results.push(item);
        }
      });
    } catch (err) {
      console.error(`Error parsing ${url}:`, err.message);
    }
  }

  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    items: results.slice(start, end),
    total: results.length
  };
}

