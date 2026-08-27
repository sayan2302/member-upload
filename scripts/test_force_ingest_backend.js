async function testConfig() {
  try {
    const res = await fetch('http://localhost:8181/api/uploads3/history?corp_id=1422104', {
      headers: { 'x-api-key': '82a10bc21e8699fc96dd9fe6f83d810127b9aa363a6a8adc4a0b330c24d0244f' }
    });
    console.log('Backend response status:', res.status);
    const data = await res.json();
    console.log('Backend history count:', Array.isArray(data) ? data.length : (data.files?.length || 0));
  } catch (err) {
    console.error('Backend test error:', err.message);
  }
}

testConfig();
