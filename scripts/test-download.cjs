const path = require('path');
const dataExchangeRoot = path.resolve('c:/ALL/OFFICE/data-exchange');
const dotenv = require('c:/ALL/OFFICE/data-exchange/node_modules/dotenv');
dotenv.config({ path: path.join(dataExchangeRoot, '.env.local') });
dotenv.config({ path: path.join(dataExchangeRoot, '.env') });

const { getPool } = require(path.join(dataExchangeRoot, 'src/db/sqlServer'));
const s3 = require(path.join(dataExchangeRoot, 'src/utils/s3'));
const configService = require(path.join(dataExchangeRoot, 'src/config/config.service'));

async function testDownload() {
  console.log('Testing S3 download stream...');
  const pool = getPool();
  const [rows] = await pool.execute('SELECT TOP 1 * FROM dbo.enrollment_file_metadata ORDER BY uploaded_on DESC');
  if (!rows || rows.length === 0) {
    console.log('No metadata records found.');
    process.exit(0);
  }

  const record = rows[0];
  console.log('Testing download for UUID:', record.uuid, 'File:', record.file_name);
  console.log('S3 path:', record.s3_path);

  const bucket = configService.get('S3_BUCKET') || process.env.S3_BUCKET;
  const stream = await s3.streamFile(bucket, record.s3_path);

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  console.log(`✅ Successfully streamed file from S3! Downloaded size: ${buffer.length} bytes.`);
  process.exit(0);
}

testDownload().catch((err) => {
  console.error('Download test failed:', err);
  process.exit(1);
});
