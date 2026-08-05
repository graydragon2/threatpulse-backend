// utils/historyStorage.js
//
// Persists export history to data/savedReports.json. Previously this kept
// an in-memory array that nothing ever wrote to, while routes/history.js
// read the JSON file directly — two disconnected "history" systems. This
// is now the single source of truth; routes/history.js and exportUtils.js
// both go through it.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const historyFilePath = path.join(__dirname, '../data/savedReports.json');

function readHistory() {
  try {
    const raw = fs.readFileSync(historyFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    console.error('Failed to read history file:', err);
    return [];
  }
}

function writeHistory(entries) {
  fs.writeFileSync(historyFilePath, JSON.stringify(entries, null, 2));
}

function saveReportMetadata({ filename, format, filters, summary, url }) {
  const entry = {
    id: crypto.randomUUID(),
    filename,
    format,
    date: new Date().toISOString(),
    filters,
    summary,
    url
  };

  const history = readHistory();
  history.push(entry);
  writeHistory(history);

  return entry;
}

function getReportHistory() {
  return readHistory();
}

module.exports = {
  saveReportMetadata,
  getReportHistory
};
