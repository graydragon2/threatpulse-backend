import Parser from 'rss-parser';

const parser = new Parser();
const FEEDS = [
    'https://www.cisa.gov/news.xml',
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    // 'https://rss.cnn.com/rss/edition_world.rss'
];

export async function parseRSS(keywords) {
    let allItems = [];

    for (const url of FEEDS) {
        const feed = await parser.parseURL(url);
        allItems.push(...feed.items);
    }

    if (keywords.length === 0) return allItems.slice(0, 20); // limit default

    return allItems.filter(item =>
        keywords.some(kw =>
            (item.title || '').toLowerCase().includes(kw) ||
            (item.contentSnippet || '').toLowerCase().includes(kw)
        )
    ).slice(0, 20); // limit to 20 results
}

