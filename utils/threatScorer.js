// utils/threatScorer.js

export function scoreThreat(item) {
  const title = (item.title || '').toLowerCase();
  const snippet = (item.contentSnippet || '').toLowerCase();

  const highKeywords = ['ransomware', 'zero-day', 'breach', 'espionage'];
  const mediumKeywords = ['phishing', 'malware', 'ddos', 'exploit'];
  const lowKeywords = ['vulnerability', 'patch', 'cyber', 'security'];

  let score = 0;

  for (const word of highKeywords) {
    if (title.includes(word) || snippet.includes(word)) score += 3;
  }
  for (const word of mediumKeywords) {
    if (title.includes(word) || snippet.includes(word)) score += 2;
  }
  for (const word of lowKeywords) {
    if (title.includes(word) || snippet.includes(word)) score += 1;
  }

  let level = 'low';
  if (score >= 6) level = 'high';
  else if (score >= 3) level = 'medium';

  return { level, value: score };
}

export function classifyThreat(item) {
  const text = ((item.title || '') + ' ' + (item.contentSnippet || '')).toLowerCase();

  if (text.includes('cyber') || text.includes('breach') || text.includes('ransomware') || text.includes('malware')) {
    return 'Cybersecurity';
  }

  if (text.includes('explosion') || text.includes('shooting') || text.includes('gunfire') || text.includes('attack')) {
    return 'Physical';
  }

  if (text.includes('iran') || text.includes('russia') || text.includes('china') || text.includes('nato') || text.includes('military')) {
    return 'Geopolitical';
  }

  return 'General';
}
