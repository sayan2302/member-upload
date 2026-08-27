async function test() {
  const res = await fetch('http://localhost:8181/api/uploads3/audit/F650807E-2080-4614-9284-48C739349476', {
    headers: { 'x-api-key': '82a10bc21e8699fc96dd9fe6f83d810127b9aa363a6a8adc4a0b330c24d0244f' }
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('File:', data.file?.file_name);
  console.log('Summary:', data.summary);
  console.log('Cycles count:', data.cycles?.length);
  if (data.cycles?.length > 0) {
    data.cycles.forEach((c, idx) => {
      console.log(`Cycle ${idx + 1}: ${c.cycle_label} [${c.cycle_status}] - Sub-transactions: ${c.sub_transactions.length}`);
      c.sub_transactions.forEach(s => console.log(`   Step ${s.sub_seq}: ${s.action_title} (${s.action_code}) at ${s.timestamp}`));
    });
  }
}
test();
