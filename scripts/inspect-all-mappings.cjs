const path = require('path');
const dataExchangeRoot = path.resolve('c:/ALL/OFFICE/data-exchange');
const dotenv = require('c:/ALL/OFFICE/data-exchange/node_modules/dotenv');
dotenv.config({ path: path.join(dataExchangeRoot, '.env.local') });
dotenv.config({ path: path.join(dataExchangeRoot, '.env') });

const { getPool } = require(path.join(dataExchangeRoot, 'src/db/sqlServer'));

async function inspectAllMappings() {
  const pool = getPool();
  const [rows] = await pool.execute(
    "SELECT id, mapping_name, crop_id, pol_id, is_enabled, updated_at FROM dbo.enrolment_meta"
  );
  console.log(`Found ${rows.length} mappings in dbo.enrolment_meta:`);
  console.table(rows);
  process.exit(0);
}

inspectAllMappings().catch(console.error);
