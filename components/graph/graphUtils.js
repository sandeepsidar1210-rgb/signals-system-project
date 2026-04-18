function downloadGraphPng(plotId, fileName) {
  const plotEl = document.getElementById(plotId);
  if (!plotEl) return;

  Plotly.toImage(plotEl, { format: 'png', width: 1400, height: 900 }).then((dataUrl) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${fileName || plotId}.png`;
    link.click();
  });
}

function exportGraphPdf(plotId, title, summary) {
  const plotEl = document.getElementById(plotId);
  if (!plotEl || !window.jspdf || !window.jspdf.jsPDF) return;

  Plotly.toImage(plotEl, { format: 'png', width: 1400, height: 900 }).then((dataUrl) => {
    const doc = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(18);
    doc.text(title || 'Signal Lab Export', 32, 34);
    doc.setFontSize(11);
    doc.text(summary || 'Generated from Signal Analysis Virtual Lab', 32, 54);
    doc.addImage(dataUrl, 'PNG', 32, 76, 770, 430);
    doc.save(`${title || plotId}.pdf`);
  });
}
