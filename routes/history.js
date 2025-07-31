const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const historyFilePath = path.join(__dirname, '../data/savedReports.json');

router.get('/', (req, res) => {
  try {
    const fileContents = fs.readFileSync(historyFilePath, 'utf-8');
    const data = JSON.parse(fileContents);
    res.json(data);
  } catch (err) {
    console.error('Failed to read history:', err);
    res.status(500).json({ error: 'Failed to read history' });
  }
});

module.exports = router;
