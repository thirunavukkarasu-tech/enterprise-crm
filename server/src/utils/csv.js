import { parse } from 'csv-parse/sync';

/**
 * Parses an uploaded CSV buffer into an array of row objects keyed by
 * header. Hand-rolled options (not a full ETL library) since the import
 * shape is fixed and small — trim whitespace, skip blank lines, and treat
 * the first row as the header.
 */
export const parseCsvBuffer = (buffer) =>
  parse(buffer, {
    columns: (header) => header.map((h) => h.trim().toLowerCase()),
    skip_empty_lines: true,
    trim: true,
  });

const escapeCsvField = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Hand-rolled CSV stringifier rather than pulling in a dependency — the
 * export shape is a fixed, flat list of columns, which is a ~15-line
 * problem and doesn't justify another package for this scope.
 */
export const toCsv = (rows, columns) => {
  const header = columns.map((c) => c.label).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCsvField(c.value(row))).join(','));
  return [header, ...lines].join('\n');
};
