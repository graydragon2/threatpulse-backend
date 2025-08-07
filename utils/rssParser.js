// utils/rssParser.js

import Parser from 'rss-parser';
import { scoreThreat, extractTags } from './threatScorer.js';

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

export async function parseRSS(keywords = [], sources = [], startDate = null, endDate = null, tags = []) {
  let allItems = [];

  for (const feed of feeds) {
    // Skip feed if source filtering is enabled and feed is not included
    if (sources.length && !sources.includes(feed.source)) continue;

    try {
      const parsed = await parser.parseURL(feed.url);
      const items = parsed.items.map(item => {
        const threatScore = scoreThreat(item);
        const threatLevel = threatScore >= 70
          ? 'high'
          : threatScore >= 40
          ? 'medium'
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

  // Filter by keywords
  if (keywords.length) {
    allItems = allItems.filter(item =>
      keywords.some(kw =>
        item.title?.toLowerCase().includes(kw) ||
        item.contentSnippet?.toLowerCase().includes(kw)
      )
    );
  }

  // Filter by date
  if (startDate || endDate) {
    allItems = allItems.filter(item => {
      const itemDate = new Date(item.pubDate);
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    });
  }

  // Filter by tags
  if (tags.length) {
    allItems = allItems.filter(item =>
      item.tags.some(tag => tags.includes(tag))
    );
  }

  return allItems;
}
