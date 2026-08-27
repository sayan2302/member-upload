import { chromium } from 'playwright';
import path from 'path';

async function diagnose() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('[PAGE LOG]', msg.type(), msg.text()));
  page.on('response', async res => {
    if (res.url().includes('validate') || res.url().includes('upload')) {
      console.log('[NETWORK RESPONSE]', res.status(), res.url());
      try {
        const text = await res.text();
        console.log('[RESPONSE BODY snippet]', text.substring(0, 300));
      } catch (_) {}
    }
  });

  const filePath = path.resolve('scripts/sample_faulty_broker.xlsx');
  await page.goto('http://localhost:5173/?role=broker&broker_id=120', { waitUntil: 'networkidle' });

  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
  await page.waitForTimeout(1000);

  const validateBtn = page.locator('button.upload-button:has-text("Validate File")');
  await validateBtn.click();

  await page.waitForTimeout(4000);

  const artifactsDir = 'C:/Users/sayan.pramanick/.gemini/antigravity-ide/brain/7e1ea250-636e-45bc-85cd-3ccaeab0d7e9';
  await page.screenshot({ path: path.join(artifactsDir, 'diagnose_screen.png'), fullPage: true });

  await browser.close();
}

diagnose();
