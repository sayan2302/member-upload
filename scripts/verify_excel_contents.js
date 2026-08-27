import { chromium } from 'playwright';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ExcelJS = require('C:/ALL/OFFICE/data-exchange/node_modules/exceljs');

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/?role=hr&corp_id=1422138&provider_corp_id=1422138');
  await page.waitForTimeout(1500);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('button:has-text("Download Template")').first().click();
  const dl = await downloadPromise;
  await dl.saveAs('./scripts/downloaded_verify_template.xlsx');
  console.log('Saved downloaded file to ./scripts/downloaded_verify_template.xlsx');
  await browser.close();

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('./scripts/downloaded_verify_template.xlsx');
  console.log('Sheet names:', wb.worksheets.map(w => w.name));
  const sheet = wb.worksheets[0];
  const headers = sheet.getRow(1).values.filter(Boolean);
  console.log('Total headers in workbook:', headers.length);
  console.log('First 10 headers:', headers.slice(0, 10));
}

test();
