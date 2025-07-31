const { v4: uuidv4 } = require('uuid');

// Temporary in-memory storage (replace with file/db as needed)
const history = [];

function saveReportMetadata({ filename, format, filters }) {
  const entry = {
    id: uuidv4(),
    filename,
    format,
    date: new Date().toISOString(),
    filters,
  };
  history.push(entry);
  return entry;
}

function getReportHistory() {
  return history;
}

module.exports = {
  saveReportMetadata,
  getReportHistory,
};
