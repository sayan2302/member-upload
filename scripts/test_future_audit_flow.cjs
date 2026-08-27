const { chromium } = require('playwright');
const crypto = require('crypto');
require('c:/ALL/OFFICE/data-exchange/node_modules/dotenv').config({ path: 'c:/ALL/OFFICE/data-exchange/.env.example' });
const { getPool } = require('c:/ALL/OFFICE/data-exchange/src/db/sqlServer');

async function testFutureFlow() {
  const pool = getPool();
  const testUuid = crypto.randomUUID().toUpperCase();
  console.log('Testing fresh upload with UUID:', testUuid);

  // 1. Prepare sample row with real error
  const sampleSnapshot = {
    totalRows: 2,
    acceptedRows: 1,
    rejectedRows: 1,
    headers: ['operation', 'policy_no', 'company_name', 'staff_id_no', 'pih_member_no', 'first_name', 'dob'],
    rows: [
      {
        row: 1,
        sourceRow: 3,
        valid: true,
        values: {
          operation: 'Add',
          policy_no: 'POL-100',
          company_name: 'Acme Corp',
          staff_id_no: 'EMP-001',
          pih_member_no: 'PIH-999',
          first_name: 'John Doe',
          dob: '1990-01-01'
        },
        errors: []
      },
      {
        row: 2,
        sourceRow: 4,
        valid: false,
        values: {
          operation: 'Add',
          policy_no: 'POL-100',
          company_name: 'Acme Corp',
          staff_id_no: 'EMP-002',
          pih_member_no: '00056-03',
          first_name: 'Jane Error',
          dob: '1992-05-15'
        },
        errors: [
          {
            field: 'pih_member_no',
            message: 'User already exists with this policy and PIH member number in the system.'
          }
        ]
      }
    ]
  };

  // 2. Insert metadata & transaction logs simulating fresh broker upload with force ingestion
  await pool.execute(
    'INSERT INTO dbo.enrollment_file_metadata (uuid, file_name, s3_path, corp_id, status, no_of_rows, valid_rows, invalid_rows, has_errors, uploaded_by_email, uploaded_on, is_archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, GETDATE(), 0)',
    [testUuid, 'future_test.xlsx', 'test/future_test.xlsx', 1422104, 'approved', 2, 1, 1, 'broker@example.com']
  );

  await pool.execute(
    'INSERT INTO dbo.enrollment_transaction_log (file_uuid, action_code, user_id, details) VALUES (?, ?, ?, ?)',
    [testUuid, 'VALIDATION_FAILED', '120', JSON.stringify({ total_rows: 2, invalid_rows: 1, failed_at: new Date().toISOString(), worksheet_snapshot: sampleSnapshot })]
  );

  await pool.execute(
    'INSERT INTO dbo.enrollment_transaction_log (file_uuid, action_code, user_id, details) VALUES (?, ?, ?, ?)',
    [testUuid, 'BROKER_UPLOADED_FRESH', '120', JSON.stringify({ file_name: 'future_test.xlsx', corp_id: 1422104, worksheet_snapshot: sampleSnapshot })]
  );

  await pool.execute(
    'INSERT INTO dbo.enrollment_transaction_log (file_uuid, action_code, user_id, details) VALUES (?, ?, ?, ?)',
    [testUuid, 'FORCE_APPROVED_WITH_ERRORS', '120', JSON.stringify({ force_ingested: true, bypassed_errors: 1, records_inserted: 2, at: new Date().toISOString(), worksheet_snapshot: sampleSnapshot })]
  );

  await pool.execute(
    'INSERT INTO dbo.enrollment_transaction_log (file_uuid, action_code, user_id, details) VALUES (?, ?, ?, ?)',
    [testUuid, 'APPROVED', '120', JSON.stringify({ approved_at: new Date().toISOString(), worksheet_snapshot: sampleSnapshot })]
  );

  console.log('Database records created with worksheet_snapshot!');

  // 3. Inspect in Playwright
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  const targetUrl = 'http://localhost:5173/?role=broker&broker_id=120&view=audit&file_uuid=' + testUuid;
  console.log('Navigating to:', targetUrl);
  await page.goto(targetUrl);
  await page.waitForTimeout(3000);

  // Click on FORCE APPROVED WITH ERRORS
  const forceStep = await page.locator('text=FORCE APPROVED WITH ERRORS').first();
  if (await forceStep.isVisible()) {
    await forceStep.click();
    await page.waitForTimeout(1000);
  }

  // Check stats chips
  const totalText = await page.locator('.sheet-stat-chip').nth(0).innerText();
  const cleanText = await page.locator('.sheet-stat-chip').nth(1).innerText();
  const faultyText = await page.locator('.sheet-stat-chip').nth(2).innerText();
  console.log('Future stats chips:');
  console.log('-', totalText);
  console.log('-', cleanText);
  console.log('-', faultyText);

  // Check FAULTY status pill
  const faultyPill = await page.locator('.status-pill.is-error').first();
  console.log('FAULTY pill visible:', await faultyPill.isVisible());
  console.log('FAULTY pill text:', await faultyPill.innerText());

  // Check faulty cell
  const faultyCell = await page.locator('.cell-has-error').first();
  console.log('Cell with error visible:', await faultyCell.isVisible());
  console.log('Cell error title:', await faultyCell.getAttribute('title'));

  await page.screenshot({ path: 'c:/Users/sayan.pramanick/.gemini/antigravity-ide/brain/7e1ea250-636e-45bc-85cd-3ccaeab0d7e9/future_file_faulty_rendered.png' });
  console.log('Saved future_file_faulty_rendered.png');

  // Click Filter Faulty Only
  const filterBtn = await page.locator('.toolbar-btn').first();
  await filterBtn.click();
  await page.waitForTimeout(500);

  const visibleRows = await page.locator('.historical-data-table tbody tr').count();
  console.log('Visible rows when Filter Faulty Only is active:', visibleRows);

  await page.screenshot({ path: 'c:/Users/sayan.pramanick/.gemini/antigravity-ide/brain/7e1ea250-636e-45bc-85cd-3ccaeab0d7e9/future_file_filtered.png' });
  console.log('Saved future_file_filtered.png');

  await browser.close();
}

testFutureFlow().catch(console.error).finally(() => process.exit(0));
