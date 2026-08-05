const fs = require('fs');
const path = require('path');
const { parseRSS } = require('./rssParser');
const { filterThreats } = require('./filterThreats');
const { saveReportMetadata } = require('./historyStorage');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

const EXPORTS_DIR = path.join(__dirname, '../data/exports');

// Best-effort: persisting exports for later re-download is a nice-to-have,
// not something that should ever take the export endpoint down. Created
// lazily (not at module load) and any failure here just means the export
// isn't saved to history — the client still gets their file.
let exportsDirReady = false;
function ensureExportsDir() {
  if (exportsDirReady) return true;
  try {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    exportsDirReady = true;
    return true;
  } catch (err) {
    console.error('Could not create exports directory, exports will not be saved to history:', err);
    return false;
  }
}

function parseFilters(req) {
  const {
    keywords = '',
    sources = [],
    riskLevel = '',
    startDate,
    endDate,
    tags = ''
  } = req.query;

  return {
    keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
    sources: [].concat(sources),
    riskLevel,
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
  };
}

async function getFilteredItems(filters) {
  const items = await parseRSS(filters.keywords, filters.sources, filters.startDate, filters.endDate);
  return filterThreats(items, { riskLevel: filters.riskLevel, tags: filters.tags });
}

function summarize(items) {
  return items.reduce(
    (acc, item) => {
      if (item.threatLevel === 'high') acc.high++;
      else if (item.threatLevel === 'medium') acc.medium++;
      else if (item.threatLevel === 'low') acc.low++;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );
}

function downloadUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/downloads/${filename}`;
}

async function exportCSV(req, res) {
  try {
    const filters = parseFilters(req);
    const filtered = await getFilteredItems(filters);

    const fields = ['title', 'pubDate', 'source', 'threatLevel', 'tags', 'link'];
    const parser = new Parser({ fields });
    const csv = parser.parse(filtered);

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `threats_${timestamp}_${Date.now()}.csv`;

    if (ensureExportsDir()) {
      try {
        fs.writeFileSync(path.join(EXPORTS_DIR, filename), csv);
        saveReportMetadata({
          filename,
          format: 'csv',
          filters,
          summary: summarize(filtered),
          url: downloadUrl(req, filename)
        });
      } catch (err) {
        console.error('Could not persist CSV export to history:', err);
      }
    }

    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
}

async function exportPDF(req, res) {
  try {
    const filters = parseFilters(req);
    const filtered = await getFilteredItems(filters);

    const doc = new PDFDocument();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `threats_${timestamp}_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream to the response, and best-effort to disk at the same time so
    // the report can be re-downloaded later from /history. If the exports
    // directory isn't writable, the client still gets the PDF — it just
    // won't show up in history.
    doc.pipe(res);
    if (ensureExportsDir()) {
      const fileStream = fs.createWriteStream(path.join(EXPORTS_DIR, filename));
      fileStream.on('error', (err) => {
        console.error('Could not persist PDF export to history:', err);
      });
      doc.pipe(fileStream);
      fileStream.on('finish', () => {
        saveReportMetadata({
          filename,
          format: 'pdf',
          filters,
          summary: summarize(filtered),
          url: downloadUrl(req, filename)
        });
      });
    }

    doc.fontSize(16).text('ThreatPulse Threat Report', { align: 'center' });
    doc.moveDown();

    filtered.forEach((item, index) => {
      const riskColor =
        item.threatLevel === 'high' ? 'red' :
        item.threatLevel === 'medium' ? 'orange' : 'green';

      doc
        .fillColor('black')
        .fontSize(12)
        .text(`${index + 1}. ${item.title}`)
        .moveDown(0.2)
        .fontSize(10)
        .text(`Date: ${item.pubDate}`)
        .text(`Source: ${item.source}`)
        .fillColor(riskColor)
        .text(`Risk: ${item.threatLevel}`)
        .fillColor('black')
        .text(`Tags: ${item.tags?.join(', ') || 'None'}`)
        .text(`Link: ${item.link}`)
        .moveDown();
    });

    doc.end();
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
}

module.exports = { exportCSV, exportPDF };
