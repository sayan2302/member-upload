import fs from 'fs';
import path from 'path';

console.log('[Patch Force Ingest] Starting backend patch...');

// 1. Patch .env.local
const envPath = 'C:/ALL/OFFICE/data-exchange/.env.local';
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('ALLOW_BROKER_FORCE_INGEST=')) {
    envContent += '\n# Broker Force Ingestion Flag\nALLOW_BROKER_FORCE_INGEST=true\n';
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✔ Patched .env.local with ALLOW_BROKER_FORCE_INGEST=true');
  } else {
    console.log('✔ .env.local already contains ALLOW_BROKER_FORCE_INGEST');
  }
}

// 2. Patch enrollmentTransformer.js
const transformerPath = 'C:/ALL/OFFICE/data-exchange/src/transformers/enrollmentTransformer.js';
if (fs.existsSync(transformerPath)) {
  let transContent = fs.readFileSync(transformerPath, 'utf8');

  // Robust formatDate returning null on invalid strings
  const newFormatDate = `function formatDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, "0");
    const day = String(val.getDate()).padStart(2, "0");
    return \`\${year}-\${month}-\${day}\`;
  }
  const str = String(val).trim();
  if (!str || str.toLowerCase() === "n/a" || str.toLowerCase() === "null") return null;

  // DD/MM/YYYY or DD-MM-YYYY format
  const dmyMatch = str.match(/^(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    const d = new Date(\`\${year}-\${month}-\${day}\`);
    if (!isNaN(d.getTime())) return \`\${year}-\${month}-\${day}\`;
  }

  // YYYY-MM-DD format
  if (/^\\d{4}-\\d{2}-\\d{2}/.test(str)) {
    const ymd = str.substring(0, 10);
    const d = new Date(ymd);
    if (!isNaN(d.getTime())) return ymd;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return \`\${year}-\${month}-\${day}\`;
  }
  return null;
}`;

  transContent = transContent.replace(/function formatDate\(val\) \{[\s\S]*?\n\}/, newFormatDate);

  // Robust parseNumber
  const newParseNumber = `function parseNumber(val, fallback = null) {
  if (val === null || val === undefined || val === "") return fallback;
  const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
  return isNaN(num) ? fallback : num;
}`;
  transContent = transContent.replace(/function parseNumber\(val, fallback = 0\) \{[\s\S]*?\n\}/, newParseNumber);

  // Update remarks_comments and ref_file in transformBrokerRow
  if (!transContent.includes('FORCE_INGESTED')) {
    transContent = transContent.replace(
      `remarks_comments: remarks,`,
      `remarks_comments: context.isForceIngest ? (remarks ? \`FORCE_INGESTED: \${remarks}\` : "FORCE_INGESTED_WITH_ERRORS") : remarks,`
    );
  }

  if (!transContent.includes('${context.fileUuid}__')) {
    transContent = transContent.replace(
      `ref_file: context.fileName || (context.fileUuid ? \`broker_\${context.fileUuid}.xlsx\` : null),`,
      `ref_file: context.fileUuid ? \`\${context.fileUuid}__\${context.fileName || 'file.xlsx'}\` : (context.fileName || null),`
    );
  }

  fs.writeFileSync(transformerPath, transContent, 'utf8');
  console.log('✔ Patched enrollmentTransformer.js');
}

// 3. Patch validate.js to expose allowBrokerForceIngest
const validatePath = 'C:/ALL/OFFICE/data-exchange/src/routes/validate.js';
if (fs.existsSync(validatePath)) {
  let valContent = fs.readFileSync(validatePath, 'utf8');

  if (!valContent.includes('allowBrokerForceIngest:')) {
    valContent = valContent.replace(
      `allowedCompanies: allowedCompanyNames,`,
      `allowedCompanies: allowedCompanyNames,\n      allowBrokerForceIngest: (configService.get("ALLOW_BROKER_FORCE_INGEST") ?? process.env.ALLOW_BROKER_FORCE_INGEST) === "true",`
    );

    valContent = valContent.replace(
      `uploaded_file: storedUpload,`,
      `uploaded_file: storedUpload,\n      allowBrokerForceIngest: (configService.get("ALLOW_BROKER_FORCE_INGEST") ?? process.env.ALLOW_BROKER_FORCE_INGEST) === "true",`
    );

    fs.writeFileSync(validatePath, valContent, 'utf8');
    console.log('✔ Patched validate.js to expose allowBrokerForceIngest');
  } else {
    console.log('✔ validate.js already contains allowBrokerForceIngest');
  }
}

// 3b. Patch brokerUploadValidate.route.js
const brokerValidatePath = 'C:/ALL/OFFICE/data-exchange/src/routes/brokerUploadValidate.route.js';
if (fs.existsSync(brokerValidatePath)) {
  let bvContent = fs.readFileSync(brokerValidatePath, 'utf8');

  if (!bvContent.includes('configService = require("../config/config.service")')) {
    bvContent = bvContent.replace(
      `const router = express.Router();`,
      `const configService = require("../config/config.service");\nconst router = express.Router();`
    );
  }

  if (!bvContent.includes('allowBrokerForceIngest:')) {
    bvContent = bvContent.replace(
      `rejectedRows\n            });`,
      `rejectedRows,\n                allowBrokerForceIngest: (configService.get("ALLOW_BROKER_FORCE_INGEST") ?? process.env.ALLOW_BROKER_FORCE_INGEST) === "true"\n            });`
    );
    fs.writeFileSync(brokerValidatePath, bvContent, 'utf8');
    console.log('✔ Patched brokerUploadValidate.route.js to expose allowBrokerForceIngest');
  } else {
    console.log('✔ brokerUploadValidate.route.js already contains allowBrokerForceIngest');
  }
}

