import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

  console.log('Navigating to Audit Console for 5A5F6745-803F-464A-8B29-61FFB95E6F27...');
  await page.goto('http://localhost:5173/?role=broker&broker_id=120&view=audit&file_uuid=5A5F6745-803F-464A-8B29-61FFB95E6F27');

  // Wait for loading to complete and table to render
  await page.waitForSelector('.historical-data-table', { timeout: 15000 });
  console.log('✔ Interactive worksheet table rendered on screen!');

  // Check headers
  const ths = await page.$$eval('.historical-data-table thead th', els => els.map(e => e.textContent.trim()));
  console.log('Rendered column headers count:', ths.length);
  console.log('First 6 column headers:', ths.slice(0, 6));

  // Check rows
  const trs = await page.$$eval('.historical-data-table tbody tr', els => els.map(e => {
    const tds = Array.from(e.querySelectorAll('td')).map(td => td.textContent.trim());
    return { row: tds[0], status: tds[1], operation: tds[2], company: tds[3], staffId: tds[4], memberName: tds[7] + ' ' + tds[8] };
  }));
  console.log('Rendered member rows count:', trs.length);
  console.log('Sample Row 1:', trs[0]);

  // Click on Step 3.3 UNLOCKED (the one from user screenshot!)
  console.log('\nClicking on Step 3.3 (UNLOCKED)...');
  const step33 = page.locator('.substep-item:has-text("UNLOCKED")').first();
  await step33.click();
  await page.waitForTimeout(1000);

  const isLegacyPresent = await page.locator('.legacy-snapshot-box').count();
  const isTablePresent = await page.locator('.historical-data-table').count();
  console.log('Step 3.3 UNLOCKED -> Legacy Milestone Box present?', isLegacyPresent > 0);
  console.log('Step 3.3 UNLOCKED -> Interactive Table present?', isTablePresent > 0);

  // Click on Step 3.1 LOCKED
  console.log('\nClicking on Step 3.1 (LOCKED)...');
  const step31 = page.locator('.substep-item:has-text("LOCKED")').first();
  await step31.click();
  await page.waitForTimeout(1000);
  const isTablePresent31 = await page.locator('.historical-data-table').count();
  console.log('Step 3.1 LOCKED -> Interactive Table present?', isTablePresent31 > 0);

  // Check download buttons
  const isDownloadSnapshotPresent = await page.locator('button:has-text("Download Snapshot")').count();
  console.log('Download Snapshot button present?', isDownloadSnapshotPresent > 0);

  // Save screenshot
  const screenshotPath = 'C:/Users/sayan.pramanick/.gemini/antigravity-ide/brain/7e1ea250-636e-45bc-85cd-3ccaeab0d7e9/audit_interactive_worksheet_live.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot to:', screenshotPath);

  await browser.close();
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
