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

  if (score >= 6) {
    return { level: 'high', value: score };
  } else if (score >= 3) {
    return { level: 'medium', value: score };
  } else {
    return { level: 'low', value: score };
  }
}
