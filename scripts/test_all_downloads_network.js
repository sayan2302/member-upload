import { chromium } from 'playwright';

async function verifyAllDownloads() {
  console.log('=== VERIFYING ALL DOWNLOAD BUTTONS & NETWORK HITS ===');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

  const networkHits = [];
  page.on('request', req => {
    if (req.url().includes('sample-csv') || req.url().includes('/download/') || req.url().includes('download-snapshot')) {
      console.log('-> API HIT (Request):', req.method(), req.url());
      networkHits.push(req.url());
    }
  });

  page.on('response', res => {
    if (res.url().includes('sample-csv') || res.url().includes('/download/') || res.url().includes('download-snapshot')) {
      console.log('<- API RESPONSE:', res.status(), res.url().split('?')[0]);
    }
  });

  // 1. Test Download Template
  console.log('\n1. Testing "Download Template" on Home/Upload page...');
  await page.goto('http://localhost:5173/?role=hr&corp_id=1422138&provider_corp_id=1422138');
  await page.waitForTimeout(1500);

  const tplDownloadPromise = page.waitForEvent('download', { timeout: 8000 });
  await page.locator('button:has-text("Download Template")').first().click();
  const tplDownload = await tplDownloadPromise;
  console.log('✔ Template Downloaded as:', tplDownload.suggestedFilename());

  // 2. Test Download Past Upload
  console.log('\n2. Testing "Download" on HR Past Uploads page...');
  await page.goto('http://localhost:5173/?role=hr&corp_id=1422138&provider_corp_id=1422138&view=history');
  await page.waitForTimeout(2000);

  const historyDownloadPromise = page.waitForEvent('download', { timeout: 8000 });
  await page.locator('button[title*="Download"]').first().click();
  const histDownload = await historyDownloadPromise;
  console.log('✔ History File Downloaded as:', histDownload.suggestedFilename());

  // 3. Test Audit Snapshot Download
  console.log('\n3. Testing "Download Snapshot (.xlsx)" on Audit Console...');
  await page.goto('http://localhost:5173/?role=broker&broker_id=120&view=audit&file_uuid=F650807E-2080-4614-9284-48C739349476');
  await page.waitForTimeout(2000);

  const auditDownloadPromise = page.waitForEvent('download', { timeout: 8000 });
  await page.locator('.toolbar-btn.is-download').first().click();
  const auditDownload = await auditDownloadPromise;
  console.log('✔ Audit Snapshot Downloaded as:', auditDownload.suggestedFilename());

  console.log('\n=== SUMMARY ===');
  console.log('Total API network hits captured:', networkHits.length);
  await browser.close();
}

verifyAllDownloads().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
