const express = require('express');
const router = express.Router();
const { getReportHistory } = require('../utils/historyStorage');

router.get('/', (req, res) => {
  try {
    res.json(getReportHistory());
  } catch (err) {
    console.error('Failed to read history:', err);
    res.status(500).json({ error: 'Failed to read history' });
  }
});

module.exports = router;
