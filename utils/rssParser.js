const Parser = require('rss-parser');
const { scoreThreat, extractTags } = require('./threatScorer');

const parser = new Parser({
  headers: { 'User-Agent': 'ThreatPulseBot/1.0' }
});

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
  const results = [];

  const selectedFeeds = sources.length
    ? feeds.filter(f => sources.includes(f.source))
    : feeds;

  for (const feed of selectedFeeds) {
    try {
      const parsed = await parser.parseURL(feed.url);

      for (const item of parsed.items || []) {
        const title = item.title || '';
        const snippet = item.contentSnippet || '';
        const pubDate = new Date(item.pubDate || item.isoDate || new Date());

        if (startDate && pubDate < startDate) continue;
        if (endDate && pubDate > endDate) continue;

        const content = `${title} ${snippet}`.toLowerCase();
        const matchesKeyword = !keywords.length || keywords.some(k => content.includes(k.toLowerCase()));

        if (!matchesKeyword) continue;

        const score = scoreThreat(item);
        const tags = extractTags(item);

        results.push({
          title: item.title,
          link: item.link,
          source: feed.source,
          pubDate: pubDate.toISOString(),
          contentSnippet: item.contentSnippet,
          threatScore: score,
          threatLevel: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low',
          tags
        });
      }
    } catch (err) {
      console.error(`Error fetching feed ${feed.url}: ${err.message}`);
    }
  }

  return results;
}

module.exports = { parseRSS };
