import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/?role=broker&broker_id=120&view=audit&file_uuid=5A5F6745-803F-464A-8B29-61FFB95E6F27');
  await page.waitForSelector('.historical-data-table', { timeout: 15000 });

  const rawJsonCount = await page.locator(':has-text("Raw Forensic JSON Payload")').count();
  console.log('Raw Forensic JSON text count:', rawJsonCount);

  const drawerCount = await page.locator('.raw-json-drawer').count();
  console.log('raw-json-drawer element count:', drawerCount);

  const screenshotPath = 'C:/Users/sayan.pramanick/.gemini/antigravity-ide/brain/7e1ea250-636e-45bc-85cd-3ccaeab0d7e9/audit_without_raw_json.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Saved clean screenshot to:', screenshotPath);
  await browser.close();
}

test();
