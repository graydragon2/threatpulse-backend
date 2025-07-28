import Parser from 'rss-parser';

const parser = new Parser();

const FEEDS = [
  { url: 'https://www.cisa.gov/news.xml', name: 'CISA' },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC' },
];

function assessRisk(item) {
  const title = (item.title || '').toLowerCase();
  const content = (item.contentSnippet || '').toLowerCase();

  const highRiskTerms = ['attack', 'breach', 'exploit', 'critical', 'ransomware'];
  const mediumRiskTerms = ['vulnerability', 'warning', 'exposure', 'unauthorized'];

  if (highRiskTerms.some(term => title.includes(term) || content.includes(term))) {
    return 'high';
  } else if (mediumRiskTerms.some(term => title.includes(term) || content.includes(term))) {
    return 'medium';
  } else {
    return 'low';
  }
}

export async function parseRSS(keywords = []) {
  let allItems = [];

  for (const { url, name } of FEEDS) {
    try {
      const feed = await parser.parseURL(url);

      const taggedItems = feed.items.map(item => ({
        ...item,
        source: name,
        riskScore: assessRisk(item),
      }));

      allItems.push(...taggedItems);
    } catch (err) {
      console.error(`Failed to parse ${url}:`, err.message);
    }
  }

  if (!keywords.length) return allItems;

  return allItems.filter(item =>
    keywords.some(kw =>
      (item.title || '').toLowerCase().includes(kw) ||
      (item.contentSnippet || '').toLowerCase().includes(kw)
    )
  );
}


