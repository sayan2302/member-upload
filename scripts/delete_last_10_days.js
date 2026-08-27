import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { getPool, getTransaction } = require('C:/ALL/OFFICE/data-exchange/src/db/sqlServer');

async function executeDeletion() {
  console.log('=== EXECUTING DELETION OF LAST 10 DAYS DATA ===');
  const pool = await getPool();

  // 1. Check current counts before deletion
  const [preMeta] = await pool.query(`
    SELECT COUNT(*) AS count FROM dbo.enrollment_file_metadata
    WHERE uploaded_on >= DATEADD(day, -10, GETDATE())
  `);
  const [preTx] = await pool.query(`
    SELECT COUNT(*) AS count FROM dbo.enrollment_transaction_log
    WHERE created_at >= DATEADD(day, -10, GETDATE())
  `);

  console.log(`Pre-deletion counts -> Metadata: ${preMeta[0].count} rows | Transaction Log: ${preTx[0].count} rows`);

  // 2. Delete from transaction log first (foreign key / dependency order)
  const txDeleteResult = await pool.query(`
    DELETE FROM dbo.enrollment_transaction_log
    WHERE created_at >= DATEADD(day, -10, GETDATE())
  `);
  console.log('✔ Deleted from dbo.enrollment_transaction_log');

  // 3. Delete from file metadata
  const metaDeleteResult = await pool.query(`
    DELETE FROM dbo.enrollment_file_metadata
    WHERE uploaded_on >= DATEADD(day, -10, GETDATE())
  `);
  console.log('✔ Deleted from dbo.enrollment_file_metadata');

  // 4. Verify post-deletion counts
  const [postMeta] = await pool.query(`
    SELECT COUNT(*) AS count FROM dbo.enrollment_file_metadata
    WHERE uploaded_on >= DATEADD(day, -10, GETDATE())
  `);
  const [postTx] = await pool.query(`
    SELECT COUNT(*) AS count FROM dbo.enrollment_transaction_log
    WHERE created_at >= DATEADD(day, -10, GETDATE())
  `);

  const [totalMeta] = await pool.query('SELECT COUNT(*) AS total FROM dbo.enrollment_file_metadata');
  const [totalTx] = await pool.query('SELECT COUNT(*) AS total FROM dbo.enrollment_transaction_log');

  console.log('=== DELETION COMPLETE ===');
  console.log(`Remaining last 10 days -> Metadata: ${postMeta[0].count} | Transaction Log: ${postTx[0].count}`);
  console.log(`Total rows remaining in table -> Metadata: ${totalMeta[0].total} | Transaction Log: ${totalTx[0].total}`);

  process.exit(0);
}

executeDeletion().catch(err => {
  console.error('Error during deletion:', err);
  process.exit(1);
});
