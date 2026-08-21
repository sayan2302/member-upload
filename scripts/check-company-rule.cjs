const http = require('http');
const ExcelJS = require('c:/ALL/OFFICE/data-exchange/node_modules/exceljs');

async function testCompanyValidation() {
  const corporates = [
    { id: '1422135', name: 'A3 Test industries' },
    { id: '1422138', name: 'ELTS Corporate' },
  ];
  const params = new URLSearchParams({
    for: 'hr',
    corp_id: '1422138',
    corporates: JSON.stringify(corporates),
  });

  const options = {
    hostname: 'localhost',
    port: 8181,
    path: `/api/enrolment-meta/0/sample-csv?${params.toString()}`,
    method: 'GET',
    headers: {
      'x-api-key': '82a10bc21e8699fc96dd9fe6f83d810127b9aa363a6a8adc4a0b330c24d0244f',
    },
  };

  const req = http.request(options, (res) => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Header Filename:', res.headers['content-disposition']);

    const chunks = [];
    res.on('data', (c) => chunks.push(c));
    res.on('end', async () => {
      const buffer = Buffer.concat(chunks);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);
      const ws = wb.getWorksheet('Template');
      
      // Find Column for Company
      let companyColLetter = null;
      ws.getRow(1).eachCell((cell, colNumber) => {
        if (/company/i.test(cell.value)) {
          companyColLetter = ws.getColumn(colNumber).letter;
          console.log(`Column ${companyColLetter} is "${cell.value}"`);
        }
      });

      const validations = ws.dataValidations.model;
      const companyRules = Object.entries(validations).filter(([range]) => range.startsWith(companyColLetter));
      console.log(`Company column rules count: ${companyRules.length}`);
      if (companyRules.length > 0) {
        console.log('Sample Company rule:', companyRules[0]);
      }
      process.exit(0);
    });
  });
  req.end();
}

testCompanyValidation();
