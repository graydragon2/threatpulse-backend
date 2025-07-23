import Parser from 'rss-parser';
import NodeCache from 'node-cache';

const parser = new Parser();
const cache = new NodeCache({ stdTTL: 300 }); // cache expires in 5 minutes

const FEED_URLS = [
  'https://rss.cnn.com/rss/edition.rss',
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://www.cisa.gov/news.xml'
];

/**
 * Fetches, filters, and paginates RSS feed results with caching.
 *
 * @param {string[]} keywords - Array of keyword strings
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of items per page
 * @returns {Object} - Paginated response with items and metadata
 */
export async function fetchAndFilterFeeds(keywords = [], page = 1, limit = 20) {
  const cacheKey = `rss:${keywords.join(',') || 'all'}:page${page}:limit${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  let allItems = [];

  for (const url of FEED_URLS) {
    try {
      const feed = await parser.parseURL(url);
      allItems.push(...feed.items);
    } catch (err) {
      console.error(`❌ Failed to parse feed: ${url}\nReason: ${err.message}`);
    }
  }

  const filtered = keywords.length === 0
    ? allItems
    : allItems.filter(item =>
        keywords.some(kw =>
          (item.title || '').toLowerCase().includes(kw.toLowerCase()) ||
          (item.contentSnippet || '').toLowerCase().includes(kw.toLowerCase())
        )
      );

  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  const result = {
    success: true,
    total: filtered.length,
    page,
    limit,
    items: paginated
  };

  cache.set(cacheKey, result);
  return result;
}
