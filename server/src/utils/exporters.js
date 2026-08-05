import ExcelJS from 'exceljs';

/**
 * Both exporters take the same shape: `columns` is [{ key, header }], `rows`
 * is an array of plain objects. Every report export (sales, customers,
 * leads, tasks) funnels through these two functions instead of each report
 * type hand-rolling its own CSV/XLSX generation — the only thing that
 * differs per report is which columns/rows are selected upstream in
 * report.service.js.
 */

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export const rowsToCsv = (rows, columns) => {
  const header = columns.map((c) => escapeCsvValue(c.header)).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCsvValue(row[c.key])).join(','));
  return [header, ...lines].join('\n');
};

export const rowsToXlsx = async (rows, columns, sheetName = 'Report') => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CRM Platform';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 22 }));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF0F6' } };

  rows.forEach((row) => sheet.addRow(row));

  return workbook.xlsx.writeBuffer();
};
