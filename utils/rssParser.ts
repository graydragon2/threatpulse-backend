import Parser from 'rss-parser';

const parser = new Parser();

export interface RSSItem {
  title?: string;
  contentSnippet?: string;
  link?: string;
  pubDate?: string;
  creator?: string;
}

export async function fetchAndFilterFeeds(feedUrls: string[], keywords: string[]): Promise<RSSItem[]> {
  const results: RSSItem[] = [];

  for (const url of feedUrls) {
    try {
      const feed = await parser.parseURL(url);

      feed.items.forEach(item => {
        const match = keywords.length === 0 || keywords.some(keyword =>
          (item.title || '').toLowerCase().includes(keyword.toLowerCase()) ||
          (item.contentSnippet || '').toLowerCase().includes(keyword.toLowerCase())
        );

        if (match) results.push(item as RSSItem);
      });
    } catch (err) {
      console.error(`Error parsing ${url}:`, (err as Error).message);
    }
  }

  return results;
}
