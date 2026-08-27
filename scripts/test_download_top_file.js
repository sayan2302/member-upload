import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { getPool } = require('C:/ALL/OFFICE/data-exchange/src/db/sqlServer');

async function test() {
  const pool = await getPool();
  const [rows] = await pool.query(`
    SELECT TOP 5 uuid, file_name, s3_path
    FROM dbo.enrollment_file_metadata
    WHERE corp_id = 1422138
    ORDER BY uploaded_on DESC
  `);
  console.log('Top files for 1422138:', rows);

  for (const file of rows) {
    const testUrl = 'http://localhost:8181/api/uploads3/download/' + file.uuid + '?role=hr';
    console.log('Testing download for:', file.file_name, 'UUID:', file.uuid);
    const res = await fetch(testUrl, {
      headers: { 'x-api-key': '82a10bc21e8699fc96dd9fe6f83d810127b9aa363a6a8adc4a0b330c24d0244f' }
    });
    console.log('-> Status:', res.status);
    if (!res.ok) {
      const errText = await res.text();
      console.log('-> Error response:', errText);
    } else {
      const buf = await res.arrayBuffer();
      console.log('-> Success! Byte length:', buf.byteLength);
    }
  }

  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
