const path = require('path');
const dataExchangeRoot = path.resolve('c:/ALL/OFFICE/data-exchange');
const dotenv = require('c:/ALL/OFFICE/data-exchange/node_modules/dotenv');
dotenv.config({ path: path.join(dataExchangeRoot, '.env.local') });
dotenv.config({ path: path.join(dataExchangeRoot, '.env') });

const { getPool } = require(path.join(dataExchangeRoot, 'src/db/sqlServer'));
const s3 = require(path.join(dataExchangeRoot, 'src/utils/s3'));
const { HeadObjectCommand } = require('c:/ALL/OFFICE/data-exchange/node_modules/@aws-sdk/client-s3');

async function checkStatus() {
  console.log('====================================================');
  console.log('🔍 Checking Enrollment Metadata & S3 File Storage');
  console.log('====================================================\n');

  // ── 1. Query Database Table ────────────────────────────────────────────────
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT TOP 10 
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
         s3_path, 
         status 
       FROM dbo.enrollment_file_metadata 
       ORDER BY uploaded_on DESC`
    );

    console.log(`📊 DB Table [dbo.enrollment_file_metadata] — Found ${rows ? rows.length : 0} record(s):\n`);

    if (!rows || rows.length === 0) {
      console.log('   (No uploads found in enrollment_file_metadata table yet)');
    } else {
      for (const row of rows) {
        console.log(`----------------------------------------------------`);
        console.log(`UUID           : ${row.uuid}`);
        console.log(`File Name      : ${row.file_name}`);
        console.log(`Template Type  : ${row.template_type}`);
        console.log(`Corporate ID   : ${row.corp_id}`);
        console.log(`Uploaded By    : ${row.uploaded_by_email}`);
        console.log(`Uploaded On    : ${row.uploaded_on}`);
        console.log(`Status         : ${row.status}`);
        console.log(`Rows (Valid/Tot): ${row.valid_rows} / ${row.no_of_rows}`);
        console.log(`S3 Path        : ${row.s3_path}`);
      }
      console.log(`----------------------------------------------------\n`);
    }
  } catch (dbErr) {
    console.error('❌ DB Error:', dbErr.message);
  }

  // ── 2. List recent files in S3 bucket prefix ───────────────────────────────
  if (s3.isS3Configured()) {
    try {
      console.log(`☁️  Listing files in S3 Bucket under [${s3.getValidationUploadPath()}]...`);
      const list = await s3.listValidationFiles({ maxKeys: 10 });
      if (list && list.files && list.files.length > 0) {
        console.log(`Found ${list.files.length} file(s) in S3:`);
        list.files.forEach((f, idx) => {
          console.log(`  ${idx + 1}. ${f.originalName} (${f.size_bytes} bytes)`);
          console.log(`     S3 Key: ${f.key}`);
          console.log(`     Uploaded On: ${f.uploadedOn}`);
        });
      } else {
        console.log('  (No validation files found under the prefix)');
      }
    } catch (s3ListErr) {
      console.log('  S3 listing notice:', s3ListErr.message);
    }
  } else {
    console.log('\n⚠️ S3 is not configured in environment variables.');
  }

  console.log('\n====================================================');
  process.exit(0);
}

checkStatus();
