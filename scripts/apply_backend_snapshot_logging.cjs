const fs = require('fs');
const path = require('path');

const uploads3Path = 'c:/ALL/OFFICE/data-exchange/src/routes/uploads3.js';
const validatePath = 'c:/ALL/OFFICE/data-exchange/src/routes/validate.js';

function patchUploads3() {
  let code = fs.readFileSync(uploads3Path, 'utf8');

  // 1. Add getLatestFileSnapshot helper function if not already present
  if (!code.includes('async function getLatestFileSnapshot(')) {
    const helperFunc = `
async function getLatestFileSnapshot(pool, fileUuid) {
  try {
    const [rows] = await pool.execute(
      \`SELECT TOP 1 details
       FROM dbo.enrollment_transaction_log
       WHERE file_uuid = ? AND details LIKE '%"worksheet_snapshot"%'
       ORDER BY id DESC\`,
      [fileUuid]
    );
    if (rows && rows[0] && rows[0].details) {
      const parsed = typeof rows[0].details === 'string' ? JSON.parse(rows[0].details) : rows[0].details;
      if (parsed && parsed.worksheet_snapshot) {
        return parsed.worksheet_snapshot;
      }
    }
  } catch (err) {
    logger.warn(\`[uploads3] getLatestFileSnapshot error for \${fileUuid}:\`, err.message);
  }
  return null;
}
`;
    // Insert after multer upload setup
    code = code.replace(
      'const upload = multer({',
      helperFunc + '\nconst upload = multer({'
    );
  }

  // 2. In POST /upload, parse clientSnapshot from req.body.worksheet_snapshot
  if (!code.includes('let clientSnapshot = null;')) {
    const clientSnapshotParse = `
    let clientSnapshot = null;
    if (req.body.worksheet_snapshot) {
      try {
        clientSnapshot = typeof req.body.worksheet_snapshot === "string"
          ? JSON.parse(req.body.worksheet_snapshot)
          : req.body.worksheet_snapshot;
      } catch (_) {}
    }
`;
    code = code.replace(
      '    const isBrokerUpload = role === "broker"',
      clientSnapshotParse + '    const isBrokerUpload = role === "broker"'
    );

    // Patch VALIDATION_PASSED in POST /upload
    code = code.replace(
      `[uuid, userId, JSON.stringify({ total_rows: recordsInserted || noOfRows, valid_rows: recordsInserted || validRows, validated_at: uploadedOn.toISOString() })]`,
      `[uuid, userId, JSON.stringify({ total_rows: recordsInserted || noOfRows, valid_rows: recordsInserted || validRows, validated_at: uploadedOn.toISOString(), worksheet_snapshot: clientSnapshot })]`
    );

    // Patch VALIDATION_FAILED in POST /upload
    code = code.replace(
      `[uuid, userId, JSON.stringify({ total_rows: noOfRows, invalid_rows: invalidRows, failed_at: uploadedOn.toISOString() })]`,
      `[uuid, userId, JSON.stringify({ total_rows: noOfRows, invalid_rows: invalidRows, failed_at: uploadedOn.toISOString(), worksheet_snapshot: clientSnapshot })]`
    );

    // Patch uploadActionCode in POST /upload
    code = code.replace(
      `[uuid, uploadActionCode, userId, JSON.stringify({ s3_path: s3Path, file_name: file.originalname, corp_id: validCorpId, is_group: isGroupUpload })]`,
      `[uuid, uploadActionCode, userId, JSON.stringify({ s3_path: s3Path, file_name: file.originalname, corp_id: validCorpId, is_group: isGroupUpload, worksheet_snapshot: clientSnapshot })]`
    );

    // Patch DATA_TABLE_SAVED in POST /upload
    code = code.replace(
      `            completed_at: new Date().toISOString(),\n          }),\n        ]`,
      `            completed_at: new Date().toISOString(),\n            worksheet_snapshot: clientSnapshot,\n          }),\n        ]`
    );

    // Patch APPROVED in POST /upload
    code = code.replace(
      `[uuid, userId, JSON.stringify({ approved_at: new Date().toISOString() })]`,
      `[uuid, userId, JSON.stringify({ approved_at: new Date().toISOString(), worksheet_snapshot: clientSnapshot })]`
    );

    // Patch FORCE_APPROVED_WITH_ERRORS in POST /upload
    code = code.replace(
      `[uuid, userId, JSON.stringify({ force_ingested: true, bypassed_errors: invalidRows, records_inserted: recordsInserted, at: new Date().toISOString() })]`,
      `[uuid, userId, JSON.stringify({ force_ingested: true, bypassed_errors: invalidRows, records_inserted: recordsInserted, at: new Date().toISOString(), worksheet_snapshot: clientSnapshot })]`
    );
  }

  // 3. In POST /broker-upload/:uuid, handle clientSnapshot and operational snapshots
  if (!code.includes('let brokerClientSnapshot = null;')) {
    code = code.replace(
      '    const corpId = (metaRows && metaRows[0] && metaRows[0].corp_id) || null;\n\n    // Log VALIDATION_PASSED in trail for this revision',
      `    const corpId = (metaRows && metaRows[0] && metaRows[0].corp_id) || null;

    let brokerClientSnapshot = null;
    if (req.body.worksheet_snapshot) {
      try {
        brokerClientSnapshot = typeof req.body.worksheet_snapshot === "string"
          ? JSON.parse(req.body.worksheet_snapshot)
          : req.body.worksheet_snapshot;
      } catch (_) {}
    }

    // Log VALIDATION_PASSED in trail for this revision`
    );

    code = code.replace(
      `[uuid, userId, JSON.stringify({ validated_at: new Date().toISOString(), file_name: file.originalname })]`,
      `[uuid, userId, JSON.stringify({ validated_at: new Date().toISOString(), file_name: file.originalname, worksheet_snapshot: brokerClientSnapshot })]`
    );

    code = code.replace(
      `[uuid, userId, JSON.stringify({ s3_path: brokerS3Path, file_name: file.originalname, original_uuid: uuid })]`,
      `[uuid, userId, JSON.stringify({ s3_path: brokerS3Path, file_name: file.originalname, original_uuid: uuid, worksheet_snapshot: brokerClientSnapshot })]`
    );

    code = code.replace(
      `            completed_at: new Date().toISOString(),\n        }),\n      ]`,
      `            completed_at: new Date().toISOString(),\n            worksheet_snapshot: brokerClientSnapshot,\n        }),\n      ]`
    );

    code = code.replace(
      `[uuid, userId, JSON.stringify({ approved_at: new Date().toISOString() })]`,
      `[uuid, userId, JSON.stringify({ approved_at: new Date().toISOString(), worksheet_snapshot: brokerClientSnapshot })]`
    );

    // Also add FORCE_APPROVED_WITH_ERRORS to broker-upload if isForceIngest
    const forceIngestBlock = `
    const isForceIngest = req.body.force_ingest === "true" || req.body.force_ingest === true;
    const invalidRows = parseInt(req.body.invalid_rows, 10) || 0;
    if (isForceIngest) {
      await pool.execute(
        \`INSERT INTO dbo.enrollment_transaction_log (file_uuid, action_code, user_id, details)
         VALUES (?, 'FORCE_APPROVED_WITH_ERRORS', ?, ?)\`,
        [uuid, userId, JSON.stringify({ force_ingested: true, bypassed_errors: invalidRows, records_inserted: insertedCount, at: new Date().toISOString(), worksheet_snapshot: brokerClientSnapshot })]
      );
    }
`;
    code = code.replace(
      '    sendEvent({\n      stage: "complete",\n      message: `Successfully inserted ${insertedCount} member records.`,',
      forceIngestBlock + '\n    sendEvent({\n      stage: "complete",\n      message: `Successfully inserted ${insertedCount} member records.`,'
    );
  }

  // 4. Carry forward active snapshot on LOCKED, UNLOCKED, DOWNLOADED, REJECTED
  // In POST /lock/:uuid:
  code = code.replace(
    `    await pool.execute(\`\n      INSERT INTO dbo.enrollment_transaction_log (file_uuid, action_code, user_id, details)\n      VALUES (?, 'LOCKED', ?, ?)\n    \`, [uuid, userId, JSON.stringify({ locked_at: new Date().toISOString() })]);`,
    `    const lockActiveSnapshot = await getLatestFileSnapshot(pool, uuid);
    await pool.execute(\`
      INSERT INTO dbo.enrollment_transaction_log (file_uuid, action_code, user_id, details)
      VALUES (?, 'LOCKED', ?, ?)
    \`, [uuid, userId, JSON.stringify({ locked_at: new Date().toISOString(), worksheet_snapshot: lockActiveSnapshot })]);`
  );

  // In POST /unlock/:uuid:
  code = code.replace(
    `    await pool.execute(\`\n      INSERT INTO dbo.enrollment_transaction_log (file_uuid, action_code, user_id, details)\n      VALUES (?, 'UNLOCKED', ?, ?)\n    \`, [uuid, userId, JSON.stringify({ unlocked_at: new Date().toISOString() })]);`,
    `    const unlockActiveSnapshot = await getLatestFileSnapshot(pool, uuid);
    await pool.execute(\`
      INSERT INTO dbo.enrollment_transaction_log (file_uuid, action_code, user_id, details)
      VALUES (?, 'UNLOCKED', ?, ?)
    \`, [uuid, userId, JSON.stringify({ unlocked_at: new Date().toISOString(), worksheet_snapshot: unlockActiveSnapshot })]);`
  );

  // In POST /reject/:uuid:
  code = code.replace(
    `    const detailsPayload = JSON.stringify({\n      rejected_at: new Date().toISOString(),\n      broker_email: userEmail,\n      broker_id: brokerId,\n      reason: reason,\n      comment: comment\n    });`,
    `    const rejectActiveSnapshot = await getLatestFileSnapshot(pool, uuid);
    const detailsPayload = JSON.stringify({
      rejected_at: new Date().toISOString(),
      broker_email: userEmail,
      broker_id: brokerId,
      reason: reason,
      comment: comment,
      worksheet_snapshot: rejectActiveSnapshot
    });`
  );

  // In GET /download/:uuid:
  code = code.replace(
    `        JSON.stringify({\n          downloaded_at: now.toISOString(),\n          format: shouldExpandForBroker ? "expanded_61_col" : (brokerS3Path ? "revised_61_col" : "original_27_col"),\n          file_name: fileMeta.file_name,\n        }),`,
    `        JSON.stringify({
          downloaded_at: now.toISOString(),
          format: shouldExpandForBroker ? "expanded_61_col" : (brokerS3Path ? "revised_61_col" : "original_27_col"),
          file_name: fileMeta.file_name,
          worksheet_snapshot: await getLatestFileSnapshot(pool, uuid),
        }),`
  );

  fs.writeFileSync(uploads3Path, code, 'utf8');
  console.log('Successfully patched uploads3.js');
}

