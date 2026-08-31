/**
 * Converts an Excel serial date number (e.g. 38936) to a formatted date string DD-MM-YYYY
 */
export function excelSerialToDateString(serial) {
  const n = Number(serial);
  if (isNaN(n) || n < 1000 || n > 100000) return null;
  // Excel epoch: Dec 30, 1899 (accounts for Excel 1900 leap year bug)
  const utcDays = Math.floor(n - 25569);
  const utcValue = utcDays * 86400;
  const dateObj = new Date(utcValue * 1000);

  if (isNaN(dateObj.getTime())) return null;

  const yyyy = dateObj.getUTCFullYear();
  const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Checks if a column name represents a date field
 */
export function isDateColumnName(colName = '') {
  const nameStr = String(colName).toLowerCase();
  return (
    nameStr.includes('date') ||
    nameStr.includes('dob') ||
    nameStr.includes('effective') ||
    nameStr.includes('expiry') ||
    nameStr.includes('entry') ||
    nameStr.includes('birth')
  );
}

/**
 * Formats any raw cell value or Excel serial date into a clean string
 */
export function formatCellDisplayValue(val, colName = '') {
  if (val === undefined || val === null || val === '') return '';

  if (val instanceof Date) {
    const yyyy = val.getFullYear();
    const mm = String(val.getMonth() + 1).padStart(2, '0');
    const dd = String(val.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const strVal = String(val).trim();
  if (!strVal) return '';

  // Handle ISO date strings (e.g. "2006-08-07T00:00:00.000Z" -> "2006-08-07")
  if (/^\d{4}-\d{2}-\d{2}[T\s]/.test(strVal)) {
    return strVal.split(/[T\s]/)[0];
  }

  // Handle numeric Excel serial dates (e.g. 38936 -> "2006-08-07")
  if (/^\d{4,5}(\.\d+)?$/.test(strVal)) {
    const num = Number(strVal);
    if (isDateColumnName(colName) || (num >= 1000 && num <= 100000 && Number.isInteger(num))) {
      const parsedDate = excelSerialToDateString(num);
      if (parsedDate) return parsedDate;
    }
  }

  return strVal;
}

/**
 * Extracts and normalizes cell values from ExcelJS worksheet
 */
function extractCellValue(cell, colName = '') {
  if (!cell || cell.value === null || cell.value === undefined) return '';

  // 1. JS Date instance
  if (cell.value instanceof Date) {
    const d = cell.value;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // 2. Object cell values (formula result, rich text, date object)
  if (typeof cell.value === 'object') {
    const val = cell.value;
    if (val instanceof Date) {
      const d = val;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    if (val.richText) {
      return val.richText.map((t) => t.text || '').join('').trim();
    }
    if (val.result !== undefined) {
      if (val.result instanceof Date) {
        const d = val.result;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      if (typeof val.result === 'number') {
        const parsed = formatCellDisplayValue(val.result, colName);
        if (parsed) return parsed;
      }
      return String(val.result).trim();
    }
    if (val.text !== undefined) {
      return String(val.text).trim();
    }
  }

  // 3. Formatted cell text from Excel
  if (cell.text && typeof cell.text === 'string' && cell.text.trim()) {
    const textVal = cell.text.trim();
    if (/^\d{4,5}(\.\d+)?$/.test(textVal)) {
      const parsed = formatCellDisplayValue(textVal, colName);
      if (parsed) return parsed;
    }
    return textVal;
  }

  // 4. Raw numeric serial date detection
  if (typeof cell.value === 'number') {
    return formatCellDisplayValue(cell.value, colName);
  }

  // 5. String cell values that might be raw numbers
  const strVal = String(cell.value).trim();
  if (/^\d{4,5}$/.test(strVal)) {
    return formatCellDisplayValue(strVal, colName);
  }

  return strVal;
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
        values[col.name] = extractCellValue(row.getCell(col.colNumber), col.name);
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
