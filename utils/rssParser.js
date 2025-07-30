// utils/rssParser.js

import Parser from 'rss-parser';
import { scoreThreat, extractTags } from './threatScorer.js';

const parser = new Parser();

const RSS_FEEDS = {
  CNN: 'http://rss.cnn.com/rss/cnn_topstories.rss',
  BBC: 'http://feeds.bbci.co.uk/news/rss.xml',
  Reuters: 'http://feeds.reuters.com/reuters/topNews'
};

export async function parseRSS(keywords = [], sources = [], startDate = null, endDate = null, filterTags = []) {
  const items = [];

  for (const [source, url] of Object.entries(RSS_FEEDS)) {
    if (sources.length && !sources.includes(source)) continue;
    try {
      const feed = await parser.parseURL(url);
      for (const entry of feed.items) {
        const pubDate = new Date(entry.pubDate);

        if (
          (startDate && pubDate < new Date(startDate)) ||
          (endDate && pubDate > new Date(endDate))
        ) continue;

        const match = keywords.length === 0 ||
          keywords.some(keyword =>
            (entry.title && entry.title.toLowerCase().includes(keyword.toLowerCase())) ||
            (entry.contentSnippet && entry.contentSnippet.toLowerCase().includes(keyword.toLowerCase()))
          );

        if (!match) continue;

        const score = scoreThreat(entry.title + ' ' + entry.contentSnippet);
        const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
        const tags = extractTags(entry.title + ' ' + entry.contentSnippet);

        if (filterTags.length > 0 && !tags.some(tag => filterTags.includes(tag))) continue;

        items.push({
          title: entry.title,
          link: entry.link,
          pubDate: pubDate.toISOString(),
          contentSnippet: entry.contentSnippet,
          source,
          threatScore: score,
          threatLevel: level,
          tags
        });
      }
    } catch (err) {
      console.error(`Error parsing ${source}:`, err.message);
    }
  }

  return items;
}



