const express = require('express');
const { exportCSV, exportPDF } = require('../utils/exportUtils');

const router = express.Router();

// GET /export/csv
router.get('/csv', exportCSV);

// GET /export/pdf
router.get('/pdf', exportPDF);

module.exports = router;
