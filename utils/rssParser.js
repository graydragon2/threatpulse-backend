// utils/rssParser.js

import Parser from 'rss-parser';
import { scoreThreat } from './threatScorer.js';

const parser = new Parser();

const DEFAULT_DAYS_BACK = 3;

export async function parseRSS(keywords = [], sources = [], startDate = null, endDate = null) {
  const sourceMap = {
    CNN: 'http://rss.cnn.com/rss/edition.rss',
    BBC: 'http://feeds.bbci.co.uk/news/rss.xml',
    Reuters: 'http://feeds.reuters.com/reuters/topNews',
  };

  const selectedFeeds = sources.length ? sources.map(src => sourceMap[src]) : Object.values(sourceMap);

  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - DEFAULT_DAYS_BACK);
  const fromDate = startDate || defaultStartDate;

  const allItems = [];

  for (const feedUrl of selectedFeeds) {
    try {
      const feed = await parser.parseURL(feedUrl);

      const items = feed.items.map(item => {
        const threatScore = scoreThreat(item);
        let threatLevel = 'low';
        if (threatScore >= 70) threatLevel = 'high';
        else if (threatScore >= 30) threatLevel = 'medium';

        return {
          title: item.title || '',
          link: item.link || '',
          pubDate: item.pubDate || '',
          contentSnippet: item.contentSnippet || '',
          source: Object.keys(sourceMap).find(key => sourceMap[key] === feedUrl) || 'Unknown',
          threatScore,
          threatLevel,
        };
      });

      allItems.push(...items);
    } catch (err) {
      console.error(`Failed to parse feed ${feedUrl}:`, err);
    }
  }

  const filtered = allItems.filter(item => {
    const pubTime = new Date(item.pubDate);
    if (isNaN(pubTime)) return false;
    if (pubTime < fromDate) return false;
    if (endDate && pubTime > new Date(endDate)) return false;

    const content = `${item.title} ${item.contentSnippet}`.toLowerCase();
    return keywords.length === 0 || keywords.some(kw => content.includes(kw.toLowerCase()));
  });

  return filtered;
}



