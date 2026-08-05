// utils/filterThreats.js
//
// Shared riskLevel/tags filtering, previously duplicated between
// routes/rss.js and utils/exportUtils.js (and silently never applied
// at all on the /rss route, since parseRSS ignored the tags it was
// passed).

function filterThreats(items, { riskLevel = '', tags = [] } = {}) {
  return items.filter((item) => {
    const matchesRisk = riskLevel ? item.threatLevel === riskLevel : true;
    const matchesTags = tags.length > 0 ? tags.some((tag) => item.tags?.includes(tag)) : true;
    return matchesRisk && matchesTags;
  });
}

module.exports = { filterThreats };
