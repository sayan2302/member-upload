const fs = require('fs');
const path = require('path');

// 1. Update csvGenerator.js
const csvGenPath = path.resolve('C:/ALL/OFFICE/data-exchange/src/utils/csvGenerator.js');
let csvGenContent = fs.readFileSync(csvGenPath, 'utf8');

const oldSig = `function buildMappingWorkbook(fields, forHr = false, { includeFixedCols = true } = {}) {
  // Prepend fixed system columns before the mapping fields (unless opted out)
  const FIXED_COLS = includeFixedCols
    ? [
        { name: "operation",  datatype: "string", isRequired: true,  default: ["Add", "Modify", "Delete"] },
        { name: "member id",  datatype: "string", isRequired: false, default: [] },
      ]
    : [];

  const mappingFields = fieldsForRole(fields, forHr ? "hr" : "broker")
    .filter((field) => !forHr || field.showToHr !== false);`;

const newSig = `function buildMappingWorkbook(fields, forHr = false, { includeFixedCols = true, corporateNames = [] } = {}) {
  // Prepend fixed system columns before the mapping fields (unless opted out)
  const FIXED_COLS = includeFixedCols
    ? [
        { name: "operation",  datatype: "string", isRequired: true,  default: ["Add", "Modify", "Delete"] },
        { name: "member id",  datatype: "string", isRequired: false, default: [] },
      ]
    : [];

  const validCorpNames = Array.isArray(corporateNames)
    ? corporateNames.map((c) => (typeof c === "object" && c !== null ? c.name : c)).filter((n) => typeof n === "string" && n.trim() !== "")
    : [];

  const mappingFields = fieldsForRole(fields, forHr ? "hr" : "broker")
    .filter((field) => !forHr || field.showToHr !== false)
    .map((field) => {
      if (
        validCorpNames.length > 0 &&
        /^(company|company\\s*name|corporate|corporate\\s*name)$/i.test(field.name.trim())
      ) {
        return {
          ...field,
          default: validCorpNames,
        };
      }
      return field;
    });`;

if (csvGenContent.includes(oldSig)) {
  csvGenContent = csvGenContent.replace(oldSig, newSig);
  fs.writeFileSync(csvGenPath, csvGenContent, 'utf8');
  console.log('[OK] Updated csvGenerator.js');
} else {
  console.log('[SKIP] csvGenerator.js pattern already modified or not found');
}

// 2. Update enrolmentMeta.js
const metaPath = path.resolve('C:/ALL/OFFICE/data-exchange/src/routes/enrolmentMeta.js');
let metaContent = fs.readFileSync(metaPath, 'utf8');

// Update router.get("/:id/sample-csv", ...)
const routePattern = /router\.get\("\/:id\/sample-csv", async \(req, res\) => \{[\s\S]*?const workbook = buildMappingWorkbook\(fields, forHr, \{ includeFixedCols: false \}\);[\s\S]*?res\.send\(Buffer\.from\(buffer\)\);\s*\}\s*catch \(err\)/;

const newRouteCode = `router.get("/:id/sample-csv", async (req, res) => {
  let id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "id must be a number" });
  if (id === 0) id = 4;
  const forHr = req.query.for !== "broker";

  // Parse custom corporate list from query params if provided
  let corporateNames = [];
  if (req.query.corporates) {
    try {
      const parsed = typeof req.query.corporates === "string" ? JSON.parse(req.query.corporates) : req.query.corporates;
      if (Array.isArray(parsed)) {
        corporateNames = parsed.map(c => (typeof c === "object" && c !== null ? c.name : c)).filter(n => typeof n === "string" && n.trim() !== "");
      }
    } catch (_) {}
  }

  const rawCorpId = req.query.corp_id;
  const parsedCorpId = parseInt(rawCorpId, 10);
  const corpId = !isNaN(parsedCorpId) && parsedCorpId > 0 ? parsedCorpId : null;

  // Fetch mapping identifiers + field_mapping JSON from DB
  let row;
  let mapping_name = req.query.for == "hr" ? "HR-Template" : "Broker-Template";
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      "SELECT pol_id, product_id, crop_id, insurance_id, policy_type, field_mapping FROM dbo.enrolment_meta WHERE mapping_name = ?",
      [mapping_name]
    );
    row = rows[0];
  } catch (err) {
    console.error("[enrolment-meta] GET /:id/sample-csv (DB lookup)", err.message);
    return res.status(500).json({ error: "Failed to load mapping metadata", detail: err.message });
  }

  if (!row || !row.field_mapping) {
    return res.status(404).json({ error: "Sample file not found – save the mapping first" });
  }

  let downloadName;
  if (isFilenamePatternValidationEnabled()) {
    const candidates = [
      ["pol_id", row.pol_id],
      ["product_id", row.product_id],
      ["corp_id", corpId || row.crop_id],
      ["insurance_id", row.insurance_id],
      ["policy_type", row.policy_type],
    ];
    const [key, value] = candidates.find(([, candidate]) => candidate != null) ?? ["id", id];
    const prefix = forHr ? "hr" : "broker";
    downloadName = \`\${prefix}_\${key}_\${value}_\${Date.now()}.xlsx\`;
  } else {
    downloadName = forHr ? "corporate-template.xlsx" : "partner-template.xlsx";
  }

  // ── Generate workbook on the fly ───────────────────────────────────────────
  try {
    const parsed = JSON.parse(row.field_mapping);
    const fields = parsed.field_mapping ?? [];
    const workbook = buildMappingWorkbook(fields, forHr, { includeFixedCols: false, corporateNames });
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", \`attachment; filename="\${downloadName}"\`);
    res.send(Buffer.from(buffer));
  } catch (err)`;

if (routePattern.test(metaContent)) {
  metaContent = metaContent.replace(routePattern, newRouteCode);
  fs.writeFileSync(metaPath, metaContent, 'utf8');
  console.log('[OK] Updated enrolmentMeta.js');
} else {
  console.log('[SKIP] enrolmentMeta.js pattern already modified or not found');
}
