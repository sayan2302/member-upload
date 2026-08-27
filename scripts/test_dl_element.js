import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body>
        <button id="btn1">Download with display none</button>
        <button id="btn2">Download with position fixed</button>
        <script>
          const makeBlob = () => {
            const b = new Blob(['test content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            return URL.createObjectURL(b);
          };

          document.getElementById('btn1').onclick = () => {
            const url = makeBlob();
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'test1.xlsx';
            document.body.appendChild(a);
            a.click();
          };

          document.getElementById('btn2').onclick = () => {
            const url = makeBlob();
            const a = document.createElement('a');
            a.style.position = 'fixed';
            a.style.top = '-9999px';
            a.style.left = '-9999px';
            a.href = url;
            a.download = 'test2.xlsx';
            document.body.appendChild(a);
            a.click();
          };
        </script>
      </body>
    </html>
  `);

  const dlPromise1 = page.waitForEvent('download', { timeout: 3000 }).catch(e => e.message);
  await page.click('#btn1');
  const res1 = await dlPromise1;
  console.log('Result 1 (display none):', typeof res1 === 'string' ? res1 : res1.suggestedFilename());

  const dlPromise2 = page.waitForEvent('download', { timeout: 3000 }).catch(e => e.message);
  await page.click('#btn2');
  const res2 = await dlPromise2;
  console.log('Result 2 (position fixed):', typeof res2 === 'string' ? res2 : res2.suggestedFilename());

  await browser.close();
}

test();
