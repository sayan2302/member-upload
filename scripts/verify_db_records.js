import { getPool } from 'c:/ALL/OFFICE/data-exchange/src/db/sqlServer.js';

async function verifyDB() {
  console.log('[DB Verification] Connecting to SQL Server...');
  const pool = await getPool();

  console.log('\n--- Latest 3 Transaction Logs ---');
  const [logs] = await pool.query(
    `SELECT TOP 3 id, file_uuid, action_code, user_id, details, created_at
     FROM dbo.enrollment_transaction_log
     ORDER BY id DESC`
  );
  console.log(JSON.stringify(logs, null, 2));

  console.log('\n--- Latest 3 Data Table Ingested Rows ---');
  const [rows] = await pool.query(
    `SELECT TOP 3 id, first_name, last_name, emp_id, ref_file, remarks_comments, uploaded_by, uploaded_on
     FROM dbo.data_table
     ORDER BY id DESC`
  );
  console.log(JSON.stringify(rows, null, 2));
}

verifyDB().then(() => process.exit(0)).catch(err => {
  console.error('DB Verify Error:', err);
  process.exit(1);
});
