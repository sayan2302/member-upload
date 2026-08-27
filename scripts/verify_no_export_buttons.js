import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

  await page.goto('http://localhost:5173/?role=broker&broker_id=120&view=audit&file_uuid=5A5F6745-803F-464A-8B29-61FFB95E6F27');
  await page.waitForSelector('.historical-data-table', { timeout: 15000 });

  const printBtnCount = await page.locator('button:has-text("Print / PDF Report")').count();
  console.log('Print / PDF Report button count:', printBtnCount);

  const exportBtnCount = await page.locator('button:has-text("Export Raw JSON")').count();
  console.log('Export Raw JSON button count:', exportBtnCount);

  const screenshotPath = 'C:/Users/sayan.pramanick/.gemini/antigravity-ide/brain/7e1ea250-636e-45bc-85cd-3ccaeab0d7e9/audit_without_export_buttons.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Saved clean screenshot to:', screenshotPath);

  await browser.close();
}

test();
