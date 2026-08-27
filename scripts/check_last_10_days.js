import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { getPool } = require('C:/ALL/OFFICE/data-exchange/src/db/sqlServer');

async function check() {
  const pool = await getPool();
  const [nowRows] = await pool.query('SELECT GETDATE() AS server_now');
  console.log('Server time (UTC/local):', nowRows[0].server_now);

  const [metaCount] = await pool.query(`
    SELECT COUNT(*) AS count,
           MIN(uploaded_on) AS earliest,
           MAX(uploaded_on) AS latest
    FROM dbo.enrollment_file_metadata
    WHERE uploaded_on >= DATEADD(day, -10, GETDATE())
  `);
  console.log('File Metadata (last 10 days):', metaCount[0]);

  const [txCount] = await pool.query(`
    SELECT COUNT(*) AS count,
           MIN(created_at) AS earliest,
           MAX(created_at) AS latest
    FROM dbo.enrollment_transaction_log
    WHERE created_at >= DATEADD(day, -10, GETDATE())
  `);
  console.log('Transaction Log (last 10 days):', txCount[0]);

  const [allMetaCount] = await pool.query('SELECT COUNT(*) as total FROM dbo.enrollment_file_metadata');
  const [allTxCount] = await pool.query('SELECT COUNT(*) as total FROM dbo.enrollment_transaction_log');
  console.log('Total all-time records -> Metadata:', allMetaCount[0].total, '| Transaction Log:', allTxCount[0].total);

  const [recentFiles] = await pool.query(`
    SELECT TOP 5 uuid, file_name, status, uploaded_on
    FROM dbo.enrollment_file_metadata
    WHERE uploaded_on >= DATEADD(day, -10, GETDATE())
    ORDER BY uploaded_on DESC
  `);
  console.log('Sample metadata rows that match:', recentFiles);

  process.exit(0);
}

check().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
