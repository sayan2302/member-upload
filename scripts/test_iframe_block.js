import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:5173/?role=hr&corp_id=1422138&provider_corp_id=1422138');
  await page.waitForTimeout(1500);

  const btn = page.locator('button:has-text("Download Template")').first();
  await btn.click();
  await page.waitForTimeout(3000);

  await browser.close();
}

test();
