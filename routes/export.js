import express from 'express';
import { exportCSV, exportPDF } from '../utils/exportUtils.js';

const router = express.Router();

// GET /export/csv
router.get('/export/csv', exportCSV);

// GET /export/pdf
router.get('/export/pdf', exportPDF);

export default router;
