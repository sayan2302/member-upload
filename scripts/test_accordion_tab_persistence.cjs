const { chromium } = require('playwright');

async function testPersistence() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  console.log('--- TEST 1: Broker View Accordion Persistence ---');
  await page.goto('http://localhost:5173/?role=broker&broker_id=120');
  await page.waitForTimeout(2500);

  // Find the two accordions:
  // 1) Associated Corporates & Policies (button index 0)
  // 2) File Submissions (button index 1)
  const corpToggle = page.locator('.history-title-toggle').nth(0);
  const fileSubToggle = page.locator('.history-title-toggle').nth(1);

  // Check initial state
  const isCorpExpandedBefore = await corpToggle.getAttribute('aria-expanded');
  const isFileSubExpandedBefore = await fileSubToggle.getAttribute('aria-expanded');
  console.log('Initial Corporate Expanded:', isCorpExpandedBefore);
  console.log('Initial File Submissions Expanded:', isFileSubExpandedBefore);

  // Ensure File Submissions is OPEN (aria-expanded === "true")
  if (isFileSubExpandedBefore !== 'true') {
    console.log('Expanding File Submissions...');
    await fileSubToggle.click();
    await page.waitForTimeout(400);
  }

  // Ensure Associated Corporates is OPEN (aria-expanded === "true")
  if (isCorpExpandedBefore !== 'true') {
    console.log('Expanding Associated Corporates...');
    await corpToggle.click();
    await page.waitForTimeout(400);
  }

  // Take screenshot before reload
  await page.screenshot({ path: 'c:/Users/sayan.pramanick/.gemini/antigravity-ide/brain/7e1ea250-636e-45bc-85cd-3ccaeab0d7e9/broker_accordions_opened.png' });
  console.log('Saved broker_accordions_opened.png');

  // RELOAD THE PAGE
  console.log('Reloading page...');
  await page.reload();
  await page.waitForTimeout(2500);

  // Verify states after reload
  const corpAfterReload = await page.locator('.history-title-toggle').nth(0).getAttribute('aria-expanded');
  const fileSubAfterReload = await page.locator('.history-title-toggle').nth(1).getAttribute('aria-expanded');
  console.log('After Reload - Corporate Expanded:', corpAfterReload);
  console.log('After Reload - File Submissions Expanded:', fileSubAfterReload);

  if (fileSubAfterReload !== 'true' || corpAfterReload !== 'true') {
    throw new Error('FAILED: Accordions did not remain open after reload!');
  }
  console.log('SUCCESS: Broker accordions remained open across reload!');
  await page.screenshot({ path: 'c:/Users/sayan.pramanick/.gemini/antigravity-ide/brain/7e1ea250-636e-45bc-85cd-3ccaeab0d7e9/broker_accordions_after_reload.png' });

  console.log('\n--- TEST 2: HR View Tab Persistence ---');
  await page.goto('http://localhost:5173/?role=hr&corp_id=1422104');
  await page.waitForTimeout(2500);

  // Initial tab should be 'upload'
  const uploadTab = page.locator('.upload-tab-btn').nth(0);
  const historyTab = page.locator('.upload-tab-btn').nth(1);

  console.log('Switching HR tab to Past Uploads...');
  await historyTab.click();
  await page.waitForTimeout(500);

  const isHistoryActiveBefore = await historyTab.getAttribute('aria-selected');
  console.log('Past Uploads aria-selected before reload:', isHistoryActiveBefore);

  // RELOAD THE PAGE
  console.log('Reloading HR page...');
  await page.reload();
  await page.waitForTimeout(2500);

  const isHistoryActiveAfter = await page.locator('.upload-tab-btn').nth(1).getAttribute('aria-selected');
  console.log('Past Uploads aria-selected after reload:', isHistoryActiveAfter);

  if (isHistoryActiveAfter !== 'true') {
    throw new Error('FAILED: HR Past Uploads tab did not persist across reload!');
  }
  console.log('SUCCESS: HR Past Uploads tab persisted across reload!');
  await page.screenshot({ path: 'c:/Users/sayan.pramanick/.gemini/antigravity-ide/brain/7e1ea250-636e-45bc-85cd-3ccaeab0d7e9/hr_tab_persisted_after_reload.png' });

  await browser.close();
  console.log('\nAll persistence tests PASSED successfully!');
}

testPersistence().catch(err => {
  console.error(err);
  process.exit(1);
});
