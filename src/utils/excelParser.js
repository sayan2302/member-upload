import ExcelJS from 'exceljs';

/**
 * Extracts and normalizes cell values from ExcelJS worksheet
 */
function extractCellValue(cell) {
  if (!cell || cell.value === null || cell.value === undefined) return '';
  const val = cell.value;
  if (typeof val === 'object') {
    if (val.richText) {
      return val.richText.map((t) => t.text || '').join('').trim();
    }
    if (val.result !== undefined) {
      return val.result;
    }
    if (val.text !== undefined) {
      return String(val.text).trim();
    }
    if (val instanceof Date) {
      const d = val;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }
  return String(val).trim();
}

/**
 * Parses raw ArrayBuffer of an Excel spreadsheet into interactive worksheet rows
 */
export async function parseExcelWorkbook(arrayBuffer) {
  if (!arrayBuffer) return null;
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return null;

    // Header row
    const headerRow = sheet.getRow(1);
    const columns = [];
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const name = extractCellValue(cell);
      if (name) {
        columns.push({ colNumber, name });
      }
    });

    // Detect data start row (skipping type-descriptor row if present e.g. "string *")
    let dataStartRow = 2;
    const row2Sample = extractCellValue(sheet.getRow(2).getCell(1));
    if (row2Sample.toLowerCase().includes('string') || row2Sample.includes('*')) {
      dataStartRow = 3;
    }

    const rows = [];
    for (let r = dataStartRow; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      if (!row || !row.hasValues) continue;

      const values = {};
      columns.forEach((col) => {
        values[col.name] = extractCellValue(row.getCell(col.colNumber));
      });

      const hasAnyVal = Object.values(values).some((v) => v !== '' && v !== null && v !== undefined);
      if (!hasAnyVal) continue;

      rows.push({
        row: rows.length + 1,
        sourceRow: r,
        valid: true,
        values,
        errors: [],
      });
    }

    return {
      columns: columns.map((c) => c.name),
      totalRows: rows.length,
      acceptedRows: rows.length,
      rejectedRows: 0,
      rows,
    };
  } catch (err) {
    console.error('[excelParser] Failed to parse Excel buffer:', err);
    return null;
  }
}
