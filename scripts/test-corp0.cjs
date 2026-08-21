const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8181,
  path: '/api/uploads3/history?corp_id=0&sub_corporate_ids=[0]',
  method: 'GET',
  headers: {
    'x-api-key': '82a10bc21e8699fc96dd9fe6f83d810127b9aa363a6a8adc4a0b330c24d0244f'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', data);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`Problem: ${e.message}`, e.code);
  process.exit(1);
});

req.end();
