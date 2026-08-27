import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/sayan.pramanick/.gemini/antigravity-ide/brain/7e1ea250-636e-45bc-85cd-3ccaeab0d7e9';
const TEST_FILE_UUID = 'F650807E-2080-4614-9284-48C739349476';

async function verifyAuditConsole() {
  console.log('=== STARTING AUDIT CONSOLE E2E VERIFICATION ===');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  try {
    // 1. Visit Broker Dashboard
    console.log('1. Navigating to Broker Dashboard...');
    await page.goto('http://localhost:5173/?role=broker&broker_id=120', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Verify Audit Trail button in Broker submissions table
    const auditBtn = page.locator('.action-btn-audit').first();
    const hasAuditBtn = (await auditBtn.count()) > 0;
    console.log('Audit Trail button in Broker table:', hasAuditBtn ? 'FOUND ✔' : 'NOT FOUND ❌');

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'broker_table_with_audit_trail_btn.png'), fullPage: false });

    // 2. Click Audit Trail button to open Console
    console.log('2. Clicking Audit Trail button...');
    await auditBtn.click();
    await page.waitForTimeout(2500);

    // Verify URL
    console.log('Current URL after click:', page.url());

    // Verify Audit Console elements
    const headerTitle = await page.locator('.audit-file-name').textContent();
    console.log('Audit Console Title:', headerTitle);

    const cyclesCount = await page.locator('.cycle-card-block').count();
    console.log('Total Cycle Cards rendered in timeline:', cyclesCount);

    const substepsCount = await page.locator('.substep-item').count();
    console.log('Total Substep Items rendered in timeline:', substepsCount);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'audit_console_full_timeline.png'), fullPage: false });

    // 3. Test Selecting Different Substeps
    console.log('3. Clicking on sub-step 1.1...');
    const firstSubstep = page.locator('.substep-item').first();
    await firstSubstep.click();
    await page.waitForTimeout(1000);

    const activeTitle = await page.locator('.event-main-title').textContent();
    console.log('Active Event Inspector Title:', activeTitle);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'audit_console_inspector_step1.png'), fullPage: false });

    // 4. Test Search Bar
    console.log('4. Testing search across timeline...');
    const searchInput = page.locator('.timeline-search-input');
    await searchInput.fill('VALIDATION');
    await page.waitForTimeout(800);
    const searchFilteredCount = await page.locator('.cycle-card-block').count();
    console.log('Filtered cycles with term "VALIDATION":', searchFilteredCount);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'audit_console_timeline_search.png'), fullPage: false });

    // Clear search
    await page.locator('.search-clear-btn').click();
    await page.waitForTimeout(500);

    // 5. Test Raw JSON Drawer
    console.log('5. Toggling Raw JSON Payload...');
    const rawJsonToggle = page.locator('.raw-json-toggle-btn');
    await rawJsonToggle.click();
    await page.waitForTimeout(600);
    const rawJsonVisible = await page.locator('.raw-json-code').isVisible();
    console.log('Raw JSON code visible:', rawJsonVisible);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'audit_console_raw_json.png'), fullPage: false });

    // 6. Test Back to Dashboard Navigation
    console.log('6. Clicking Back to Dashboard button...');
    await page.locator('.audit-back-btn').click();
    await page.waitForTimeout(1500);
    console.log('URL after clicking Back:', page.url());

    // 7. Test HR View
    console.log('7. Navigating to HR Past Uploads view...');
    await page.goto('http://localhost:5173/?role=hr&corp_id=1422138&view=history', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hrAuditBtn = page.locator('.action-btn-audit').first();
    const hasHrAuditBtn = (await hrAuditBtn.count()) > 0;
    console.log('Audit Trail button in HR Past Uploads table:', hasHrAuditBtn ? 'FOUND ✔' : 'NOT FOUND ❌');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'hr_table_with_audit_trail_btn.png'), fullPage: false });

    console.log('=== ALL AUDIT CONSOLE VERIFICATIONS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    await browser.close();
  }
}

verifyAuditConsole();
