import Parser from 'rss-parser';
const parser = new Parser();

const FEEDS = [
  { url: 'https://www.cisa.gov/news.xml', source: 'CISA' },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC' },
  // { url: 'https://rss.cnn.com/rss/edition_world.rss', source: 'CNN' }
];

export async function parseRSS(keywords) {
  let allItems = [];

  for (const feed of FEEDS) {
    const parsed = await parser.parseURL(feed.url);
    parsed.items.forEach(item => {
      allItems.push({ ...item, source: feed.source });
    });
  }

  if (keywords.length === 0) return allItems.slice(0, 20);

  return allItems
    .filter(item =>
      keywords.some(kw =>
        (item.title || '').toLowerCase().includes(kw) ||
        (item.contentSnippet || '').toLowerCase().includes(kw)
      )
    )
    .slice(0, 20);
}

