// utils/threatScorer.js

export function scoreThreat(item) {
  const title = (item.title || '').toLowerCase();
  const snippet = (item.contentSnippet || '').toLowerCase();

  const content = title + ' ' + snippet;

  let score = 0;

  if (content.includes('attack') || content.includes('explosion')) score += 50;
  if (content.includes('death') || content.includes('killed')) score += 30;
  if (content.includes('warning') || content.includes('threat')) score += 20;
  if (content.includes('breaking')) score += 10;

  return Math.min(100, score);
}