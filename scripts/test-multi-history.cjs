const http = require('http');

async function testFetch(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8181,
      path: path,
      method: 'GET',
      headers: {
        'x-api-key': '82a10bc21e8699fc96dd9fe6f83d810127b9aa363a6a8adc4a0b330c24d0244f'
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, data: JSON.parse(data) });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('Testing /api/uploads3/history?role=hr (no restrictive corp_id):');
  const res1 = await testFetch('/api/uploads3/history?role=hr');
  console.log('Status:', res1.status, 'Count:', res1.data.count, 'Files:', res1.data.files.map(f => ({ file: f.fileName, corpId: f.corpId })));

  console.log('\nTesting /api/uploads3/history?corp_id=1422104&role=hr:');
  const res2 = await testFetch('/api/uploads3/history?corp_id=1422104&role=hr');
  console.log('Status:', res2.status, 'Count:', res2.data.count);

  console.log('\nTesting /api/uploads3/history?corp_id=1422138&role=hr:');
  const res3 = await testFetch('/api/uploads3/history?corp_id=1422138&role=hr');
  console.log('Status:', res3.status, 'Count:', res3.data.count);

  process.exit(0);
}

main().catch(console.error);
