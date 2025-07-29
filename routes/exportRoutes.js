// routes/exportRoutes.js

import express from 'express';
import { exportCSV, exportPDF } from '../utils/exportUtils.js';

const router = express.Router();

router.get('/csv', exportCSV);
router.get('/pdf', exportPDF);

export default router;
