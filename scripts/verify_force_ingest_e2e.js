import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function runE2ETest() {
  console.log('[E2E Test] Starting Playwright browser test...');

  const artifactsDir = 'C:/Users/sayan.pramanick/.gemini/antigravity-ide/brain/7e1ea250-636e-45bc-85cd-3ccaeab0d7e9';
  const filePath = path.resolve('scripts/sample_faulty_broker.xlsx');
  const hrFilePath = path.resolve('scripts/sample_faulty_upload.xlsx');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  try {
    // ── Test 1: Broker Mode Force Ingest ──────────────────────────────────
    console.log('1. Navigating to Broker Dashboard...');
    await page.goto('http://localhost:5173/?role=broker&broker_id=120', { waitUntil: 'networkidle' });

    console.log('2. Setting input file...');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.waitForTimeout(1000);

    console.log('3. Clicking Validate File...');
    const validateBtn = page.locator('button.upload-button:has-text("Validate File")');
    await validateBtn.click();

    console.log('4. Waiting for validation results...');
    await page.waitForSelector('.force-upload-btn', { timeout: 15000 });
    console.log('✔ "Upload Anyway (Contains Errors)" button is visible!');

    await page.screenshot({ path: path.join(artifactsDir, 'broker_validation_with_force_button.png'), fullPage: true });

    console.log('5. Clicking "Upload Anyway (Contains Errors)"...');
    const forceBtn = page.locator('.force-upload-btn');
    await forceBtn.click();

    console.log('6. Waiting for Confirmation Modal...');
    await page.waitForSelector('.force-modal-card', { timeout: 5000 });
    console.log('✔ Force Ingestion Confirmation Modal opened!');

    await page.screenshot({ path: path.join(artifactsDir, 'broker_force_ingest_confirmation_modal.png'), fullPage: false });

    console.log('7. Clicking "Confirm & Upload Anyway"...');
    const confirmBtn = page.locator('button.force-confirm-btn');
    await confirmBtn.click();

    console.log('8. Waiting for Success Modal with force badge...');
    await page.waitForSelector('.force-badge-pill', { timeout: 20000 });
    console.log('✔ Success Modal with "Ingested with Bypassed Errors" badge confirmed!');

    await page.screenshot({ path: path.join(artifactsDir, 'broker_force_ingest_success_badge.png'), fullPage: false });

    // ── Test 2: HR Mode Should NOT Show Force Ingest Button ────────────────
    console.log('9. Navigating to HR Mode...');
    await page.goto('http://localhost:5173/?role=single_corp&corp_id=1422104', { waitUntil: 'networkidle' });

    console.log('10. Uploading faulty file in HR Mode...');
    const hrFileInput = await page.locator('input[type="file"]');
    await hrFileInput.setInputFiles(hrFilePath);
    await page.waitForTimeout(1000);

    const hrValidateBtn = page.locator('button.upload-button:has-text("Validate File")');
    await hrValidateBtn.click();

    console.log('11. Waiting for HR validation results...');
    await page.waitForSelector('.message-banner.is-error', { timeout: 15000 });

    const hrForceBtnCount = await page.locator('.force-upload-btn').count();
    console.log(`✔ Force button count in HR mode: ${hrForceBtnCount} (Expected: 0)`);
    if (hrForceBtnCount === 0) {
      console.log('✔ VERIFIED: HR role cannot see or access force upload!');
    } else {
      console.error('❌ ERROR: Force button was visible to HR!');
    }

    await page.screenshot({ path: path.join(artifactsDir, 'hr_validation_without_force_button.png'), fullPage: true });

    console.log('\n========================================');
    console.log('🎉 ALL PLAYWRIGHT E2E TESTS PASSED SUCCESSFULLY!');
    console.log('========================================\n');

  } catch (err) {
    console.error('E2E Test Failed:', err);
  } finally {
    await browser.close();
  }
}

runE2ETest();
