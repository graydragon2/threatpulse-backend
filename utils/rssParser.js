// utils/rssParser.js

import Parser from 'rss-parser';
import { scoreThreat } from './threatScorer.js';

const parser = new Parser();

const feedSources = [
  { name: 'CNN', url: 'http://rss.cnn.com/rss/edition.rss' },
  { name: 'BBC', url: 'http://feeds.bbci.co.uk/news/rss.xml' },
  { name: 'Reuters', url: 'http://feeds.reuters.com/reuters/topNews' }
];

export async function parseRSS(keywords = [], sourceFilter = []) {
  let results = [];

  for (const feed of feedSources) {
    if (sourceFilter.length && !sourceFilter.includes(feed.name)) continue;

    try {
      const parsed = await parser.parseURL(feed.url);
      const filtered = parsed.items.filter(item => {
        const content = (item.title + ' ' + item.contentSnippet).toLowerCase();
        return keywords.length === 0 || keywords.some(k => content.includes(k));
      });

      const enriched = filtered.map(item => {
        const score = scoreThreat(item);
        let threatLevel = 'low';
        if (score >= 70) threatLevel = 'high';
        else if (score >= 40) threatLevel = 'medium';

        return {
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          contentSnippet: item.contentSnippet || '',
          source: feed.name,
          threatScore: score,
          threatLevel
        };
      });

      results.push(...enriched);
    } catch (err) {
      console.warn(`Failed to parse ${feed.name}:`, err.message);
    }
  }

  return results;
}
