const path = require('path');
const dataExchangeRoot = path.resolve('c:/ALL/OFFICE/data-exchange');
const dotenv = require('c:/ALL/OFFICE/data-exchange/node_modules/dotenv');
dotenv.config({ path: path.join(dataExchangeRoot, '.env.local') });
dotenv.config({ path: path.join(dataExchangeRoot, '.env') });

const { getPool } = require(path.join(dataExchangeRoot, 'src/db/sqlServer'));

async function testHistoryQuery() {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT TOP 10 uuid, file_name, template_type, corp_id, status, uploaded_on
       FROM dbo.enrollment_file_metadata
       ORDER BY uploaded_on DESC`
    );
    console.log('History records:', rows);
    process.exit(0);
  } catch (err) {
    console.error('History query error:', err.message);
    process.exit(1);
  }
}

testHistoryQuery();
