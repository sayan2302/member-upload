import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

  page.on('console', msg => console.log('PAGE CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to HR history page...');
  await page.goto('http://localhost:5173/?role=hr&corp_id=1422138&provider_corp_id=1422138&view=history', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const downloadPromise = page.waitForEvent('download', { timeout: 6000 }).catch(e => {
    console.log('Download event timed out:', e.message);
    return null;
  });

  console.log('Clicking Download button in history table...');
  const dlBtn = page.locator('button[title*="Download"]').first();
  await dlBtn.click();

  const dl = await downloadPromise;
  if (dl) {
    console.log('Download received:', dl.suggestedFilename());
  } else {
    console.log('Download was NOT received by browser!');
  }
  await browser.close();
}

test();