function patchValidate() {
  let code = fs.readFileSync(validatePath, 'utf8');

  // Replace sample_errors truncation with full worksheet_snapshot
  const targetOld = `      const logDetails = isClean
        ? {
            file_name: req.file.originalname,
            total_rows: results.length,
            valid_rows: acceptedRows.length,
            validated_at: new Date().toISOString(),
            mode: isBrokerFile ? "broker" : "hr",
          }
        : {
            file_name: req.file.originalname,
            total_rows: results.length,
            rejected_count: rejectedRows.length,
            accepted_count: acceptedRows.length,
            failed_at: new Date().toISOString(),
            mode: isBrokerFile ? "broker" : "hr",
            sample_errors: rejectedRows.slice(0, 5).map((r) => ({
              row_index: r.rowIndex,
              errors: r.errors,
            })),
          };`;

  const replacementNew = `      const fullSnapshot = {
        totalRows: results.length,
        acceptedRows: acceptedRows.length,
        rejectedRows: rejectedRows.length,
        headers: results[0]?.values ? Object.keys(results[0].values) : (results[0] ? Object.keys(results[0]) : []),
        rows: results.map((r, idx) => ({
          row: r.row || r.rowIndex || (idx + 1),
          sourceRow: r.sourceRow || r.rowIndex || (idx + 3),
          valid: r.valid,
          values: r.values || r.data || r,
          errors: Array.isArray(r.errors)
            ? r.errors.map((e) => (typeof e === "string" ? { field: "", message: e } : { field: e.field || e.column || "", message: e.message || e.error || "" }))
            : (r.fields || [])
                .filter((f) => !f.valid)
                .map((f) => ({
                  field: f.fieldName || f.colMapping,
                  message: (f.remarks || []).join("; "),
                })),
        })),
      };

      const logDetails = isClean
        ? {
            file_name: req.file.originalname,
            total_rows: results.length,
            valid_rows: acceptedRows.length,
            validated_at: new Date().toISOString(),
            mode: isBrokerFile ? "broker" : "hr",
            worksheet_snapshot: fullSnapshot,
          }
        : {
            file_name: req.file.originalname,
            total_rows: results.length,
            rejected_count: rejectedRows.length,
            accepted_count: acceptedRows.length,
            failed_at: new Date().toISOString(),
            mode: isBrokerFile ? "broker" : "hr",
            bypassed_errors_count: rejectedRows.length,
            worksheet_snapshot: fullSnapshot,
          };`;

  if (code.includes('sample_errors: rejectedRows.slice(0, 5)')) {
    code = code.replace(targetOld, replacementNew);
    fs.writeFileSync(validatePath, code, 'utf8');
    console.log('Successfully patched validate.js');
  } else {
    console.log('validate.js already patched or different snippet');
  }
}

try {
  patchUploads3();
  patchValidate();
  console.log('All backend patches successfully applied!');
} catch (e) {
  console.error('Error patching backend files:', e);
  process.exit(1);
}
