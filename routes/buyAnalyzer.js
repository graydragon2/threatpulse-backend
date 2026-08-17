const express = require('express');
const multer = require('multer');
const { analyzePurchase } = require('../utils/buyAnalyzerAgent');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB - plenty for a screenshot
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are supported'));
    }
    cb(null, true);
  }
});

// POST /buy-analyzer/analyze
// multipart/form-data: `image` (required, the screenshot) + `context` (optional
// freeform text describing the buyer's situation/budget/use case).
router.post('/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Upload a screenshot as the "image" field' });
  }

  try {
    const result = await analyzePurchase({
      imageBase64: req.file.buffer.toString('base64'),
      mediaType: req.file.mimetype,
      context: (req.body.context || '').trim()
    });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Buy analyzer route error:', err);
    res.status(500).json({ error: 'Failed to analyze the purchase' });
  }
});

// Multer (bad/oversized file) and other upload errors land here rather than
// falling through to Express's default HTML error page.
router.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ error: err.message || 'Upload failed' });
  }
  next();
});

module.exports = router;
