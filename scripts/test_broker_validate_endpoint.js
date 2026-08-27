import fs from 'fs';

async function checkValidate() {
  const filePath = 'C:/ALL/OFFICE/New Web Component/member-upload/scripts/sample_faulty_broker.xlsx';
  const fileBuffer = fs.readFileSync(filePath);

  const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fd = new FormData();
  fd.append('file', blob, 'sample_faulty_broker.xlsx');
  fd.append('role', 'broker');
  fd.append('corp_id', '1422104');
  fd.append('broker_id', '120');

  const res = await fetch('http://localhost:8181/api/broker/upload/validate', {
    method: 'POST',
    headers: {
      'x-api-key': '82a10bc21e8699fc96dd9fe6f83d810127b9aa363a6a8adc4a0b330c24d0244f',
      'x-user-id': '120'
    },
    body: fd
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response keys:', Object.keys(data));
  console.log('allowBrokerForceIngest:', data.allowBrokerForceIngest);
  console.log('summary:', data.summary);
}

checkValidate();
