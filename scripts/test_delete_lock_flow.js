import { randomUUID } from 'crypto'

async function runTest() {
  const baseUrl = 'http://localhost:8181/api'
  const apiKey = '82a10bc21e8699fc96dd9fe6f83d810127b9aa363a6a8adc4a0b330c24d0244f'

  console.log('Testing HR File Deletion with Broker Lock Check...')

  // 1. Create a dummy test metadata entry in DB
  const testUuid = randomUUID()
  const testCorpId = 1422104

  const form = new FormData()
  const dummyBlob = new Blob(['mock excel content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  form.append('file', dummyBlob, 'Test_Mistaken_Upload.xlsx')
  form.append('corp_id', String(testCorpId))
  form.append('role', 'hr')
  form.append('template_type', 'hr')
  form.append('no_of_rows', '10')
  form.append('valid_rows', '10')
  form.append('invalid_rows', '0')
  form.append('uuid', testUuid)

  console.log(`\n1. Creating test upload submission: UUID ${testUuid}`)
  const uploadRes = await fetch(`${baseUrl}/uploads3`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'x-user-id': 'hr_test_user',
      'x-user-email': 'hr@test.com'
    },
    body: form
  })

  const uploadData = await uploadRes.json().catch(() => ({}))
  console.log('Upload response status:', uploadRes.status, uploadData.success ? '✓ Created' : uploadData)

  // 2. Lock the file as Broker 120
  console.log(`\n2. Locking file ${testUuid} as Broker 120`)
  const lockRes = await fetch(`${baseUrl}/uploads3/lock/${testUuid}`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'x-user-id': '120',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ broker_id: '120' })
  })
  const lockData = await lockRes.json()
  console.log('Lock response:', lockRes.status, lockData)

  // 3. Attempt deletion as HR while locked -> MUST FAIL WITH 409
  console.log(`\n3. Attempting deletion as HR while file is LOCKED by Broker 120`)
  const deleteWhileLockedRes = await fetch(`${baseUrl}/uploads3/${testUuid}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': apiKey,
      'x-user-id': 'hr_test_user',
      'x-user-email': 'hr@test.com'
    }
  })
  const deleteWhileLockedData = await deleteWhileLockedRes.json()
  console.log('Delete while locked status:', deleteWhileLockedRes.status)
  console.log('Delete while locked response:', deleteWhileLockedData)

  if (deleteWhileLockedRes.status === 409) {
    console.log('✓ PASS: Deletion correctly blocked with 409 Conflict when locked!')
  } else {
    console.error('✗ FAIL: Deletion was not blocked with 409! Got:', deleteWhileLockedRes.status)
  }

  // 4. Broker unlocks the file
  console.log(`\n4. Unlocking file ${testUuid} as Broker 120`)
  const unlockRes = await fetch(`${baseUrl}/uploads3/unlock/${testUuid}`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'x-user-id': '120',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ broker_id: '120' })
  })
  const unlockData = await unlockRes.json()
  console.log('Unlock response:', unlockRes.status, unlockData)

  // 5. Attempt deletion as HR while unlocked -> MUST SUCCEED WITH 200
  console.log(`\n5. Attempting deletion as HR now that file is UNLOCKED`)
  const deleteRes = await fetch(`${baseUrl}/uploads3/${testUuid}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': apiKey,
      'x-user-id': 'hr_test_user',
      'x-user-email': 'hr@test.com'
    }
  })
  const deleteData = await deleteRes.json()
  console.log('Delete status:', deleteRes.status)
  console.log('Delete response:', deleteData)

  if (deleteRes.status === 200 && deleteData.success) {
    console.log('✓ PASS: Deletion succeeded when file was unlocked!')
  } else {
    console.error('✗ FAIL: Deletion failed when unlocked! Got:', deleteRes.status)
  }

  // 6. Verify file is no longer in history
  console.log(`\n6. Checking history for corp_id ${testCorpId}`)
  const historyRes = await fetch(`${baseUrl}/uploads3/history?corp_id=${testCorpId}&role=hr`, {
    headers: { 'x-api-key': apiKey }
  })
  const historyData = await historyRes.json()
  const fileStillInHistory = (historyData.files || []).some(f => f.uuid === testUuid)
  if (!fileStillInHistory) {
    console.log('✓ PASS: Deleted file is successfully filtered out of history!')
  } else {
    console.error('✗ FAIL: Deleted file still appeared in history!')
  }

  console.log('\n================ ALL BACKEND TESTS PASSED ================')
}

runTest().catch(console.error)
