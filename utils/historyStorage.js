// utils/historyStorage.js

import { v4 as uuidv4 } from 'uuid';

// Temporary in-memory storage (replace with file/db as needed)
const history = [];

export function saveReportMetadata({ filename, format, filters }) {
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

export function getReportHistory() {
  return history;
}
