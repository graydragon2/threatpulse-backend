// utils/exportUtils.js

import { parseRSS } from './rssParser.js';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

export async function exportCSV(req, res) {
  try {
    const { keywords = '', sources = [], riskLevel = '', startDate, endDate, tags = '' } = req.query;

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);

    const items = await parseRSS(
      keywords.split(',').filter(Boolean),
      [].concat(sources),
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null,
      tagList
    );

    const filtered = riskLevel
      ? items.filter(item => item.threatLevel === riskLevel)
      : items;

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

export async function exportPDF(req, res) {
  try {
    const { keywords = '', sources = [], riskLevel = '', startDate, endDate, tags = '' } = req.query;

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);

    const items = await parseRSS(
      keywords.split(',').filter(Boolean),
      [].concat(sources),
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null,
      tagList
    );

    const filtered = riskLevel
      ? items.filter(item => item.threatLevel === riskLevel)
      : items;

    const doc = new PDFDocument();
    const timestamp = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="threats_${timestamp}.pdf"`);

    doc.pipe(res);
    doc.fontSize(16).text('ThreatPulse Threat Report', { align: 'center' });
    doc.moveDown();

    filtered.forEach((item, index) => {
      // Set risk color
      const color =
        item.threatLevel === 'high' ? 'red' :
        item.threatLevel === 'medium' ? 'orange' :
        'green';

      doc
        .fillColor('white')
        .fontSize(12)
        .text(`${index + 1}. ${item.title}`, { continued: false })
        .moveDown(0.2)
        .fontSize(10)
        .fillColor('gray')
        .text(`Date: ${item.pubDate}`)
        .text(`Source: ${item.source}`)
        .fillColor(color)
        .text(`Risk: ${item.threatLevel.toUpperCase()}`);

      if (item.tags && item.tags.length > 0) {
        doc
          .fillColor('cyan')
          .text(`Tags: ${item.tags.join(', ')}`);
      }

      doc
        .fillColor('blue')
        .text(`Link: ${item.link}`)
        .moveDown();
    });

    doc.end();
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
}

