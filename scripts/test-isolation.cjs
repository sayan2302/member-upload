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

async function runTests() {
  console.log('--- Multi-Tenant Security & Isolation Tests ---');

  // Test 1: Authorized HR for Corp 1422138
  const res1 = await testFetch('/api/uploads3/history?corp_id=1422138&role=hr');
  console.log('1. Corp 1422138 HR query -> Count:', res1.data.count, '(Expected: > 0)');

  // Test 2: Unrelated Corp HR (Corp 9999999)
  const res2 = await testFetch('/api/uploads3/history?corp_id=9999999&role=hr');
  console.log('2. Corp 9999999 HR query -> Count:', res2.data.count, '(Expected: 0)');

  // Test 3: Unauthorized query with no Corp ID
  const res3 = await testFetch('/api/uploads3/history?role=hr');
  console.log('3. HR query without Corp ID -> Count:', res3.data.count, '(Expected: 0, Blocked)');

  // Test 4: Group HR query with specific sub-corporates [1422138]
  const res4 = await testFetch('/api/uploads3/history?sub_corporate_ids=[1422138]&role=hr');
  console.log('4. Group HR sub-corporates [1422138] -> Count:', res4.data.count, '(Expected: > 0)');

  process.exit(0);
}

runTests().catch(console.error);
