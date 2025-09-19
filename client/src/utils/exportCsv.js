// Utility to export array of objects to CSV and trigger download
export function exportToCsv(filename, rows, columns) {
  if (!Array.isArray(rows)) rows = [];

  const escapeCell = (value) => {
    const s = value == null ? '' : String(value);
    const needsQuotes = /[",\n\r]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const headers = columns.map((col) => escapeCell(col.header ?? col.key));
  const lines = [headers.join(',')];

  for (const row of rows) {
    const line = columns.map((col) => {
      const val = typeof col.key === 'function' ? col.key(row) : row?.[col.key];
      return escapeCell(val);
    });
    lines.push(line.join(','));
  }

  const csvContent = lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
