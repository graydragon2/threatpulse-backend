const Parser = require('rss-parser');
const NodeCache = require('node-cache');
const { scoreThreat, extractTags } = require('./threatScorer');

const parser = new Parser({
  headers: { 'User-Agent': 'ThreatPulseBot/1.0' }
});

// Feeds are fetched live on every call; cache the scored result per unique
// keyword/source/date-range combination so repeated requests (e.g. a
// frontend polling /rss) don't re-fetch all feeds every time.
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

const feeds = [
  // General mainstream news — useful for corroboration/context, but by
  // definition lags behind the specialist and first-party sources below.
  { url: 'https://rss.cnn.com/rss/cnn_latest.rss', source: 'CNN' },
  { url: 'http://feeds.bbci.co.uk/news/rss.xml', source: 'BBC' },
  { url: 'http://feeds.reuters.com/reuters/topNews', source: 'Reuters' },
  { url: 'https://feeds.npr.org/1001/rss.xml', source: 'NPR' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera' },

  // Cybersecurity — specialist outlets and vendor threat-research teams
  // that routinely break threat/breach stories well before mainstream
  // outlets pick them up.
  { url: 'https://www.darkreading.com/rss.xml', source: 'DarkReading' },
  { url: 'https://www.infosecurity-magazine.com/rss/', source: 'Infosecurity Magazine' },
  { url: 'https://www.schneier.com/blog/atom.xml', source: 'Schneier on Security' },
  { url: 'https://krebsonsecurity.com/feed/', source: 'Krebs on Security' },
  { url: 'https://www.bleepingcomputer.com/feed/', source: 'BleepingComputer' },
  { url: 'https://isc.sans.edu/rssfeed.xml', source: 'SANS Internet Storm Center' },
  { url: 'https://therecord.media/feed', source: 'The Record' },
  { url: 'http://thehackernews.com/feeds/posts/default', source: 'The Hacker News' },
  { url: 'https://blog.talosintelligence.com/rss/', source: 'Cisco Talos' },
  { url: 'https://unit42.paloaltonetworks.com/feed/', source: 'Unit 42 (Palo Alto Networks)' },

  // Defense / geopolitical — national-security-focused analysis and OSINT
  // investigation, ahead of the general news cycle on conflicts, military
  // posture, terrorism, and policy.
  { url: 'https://www.understandingwar.org/rss.xml', source: 'Institute for the Study of War' },
  { url: 'https://warontherocks.com/feed/', source: 'War on the Rocks' },
  { url: 'https://breakingdefense.com/full-rss-feed/', source: 'Breaking Defense' },
  { url: 'https://www.longwarjournal.org/feed', source: "FDD's Long War Journal" },
  { url: 'https://www.bellingcat.com/feed/', source: 'Bellingcat' },

  // Crisis / disaster early warning.
  { url: 'https://alerts.weather.gov/cap/wwaatmget.php?x=1', source: 'NOAA Alerts' },
  { url: 'https://www.emsc-csem.org/service/rss/rss.php', source: 'EMSC Earthquakes' },
  { url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.atom', source: 'USGS Significant Earthquakes' },
  { url: 'https://reliefweb.int/updates/rss.xml', source: 'ReliefWeb' }
];

async function parseRSS(keywords = [], sources = [], startDate = null, endDate = null) {
  const cacheKey = JSON.stringify({
    keywords: [...keywords].sort(),
    sources: [...sources].sort(),
    startDate: startDate ? startDate.toISOString() : null,
    endDate: endDate ? endDate.toISOString() : null
  });

  const cached = cache.get(cacheKey);
  if (cached) return cached;

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

  cache.set(cacheKey, results);
  return results;
}

module.exports = { parseRSS };
