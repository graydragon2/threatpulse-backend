const { parseRSS } = require('./rssParser');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

async function exportCSV(req, res) {
  try {
    const {
      keywords = '',
      sources = [],
      riskLevel = '',
      startDate,
      endDate,
      tags = ''
    } = req.query;

    const parsedTags = tags.split(',').map(tag => tag.trim()).filter(Boolean);

    const items = await parseRSS(
      keywords.split(',').filter(Boolean),
      [].concat(sources),
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null,
      parsedTags
    );

    const filtered = items.filter(item => {
      const matchesRisk = riskLevel ? item.threatLevel === riskLevel : true;
      const matchesTags = parsedTags.length > 0 ? parsedTags.some(tag => item.tags?.includes(tag)) : true;
      return matchesRisk && matchesTags;
    });

    const fields = ['title', 'pubDate', 'source', 'threatLevel', 'tags', 'link'];
    const parser = new Parser({ fields });
    const csv = parser.parse(filtered);

    const timestamp = new Date().toISOString().slice(0, 10);
    res.header('Content-Type', 'text/csv');
    res.attachment(`threats_${timestamp}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
}

async function exportPDF(req, res) {
  try {
    const {
      keywords = '',
      sources = [],
      riskLevel = '',
      startDate,
      endDate,
      tags = ''
    } = req.query;

    const parsedTags = tags.split(',').map(tag => tag.trim()).filter(Boolean);

    const items = await parseRSS(
      keywords.split(',').filter(Boolean),
      [].concat(sources),
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null,
      parsedTags
    );

    const filtered = items.filter(item => {
      const matchesRisk = riskLevel ? item.threatLevel === riskLevel : true;
      const matchesTags = parsedTags.length > 0 ? parsedTags.some(tag => item.tags?.includes(tag)) : true;
      return matchesRisk && matchesTags;
    });

    const doc = new PDFDocument();
    const timestamp = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="threats_${timestamp}.pdf"`);

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
