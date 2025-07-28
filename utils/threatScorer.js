// utils/threatScorer.js

export function scoreThreat(item) {
  const title = item.title.toLowerCase();
  const snippet = (item.contentSnippet || '').toLowerCase();
  const combined = `${title} ${snippet}`;

  const highRiskKeywords = ['terror', 'explosion', 'shooting', 'cyberattack', 'hostage'];
  const mediumRiskKeywords = ['hack', 'leak', 'protest', 'attack', 'breach'];

  let score = 0;

  highRiskKeywords.forEach(word => {
    if (combined.includes(word)) score += 50;
  });

  mediumRiskKeywords.forEach(word => {
    if (combined.includes(word)) score += 25;
  });

  return Math.min(score, 100);
}