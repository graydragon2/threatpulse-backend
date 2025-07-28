import Parser from 'rss-parser';

const parser = new Parser();

// Define feed list and readable names
const FEEDS = [
  { url: 'https://www.cisa.gov/news.xml', name: 'CISA' },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC' },
  // { url: 'https://rss.cnn.com/rss/edition_world.rss', name: 'CNN' },
];

export async function parseRSS(keywords = []) {
  let allItems = [];

  for (const { url, name } of FEEDS) {
    try {
      const feed = await parser.parseURL(url);

      const taggedItems = feed.items.map(item => ({
        ...item,
        source: name,
      }));

      allItems.push(...taggedItems);
    } catch (err) {
      console.error(`Failed to parse ${url}:`, err.message);
    }
  }

  if (!keywords.length) return allItems;

  return allItems.filter(item =>
    keywords.some(kw =>
      (item.title || '').toLowerCase().includes(kw) ||
      (item.contentSnippet || '').toLowerCase().includes(kw)
    )
  );
}


