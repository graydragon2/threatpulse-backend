// utils/threatScorer.js

const highRiskWords = ['explosion', 'attack', 'shooting', 'dead', 'killed'];
const mediumRiskWords = ['protest', 'fire', 'evacuate', 'alert'];

export function scoreThreat(item) {
  const text = `${item.title} ${item.contentSnippet}`.toLowerCase();
  let score = 0;

  for (const word of highRiskWords) {
    if (text.includes(word)) score += 30;
  }

  for (const word of mediumRiskWords) {
    if (text.includes(word)) score += 15;
  }

  return Math.min(score, 100);
}
