const path = require('path');
const dataExchangeRoot = path.resolve('c:/ALL/OFFICE/data-exchange');
const dotenv = require('c:/ALL/OFFICE/data-exchange/node_modules/dotenv');
dotenv.config({ path: path.join(dataExchangeRoot, '.env.local') });
dotenv.config({ path: path.join(dataExchangeRoot, '.env') });

const { getPool } = require(path.join(dataExchangeRoot, 'src/db/sqlServer'));

async function updateTestRecords() {
  const pool = getPool();
  await pool.execute('UPDATE dbo.enrollment_file_metadata SET corp_id = 1422138 WHERE corp_id = 1422104');
  console.log('Updated test records to corp_id = 1422138');
  process.exit(0);
}

updateTestRecords().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
