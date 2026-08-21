const fs = require('fs');
const path = require('path');
const http = require('http');

const dataExchangeRoot = path.resolve('c:/ALL/OFFICE/data-exchange');
const dotenv = require('c:/ALL/OFFICE/data-exchange/node_modules/dotenv');
dotenv.config({ path: path.join(dataExchangeRoot, '.env.local') });
dotenv.config({ path: path.join(dataExchangeRoot, '.env') });

const FormData = require('c:/ALL/OFFICE/data-exchange/node_modules/form-data');

async function testUploadAndHistory() {
  console.log('1. Simulating upload with corp_id=1422138...');
  const form = new FormData();
  
  // Create small dummy buffer for test Excel
  const buffer = Buffer.from('PK\x03\x04test_content');
  form.append('file', buffer, { filename: 'test_live_upload.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  form.append('corp_id', '1422138');
  form.append('role', 'hr');
  form.append('template_type', 'hr');
  form.append('no_of_rows', '10');
  form.append('valid_rows', '10');
  form.append('invalid_rows', '0');
  form.append('status', 'pending');

  const uploadReq = http.request({
    hostname: 'localhost',
    port: 8181,
    path: '/api/uploads3',
    method: 'POST',
    headers: {
      ...form.getHeaders(),
      'x-api-key': '82a10bc21e8699fc96dd9fe6f83d810127b9aa363a6a8adc4a0b330c24d0244f'
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      console.log('Upload Status:', res.statusCode);
      const json = JSON.parse(data);
      console.log('Uploaded Record UUID:', json.uuid, 'Corp ID:', json.corp_id);

      console.log('\n2. Fetching updated history for corp_id=1422138...');
      const histReq = http.request({
        hostname: 'localhost',
        port: 8181,
        path: '/api/uploads3/history?corp_id=1422138&role=hr',
        method: 'GET',
        headers: {
          'x-api-key': '82a10bc21e8699fc96dd9fe6f83d810127b9aa363a6a8adc4a0b330c24d0244f'
        }
      }, (hRes) => {
        let hData = '';
        hRes.on('data', chunk => hData += chunk);
        hRes.on('end', () => {
          const hJson = JSON.parse(hData);
          console.log('History Count now:', hJson.count);
          console.log('Latest file in history:', hJson.files[0]);
          process.exit(0);
        });
      });
      histReq.end();
    });
  });

  form.pipe(uploadReq);
}

testUploadAndHistory().catch(console.error);
