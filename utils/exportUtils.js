const { parseRSS } = require('./rssParser');
const { filterThreats } = require('./filterThreats');
const { saveReportMetadata } = require('./historyStorage');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

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

async function exportCSV(req, res) {
  try {
    const filters = parseFilters(req);
    const filtered = await getFilteredItems(filters);

    const fields = ['title', 'pubDate', 'source', 'threatLevel', 'tags', 'link'];
    const parser = new Parser({ fields });
    const csv = parser.parse(filtered);

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `threats_${timestamp}.csv`;

    saveReportMetadata({ filename, format: 'csv', filters });

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
    const filename = `threats_${timestamp}.pdf`;

    saveReportMetadata({ filename, format: 'pdf', filters });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);
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
