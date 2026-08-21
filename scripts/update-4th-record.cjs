const path = require('path');
const dataExchangeRoot = path.resolve('c:/ALL/OFFICE/data-exchange');
const dotenv = require('c:/ALL/OFFICE/data-exchange/node_modules/dotenv');
dotenv.config({ path: path.join(dataExchangeRoot, '.env.local') });
dotenv.config({ path: path.join(dataExchangeRoot, '.env') });

const { getPool } = require(path.join(dataExchangeRoot, 'src/db/sqlServer'));

async function update4thRecord() {
  const pool = getPool();
  await pool.execute(
    "UPDATE dbo.enrollment_file_metadata SET corp_id = 1422138 WHERE uuid = '3A29BDBA-B6DD-4099-BD1B-D4C8D3DED1B0' OR corp_id = 1422104"
  );
  console.log('✅ Updated record to corp_id = 1422138');
  process.exit(0);
}

update4thRecord().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
