// utils/threatScorer.js

/**
 * Assigns a threat score based on keywords found in the RSS item.
 * Keywords:
 * - +50 for "attack" or "explosion"
 * - +30 for "death" or "killed"
 * - +20 for "warning" or "threat"
 * - +10 for "breaking"
 * Max score capped at 100.
 */
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
