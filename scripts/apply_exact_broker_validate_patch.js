import fs from 'fs';

const p = 'C:/ALL/OFFICE/data-exchange/src/routes/brokerUploadValidate.route.js';
let c = fs.readFileSync(p, 'utf8');

const target = `            return res.status(200).json({
                preview: true,
                mapping: {
                    id: validationSchema.id,
                    name: validationSchema.mappingName
                },
                summary: {
                    totalRows: allRecords.length,
                    acceptedRows: acceptedRows.length,
                    rejectedRows: rejectedRows.length
                },
                acceptedRows,
                rejectedRows
            });`;

const replacement = `            return res.status(200).json({
                preview: true,
                mapping: {
                    id: validationSchema.id,
                    name: validationSchema.mappingName
                },
                summary: {
                    totalRows: allRecords.length,
                    acceptedRows: acceptedRows.length,
                    rejectedRows: rejectedRows.length
                },
                acceptedRows,
                rejectedRows,
                allowBrokerForceIngest: (configService.get("ALLOW_BROKER_FORCE_INGEST") ?? process.env.ALLOW_BROKER_FORCE_INGEST) === "true"
            });`;

// Normalize line endings for replacement
const cNorm = c.replace(/\r\n/g, '\n');
const targetNorm = target.replace(/\r\n/g, '\n');
const replacementNorm = replacement.replace(/\r\n/g, '\n');

if (cNorm.includes(targetNorm)) {
  const updated = cNorm.replace(targetNorm, replacementNorm);
  fs.writeFileSync(p, updated, 'utf8');
  console.log('✔ Successfully patched brokerUploadValidate.route.js!');
} else {
  console.log('Target block not found. Checking if already patched...');
  if (cNorm.includes('allowBrokerForceIngest')) {
    console.log('Already patched.');
  } else {
    console.log('Could not match target block.');
  }
}
