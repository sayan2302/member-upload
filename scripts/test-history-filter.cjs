const path = require('path');
const dataExchangeRoot = path.resolve('c:/ALL/OFFICE/data-exchange');
const dotenv = require('c:/ALL/OFFICE/data-exchange/node_modules/dotenv');
dotenv.config({ path: path.join(dataExchangeRoot, '.env.local') });
dotenv.config({ path: path.join(dataExchangeRoot, '.env') });

const { getPool } = require(path.join(dataExchangeRoot, 'src/db/sqlServer'));

async function testHistoryParams(queryParams) {
  console.log('Testing with query params:', queryParams);
  const corpId = queryParams.corp_id ? parseInt(queryParams.corp_id, 10) : null;
  const role = String(queryParams.role || "").trim().toLowerCase();
  const limit = Math.min(Math.max(parseInt(queryParams.limit, 10) || 50, 1), 200);

  let subCorpIds = [];
  if (queryParams.sub_corporate_ids) {
    try {
      const parsed = typeof queryParams.sub_corporate_ids === "string" 
        ? JSON.parse(queryParams.sub_corporate_ids) 
        : queryParams.sub_corporate_ids;
      if (Array.isArray(parsed)) {
        subCorpIds = parsed.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n) && n > 0);
      }
    } catch (_) {}
  }

  const pool = getPool();
  let queryStr = `
    SELECT TOP ${limit}
      uuid,
      file_name,
      template_type,
      corp_id,
      pol_id,
      uploaded_by_email,
      uploaded_on,
      no_of_rows,
      valid_rows,
      invalid_rows,
      status,
      last_downloaded_on,
      last_downloaded_by_email
    FROM dbo.enrollment_file_metadata
    WHERE (is_archived = 0 OR is_archived IS NULL)
  `;

  const params = [];

  if (subCorpIds.length > 0) {
    const placeholders = subCorpIds.map(() => "?").join(", ");
    queryStr += ` AND corp_id IN (${placeholders})`;
    params.push(...subCorpIds);
  } else if (corpId !== null && !isNaN(corpId) && corpId > 0) {
    queryStr += ` AND corp_id = ?`;
    params.push(corpId);
  }

  queryStr += ` ORDER BY uploaded_on DESC`;

  console.log('SQL:', queryStr);
  console.log('Params:', params);
  const [rows] = await pool.execute(queryStr, params);
  console.log('Rows found:', rows ? rows.length : 0);
}

async function run() {
  await testHistoryParams({}); // no filter
  await testHistoryParams({ corp_id: '0' }); // corp_id = 0
  await testHistoryParams({ corp_id: '1422104' }); // corp_id = 1422104
  await testHistoryParams({ corp_id: '0', sub_corporate_ids: '[{"id":"0","name":"Corporate"}]' }); // sub_corporate_ids = [{id: 0}]
  process.exit(0);
}

run();
