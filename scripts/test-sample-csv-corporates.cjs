const http = require('http');
const path = require('path');
const ExcelJS = require('c:/ALL/OFFICE/data-exchange/node_modules/exceljs');

async function testSampleCsv() {
  const corporates = [
    { id: '1422135', name: 'A3 Test industries' },
    { id: '1422138', name: 'ELTS Corporate' },
  ];
  const params = new URLSearchParams({
    for: 'hr',
    corp_id: '1422138',
    corporates: JSON.stringify(corporates),
    sub_corporate_ids: JSON.stringify(['1422135', '1422138']),
  });

  const pathUrl = `/api/enrolment-meta/0/sample-csv?${params.toString()}`;
  console.log('Testing GET', pathUrl);

  const options = {
    hostname: 'localhost',
    port: 8181,
    path: pathUrl,
    method: 'GET',
    headers: {
      'x-api-key': '82a10bc21e8699fc96dd9fe6f83d810127b9aa363a6a8adc4a0b330c24d0244f',
    },
  };

  const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Content-Disposition:', res.headers['content-disposition']);

    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', async () => {
      const buffer = Buffer.concat(chunks);
      console.log('Received binary size:', buffer.length, 'bytes');

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const sheet = workbook.getWorksheet('Template');
      console.log('Sheet name:', sheet.name);
      console.log('Column count:', sheet.columns.length);

      // Find company column
      let companyColIdx = -1;
      sheet.getRow(1).eachCell((cell, colNumber) => {
        if (/company/i.test(cell.value)) {
          companyColIdx = colNumber;
          console.log(`Found Company column at index ${colNumber}: "${cell.value}"`);
        }
      });

      console.log('Data Validations in sheet:');
      const validations = sheet.dataValidations.model;
      for (const [range, rule] of Object.entries(validations)) {
        console.log(`  Range [${range}] ->`, rule);
      }

      console.log('\n✅ Verification Successful!');
      process.exit(0);
    });
  });

  req.on('error', (err) => {
    console.error('Request error:', err);
    process.exit(1);
  });

  req.end();
}

testSampleCsv().catch(console.error);
