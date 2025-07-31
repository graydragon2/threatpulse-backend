const Parser = require('rss-parser');
const { scoreThreat, extractTags } = require('./threatScorer');

const parser = new Parser();

const feeds = [
  { url: 'https://rss.cnn.com/rss/cnn_latest.rss', source: 'CNN' },
  { url: 'http://feeds.bbci.co.uk/news/rss.xml', source: 'BBC' },
  { url: 'http://feeds.reuters.com/reuters/topNews', source: 'Reuters' },
];

async function parseRSS(keywords = [], sources = [], startDate = null, endDate = null, tags = []) {
  let allItems = [];

  for (const feed of feeds) {
    if (sources.length && !sources.includes(feed.source)) continue;

    try {
      const parsed = await parser.parseURL(feed.url);
      const items = parsed.items.map(item => {
        const threatScore = scoreThreat(item);
        const threatLevel =
          threatScore >= 70 ? 'high'
          : threatScore >= 40 ? 'medium'
          : 'low';

        const itemTags = extractTags(item);

        return {
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          source: feed.source,
          contentSnippet: item.contentSnippet,
          threatScore,
          threatLevel,
          tags: itemTags,
        };
      });

      allItems = allItems.concat(items);
    } catch (err) {
      console.error(`Error fetching feed ${feed.url}:`, err.message);
    }
  }

  if (keywords.length) {
    allItems = allItems.filter(item =>
      keywords.some(kw =>
        item.title?.toLowerCase().includes(kw) ||
        item.contentSnippet?.toLowerCase().includes(kw)
      )
    );
  }

  if (startDate || endDate) {
    allItems = allItems.filter(item => {
      const itemDate = new Date(item.pubDate);
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    });
  }

  if (tags.length) {
    allItems = allItems.filter(item =>
      item.tags.some(tag => tags.includes(tag))
    );
  }

  return allItems;
}

module.exports = { parseRSS };
