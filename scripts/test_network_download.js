import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  page.on('request', req => {
    if (req.url().includes('download') || req.url().includes('sample-csv')) {
      console.log('NETWORK HIT:', req.method(), req.url());
    }
  });

  page.on('response', res => {
    if (res.url().includes('download') || res.url().includes('sample-csv')) {
      console.log('NETWORK RESPONSE:', res.status(), res.url());
    }
  });

  console.log('Navigating to HR history...');
  await page.goto('http://localhost:5173/?role=hr&corp_id=1422138&provider_corp_id=1422138&view=history');
  await page.waitForTimeout(2000);

  const dlPromise = page.waitForEvent('download', { timeout: 8000 });
  console.log('Clicking Download button...');
  const btn = page.locator('button[title*="Download"]').first();
  await btn.click();

  const dl = await dlPromise;
  console.log('Downloaded filename:', dl.suggestedFilename());

  await browser.close();
}

test();
