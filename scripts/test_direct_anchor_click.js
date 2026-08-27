import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body>
        <button id="btn">Download Template</button>
        <script>
          document.getElementById('btn').onclick = () => {
            const url = 'http://localhost:8181/api/enrolment-meta/0/sample-csv?for=hr&corp_id=1422138';
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'Member_Upload_Template_HR.xlsx';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => a.remove(), 1000);
          };
        </script>
      </body>
    </html>
  `);

  const dlPromise = page.waitForEvent('download', { timeout: 6000 });
  await page.click('#btn');
  const dl = await dlPromise;
  console.log('Direct click suggested filename:', dl.suggestedFilename());
  const path = await dl.path();
  console.log('Saved to:', path);
  await browser.close();
}

test();
