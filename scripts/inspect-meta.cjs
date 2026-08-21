const path = require('path');
const dataExchangeRoot = path.resolve('c:/ALL/OFFICE/data-exchange');
const dotenv = require('c:/ALL/OFFICE/data-exchange/node_modules/dotenv');
dotenv.config({ path: path.join(dataExchangeRoot, '.env.local') });
dotenv.config({ path: path.join(dataExchangeRoot, '.env') });

const { getPool } = require(path.join(dataExchangeRoot, 'src/db/sqlServer'));

async function inspectEnrolmentMeta() {
  const pool = getPool();
  const [rows] = await pool.execute(
    "SELECT id, mapping_name, crop_id, pol_id, field_mapping FROM dbo.enrolment_meta"
  );
  for (const r of rows) {
    console.log(`\nMapping [${r.id}] - Name: ${r.mapping_name}, Corp: ${r.crop_id}, Pol: ${r.pol_id}`);
    try {
      const parsed = JSON.parse(r.field_mapping);
      const fields = parsed.field_mapping || [];
      console.log(`Fields (${fields.length}):`);
      fields.slice(0, 5).forEach((f, idx) => console.log(`  ${idx + 1}. name: "${f.name}", dbCol: "${f.db_col}", default: ${JSON.stringify(f.default)}`));
    } catch (e) {
      console.log('Error parsing JSON:', e.message);
    }
  }
  process.exit(0);
}

inspectEnrolmentMeta().catch(console.error);
