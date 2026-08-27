import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });
  page.on('pageerror', err => {
    console.error('PAGE ERROR DETECTED:', err.message);
    errors.push(err.message);
  });

  await page.goto('http://localhost:5173/?role=broker&broker_id=120&view=audit&file_uuid=5A5F6745-803F-464A-8B29-61FFB95E6F27');
  await page.waitForSelector('.historical-data-table tbody tr', { timeout: 15000 });

  const initialRowCount = await page.$$eval('.historical-data-table tbody tr', trs => trs.length);
  console.log('Initial row count before filtering:', initialRowCount);

  console.log('1. Clicking Filter Faulty Only button...');
  const btn = page.locator('button:has-text("Filter Faulty Only")').first();
  await btn.click();
  await page.waitForTimeout(1000);

  const emptyNotice = await page.locator('text=Zero Faulty Rows in This Snapshot').textContent({ timeout: 5000 });
  console.log('Empty state notice visible:', emptyNotice?.trim());

  const screenshotPath1 = 'C:/Users/sayan.pramanick/.gemini/antigravity-ide/brain/7e1ea250-636e-45bc-85cd-3ccaeab0d7e9/filter_faulty_active.png';
  await page.screenshot({ path: screenshotPath1 });
  console.log('Saved screenshot with filter active to:', screenshotPath1);

  console.log('2. Clicking again to toggle back to all records...');
  const btnActive = page.locator('button:has-text("Showing Faulty Rows Only")').first();
  await btnActive.click();
  await page.waitForTimeout(1000);

  const restoredRowCount = await page.$$eval('.historical-data-table tbody tr', trs => trs.length);
  console.log('Restored row count after unfiltering:', restoredRowCount);

  const screenshotPath2 = 'C:/Users/sayan.pramanick/.gemini/antigravity-ide/brain/7e1ea250-636e-45bc-85cd-3ccaeab0d7e9/filter_faulty_restored.png';
  await page.screenshot({ path: screenshotPath2 });
  console.log('Saved screenshot with all rows restored to:', screenshotPath2);

  console.log('Total page errors caught:', errors.length);
  await browser.close();
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
