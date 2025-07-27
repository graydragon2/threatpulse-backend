import Parser from 'rss-parser';

const parser = new Parser();
const FEEDS = [
  'https://www.cisa.gov/news.xml',
  'https://feeds.bbci.co.uk/news/world/rss.xml'
];

// In-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function parseRSS(keywords = []) {
  const key = keywords.sort().join(',') || 'all';
  const now = Date.now();

  if (cache.has(key)) {
    const { timestamp, data } = cache.get(key);
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }
  }

  let allItems = [];

  for (const url of FEEDS) {
    const feed = await parser.parseURL(url);
    allItems.push(...feed.items);
  }

  if (keywords.length > 0) {
    allItems = allItems.filter(item =>
      keywords.some(kw =>
        (item.title || '').toLowerCase().includes(kw) ||
        (item.contentSnippet || '').toLowerCase().includes(kw)
      )
    );
  }

  cache.set(key, { timestamp: now, data: allItems });
  return allItems;
}