// 4. Patch uploads3.js to handle force_ingest
const uploads3Path = 'C:/ALL/OFFICE/data-exchange/src/routes/uploads3.js';
if (fs.existsSync(uploads3Path)) {
  let upContent = fs.readFileSync(uploads3Path, 'utf8');

  // In ingestWorkbookToDataTable, pass isForceIngest
  if (!upContent.includes('isForceIngest = false')) {
    upContent = upContent.replace(
      `corpId, uploadedBy, uploadedEmail, onProgress`,
      `corpId, uploadedBy, uploadedEmail, isForceIngest = false, onProgress`
    );
    upContent = upContent.replace(
      `const context = { fileUuid, fileName, corpId, uploadedBy, uploadedEmail };`,
      `const context = { fileUuid, fileName, corpId, uploadedBy, uploadedEmail, isForceIngest };`
    );
  }

  // In POST / (fresh upload)
  if (!upContent.includes('isForceIngest = req.body.force_ingest')) {
    upContent = upContent.replace(
      `const isBrokerUpload = role === "broker" || templateType === "broker" || status === "approved";`,
      `const isForceIngest = req.body.force_ingest === "true" || req.body.force_ingest === true || req.query.force === "true";
    const allowForceIngestFlag = (configService.get("ALLOW_BROKER_FORCE_INGEST") ?? process.env.ALLOW_BROKER_FORCE_INGEST) === "true";
    if (isForceIngest && !allowForceIngestFlag) {
      return res.status(403).json({ error: "Force ingestion is disabled on the server." });
    }
    const isBrokerUpload = role === "broker" || templateType === "broker" || status === "approved" || isForceIngest;`
    );

    upContent = upContent.replace(
      `uploadedEmail: uploadedByEmail,
          onProgress: (progressData) => sendEvent(progressData),`,
      `uploadedEmail: uploadedByEmail,
          isForceIngest,
          onProgress: (progressData) => sendEvent(progressData),`
    );

    upContent = upContent.replace(
      `await pool.execute(
        \`INSERT INTO dbo.enrollment_transaction_log (file_uuid, action_code, user_id, details)
         VALUES (?, 'APPROVED', ?, ?)\`,
        [uuid, userId, JSON.stringify({ approved_at: new Date().toISOString() })]
      );`,
      `await pool.execute(
        \`INSERT INTO dbo.enrollment_transaction_log (file_uuid, action_code, user_id, details)
         VALUES (?, 'APPROVED', ?, ?)\`,
        [uuid, userId, JSON.stringify({ approved_at: new Date().toISOString() })]
      );

      if (isForceIngest) {
        await pool.execute(
          \`INSERT INTO dbo.enrollment_transaction_log (file_uuid, action_code, user_id, details)
           VALUES (?, 'FORCE_APPROVED_WITH_ERRORS', ?, ?)\`,
          [uuid, userId, JSON.stringify({ force_ingested: true, bypassed_errors: invalidRows, records_inserted: recordsInserted, at: new Date().toISOString() })]
        );
      }`
    );
  }

  // In POST /broker-upload/:uuid (revised upload)
  if (!upContent.includes('const isForceIngest = req.body.force_ingest')) {
    upContent = upContent.replace(
      `const uploadedByEmail = req.headers["x-user-email"] || req.body.uploaded_by_email || "system";`,
      `const uploadedByEmail = req.headers["x-user-email"] || req.body.uploaded_by_email || "system";
  const isForceIngest = req.body.force_ingest === "true" || req.body.force_ingest === true || req.query.force === "true";
  const allowForceIngestFlag = (configService.get("ALLOW_BROKER_FORCE_INGEST") ?? process.env.ALLOW_BROKER_FORCE_INGEST) === "true";
  if (isForceIngest && !allowForceIngestFlag) {
    return res.status(403).json({ error: "Force ingestion is disabled on the server." });
  }`
    );

    upContent = upContent.replace(
      `uploadedEmail: uploadedByEmail,
      onProgress: (progressData) => sendEvent(progressData),`,
      `uploadedEmail: uploadedByEmail,
      isForceIngest,
      onProgress: (progressData) => sendEvent(progressData),`
    );

    upContent = upContent.replace(
      `await pool.execute(
      \`INSERT INTO dbo.enrollment_transaction_log (file_uuid, action_code, user_id, details)
        VALUES (?, 'APPROVED', ?, ?)\`,
      [uuid, userId, JSON.stringify({ approved_at: new Date().toISOString() })]
    );`,
      `await pool.execute(
      \`INSERT INTO dbo.enrollment_transaction_log (file_uuid, action_code, user_id, details)
        VALUES (?, 'APPROVED', ?, ?)\`,
      [uuid, userId, JSON.stringify({ approved_at: new Date().toISOString() })]
    );

    if (isForceIngest) {
      await pool.execute(
        \`INSERT INTO dbo.enrollment_transaction_log (file_uuid, action_code, user_id, details)
         VALUES (?, 'FORCE_APPROVED_WITH_ERRORS', ?, ?)\`,
        [uuid, userId, JSON.stringify({ force_ingested: true, records_inserted: insertedCount, at: new Date().toISOString() })]
      );
    }`
    );
  }

  fs.writeFileSync(uploads3Path, upContent, 'utf8');
  console.log('✔ Patched uploads3.js for force ingestion');
}

console.log('[Patch Force Ingest] Completed successfully.');
