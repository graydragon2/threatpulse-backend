function scoreThreat(item) {
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

function extractTags(item) {
  const text = `${item.title} ${item.contentSnippet}`.toLowerCase();
  const tags = [];

  if (text.includes('explosion')) tags.push('explosion');
  if (text.includes('attack')) tags.push('attack');
  if (text.includes('death') || text.includes('killed')) tags.push('fatality');
  if (text.includes('warning')) tags.push('warning');
  if (text.includes('breaking')) tags.push('breaking');
  if (text.includes('evacuation')) tags.push('evacuation');
  if (text.includes('chemical')) tags.push('chemical');
  if (text.includes('radiation')) tags.push('radiation');
  if (text.includes('protest') || text.includes('riot')) tags.push('civil unrest');
  if (text.includes('military')) tags.push('military');
  if (text.includes('cyber') || text.includes('breach')) tags.push('cyber');

  return tags;
}

module.exports = {
  scoreThreat,
  extractTags,
};
