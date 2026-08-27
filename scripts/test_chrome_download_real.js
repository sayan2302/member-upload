import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('CONSOLE:', msg.text()));

  await page.goto('http://localhost:5173/?role=hr&corp_id=1422138&provider_corp_id=1422138');
  await page.waitForTimeout(2000);

  const downloadPromise = page.waitForEvent('download', { timeout: 6000 });
  await page.locator('button:has-text("Download Template")').first().click();

  const dl = await downloadPromise;
  console.log('Downloaded filename in real Chrome:', dl.suggestedFilename());
  const path = await dl.path();
  console.log('Saved to temp path:', path);
  await browser.close();
}

test();
