// utils/rssParser.js
const Parser = require('rss-parser');
const { scoreThreat, extractTags } = require('./threatScorer');

const parser = new Parser();

const feeds = [
  { url: 'https://rss.cnn.com/rss/cnn_latest.rss', source: 'CNN' },
  { url: 'http://feeds.bbci.co.uk/news/rss.xml', source: 'BBC' },
  { url: 'http://feeds.reuters.com/reuters/topNews', source: 'Reuters' },
  { url: 'https://feeds.npr.org/1001/rss.xml', source: 'NPR' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera' },
  { url: 'https://www.darkreading.com/rss.xml', source: 'DarkReading' },
  { url: 'https://www.infosecurity-magazine.com/rss/', source: 'Infosecurity Magazine' },
  { url: 'https://www.schneier.com/blog/atom.xml', source: 'Schneier on Security' },
  { url: 'https://alerts.weather.gov/cap/wwaatmget.php?x=1', source: 'NOAA Alerts' },
  { url: 'https://www.emsc-csem.org/service/rss/rss.php', source: 'EMSC Earthquakes' }
];

async function parseRSS(keywords = [], sources = [], startDate = null, endDate = null) {
  const allItems = [];

  for (const feed of feeds) {
    if (sources.length > 0 && !sources.includes(feed.source)) continue;

    try {
      const res = await parser.parseURL(feed.url);
      const items = res.items || [];

      for (const item of items) {
        const pubDate = new Date(item.pubDate || item.isoDate || Date.now());
        if (startDate && pubDate < startDate) continue;
        if (endDate && pubDate > endDate) continue;

        const content = (item.title || '') + ' ' + (item.contentSnippet || '') + ' ' + (item.content || '');
        if (
          keywords.length > 0 &&
          !keywords.some(kw => content.toLowerCase().includes(kw.toLowerCase()))
        )
          continue;

        const scored = {
          ...item,
          pubDate: pubDate.toISOString(),
          source: feed.source,
          threatScore: scoreThreat(item),
          threatLevel:
            scoreThreat(item) >= 70
              ? 'high'
              : scoreThreat(item) >= 40
              ? 'medium'
              : 'low',
          tags: extractTags(item)
        };

        allItems.push(scored);
      }
    } catch (err) {
      console.error(`Error fetching feed ${feed.url}:`, err.message);
    }
  }

  return allItems;
}

module.exports = { parseRSS };
