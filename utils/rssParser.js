// utils/rssParser.js
import Parser from 'rss-parser';

const parser = new Parser();
const FEEDS = [
  'https://www.cisa.gov/news.xml',
  'https://feeds.bbci.co.uk/news/world/rss.xml',
];

export async function parseRSS(keywords) {
  let allItems = [];

  for (const url of FEEDS) {
    const feed = await parser.parseURL(url);
    allItems.push(
      ...feed.items.map(item => ({
        ...item,
        source: url.includes('cisa') ? 'CISA' : url.includes('bbc') ? 'BBC' : 'Unknown',
      }))
    );
  }

  if (!keywords.length) return allItems;
  return allItems.filter(item =>
    keywords.some(kw =>
      (item.title || '').toLowerCase().includes(kw) ||
      (item.contentSnippet || '').toLowerCase().includes(kw)
    )
  );
}

