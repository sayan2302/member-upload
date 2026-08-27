import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  console.log('Navigating to HR page...');
  await page.goto('http://localhost:5173/?role=hr&corp_id=1422104&provider_corp_id=1018900');
  await page.waitForTimeout(2000);

  const downloadPromise = page.waitForEvent('download', { timeout: 8000 }).catch(e => {
    console.log('Download wait timeout/failed:', e.message);
    return null;
  });

  console.log('Clicking Download Template button...');
  const downloadBtn = page.locator('button:has-text("Download Template")').first();
  await downloadBtn.click();

  const download = await downloadPromise;
  if (download) {
    console.log('Download initiated successfully:', download.suggestedFilename());
  } else {
    console.log('Download was NOT triggered.');
  }

  await browser.close();
}

test();
