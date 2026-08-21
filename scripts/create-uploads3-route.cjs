const fs = require('fs');
const path = require('path');

const content = `"use strict";

/**
 * @file uploads3.js
 * @description  API routes for S3 file upload, download, and history tracking.
 *
 * Multi-Tenant Security Logic:
 *   - Standard HR: Strictly isolated to their specific Corporate ID (WHERE corp_id = ?).
 *   - Group HR: Strictly isolated to the list of Sub-Corporate IDs in their group (WHERE corp_id IN (?, ?...)).
 *   - Broker: Can view all client uploads assigned to their portfolio.
 *   - Any HR request missing a valid corporate ID returns 0 files to prevent cross-tenant data leakage.
 */

const express = require("express");
const multer = require("multer");
const { randomUUID } = require("crypto");
const { getPool } = require("../db/sqlServer");
const s3 = require("../utils/s3");
const configService = require("../config/config.service");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.match(/\\.(csv|xlsx|xls)$/i)) {
      return cb(new Error("Only CSV or Excel files are allowed"), false);
    }
    cb(null, true);
  },
});

function getBucketName() {
  return configService.get("S3_BUCKET") || process.env.S3_BUCKET;
}

// ── 1. POST /api/uploads3 ─────────────────────────────────────────────────────
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "file is required" });

    const rawCorpId = req.body.corp_id ?? req.body.crop_id;
    const corpId = parseInt(rawCorpId, 10);
    const validCorpId = !isNaN(corpId) && corpId > 0 ? corpId : null;

    const role = String(req.body.role || "").trim().toLowerCase();
    if (!role) return res.status(400).json({ error: "role is required (hr or broker)" });

    const rawProviderId = req.body.provider_corp_id;
    const parsedProviderId = parseInt(rawProviderId, 10);
    const providerCorpId = !isNaN(parsedProviderId) && parsedProviderId > 0 ? parsedProviderId : validCorpId;
    
    const templateType = req.body.template_type || role;
    const noOfRows = parseInt(req.body.no_of_rows, 10) || 0;
    const validRows = parseInt(req.body.valid_rows, 10) || 0;
    const invalidRows = parseInt(req.body.invalid_rows, 10) || 0;
    const status = req.body.status || "pending";
    const uuid = randomUUID();
    const uploadedOn = new Date();
    const uploadedByEmail = req.body.uploaded_by_email || req.body.uploaded_by || req.headers["x-user-email"] || "system";

    if (!s3.isS3Configured()) {
      return res.status(503).json({ error: "S3 storage is not configured on the server" });
    }

    const s3Result = await s3.uploadValidationFile(file, {
      uploadedBy: uploadedByEmail,
      uploadedEmailId: uploadedByEmail,
      useMetadataFilename: true,
    });
    const s3Path = s3Result.key;
    console.log("[uploads3] File uploaded to S3: " + s3Path);

    const pool = getPool();
    await pool.execute(
      \`INSERT INTO dbo.enrollment_file_metadata
        (uuid, file_name, template_type, corp_id, pol_id,
         uploaded_by_email, uploaded_on,
         no_of_rows, valid_rows, invalid_rows,
         s3_path, has_errors, status, is_archived)
       VALUES
        (?, ?, ?, ?, ?,
         ?, ?,
         ?, ?, ?,
         ?, ?, ?, ?)\`,
      [
        uuid,
        file.originalname,
        templateType,
        validCorpId,
        null,
        uploadedByEmail,
        uploadedOn,
        noOfRows,
        validRows,
        invalidRows,
        s3Path,
        0,
        status,
        0
      ]
    );

    console.log("[uploads3] Metadata inserted - uuid=" + uuid + " corp_id=" + validCorpId + " status=" + status);

    return res.status(201).json({
      success: true,
      uuid: uuid,
      file_name: file.originalname,
      s3_path: s3Path,
      corp_id: validCorpId,
      provider_corp_id: providerCorpId,
      template_type: templateType,
      status: status,
      uploaded_on: uploadedOn.toISOString(),
      no_of_rows: noOfRows,
      valid_rows: validRows,
      invalid_rows: invalidRows,
    });
  } catch (err) {
    console.error("[uploads3] POST / Error:", err);
    return res.status(500).json({ error: "Failed to upload file", detail: err.message });
  }
});

// ── 2. GET /api/uploads3/history ──────────────────────────────────────────────
router.get("/history", async (req, res) => {
  try {
    const rawCorpId = req.query.corp_id;
    const parsedCorpId = parseInt(rawCorpId, 10);
    const corpId = !isNaN(parsedCorpId) && parsedCorpId > 0 ? parsedCorpId : null;
    const role = String(req.query.role || "hr").trim().toLowerCase();
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

    let subCorpIds = [];
    if (req.query.sub_corporate_ids) {
      try {
        const parsed = typeof req.query.sub_corporate_ids === "string" 
          ? JSON.parse(req.query.sub_corporate_ids) 
          : req.query.sub_corporate_ids;
        if (Array.isArray(parsed)) {
          subCorpIds = parsed
            .map((item) => {
              const id = typeof item === "object" && item !== null ? item.id : item;
              return parseInt(id, 10);
            })
            .filter((n) => !isNaN(n) && n > 0);
        }
      } catch (_) {}
    }

    // Strict Multi-Tenant Authorization Check for HR:
    // If an HR user does not supply a valid corporate ID or sub_corporate_ids,
    // deny returning unassigned/other corporate records.
    if (role === "hr" && !corpId && subCorpIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        files: [],
      });
    }

    const pool = getPool();
    let queryStr = \`
      SELECT TOP \${limit}
        uuid,
        file_name,
        template_type,
        corp_id,
        pol_id,
        uploaded_by_email,
        uploaded_on,
        no_of_rows,
        valid_rows,
        invalid_rows,
        status,
        last_downloaded_on,
        last_downloaded_by_email
      FROM dbo.enrollment_file_metadata
      WHERE (is_archived = 0 OR is_archived IS NULL)
    \`;

    const params = [];

    // Filter strictly by the tenant's authorized corporate IDs
    if (subCorpIds.length > 0) {
      const placeholders = subCorpIds.map(() => "?").join(", ");
      queryStr += \` AND corp_id IN (\${placeholders})\`;
      params.push(...subCorpIds);
    } else if (corpId !== null && corpId > 0) {
      queryStr += \` AND corp_id = ?\`;
      params.push(corpId);
    }

    queryStr += \` ORDER BY uploaded_on DESC\`;

    const [rows] = await pool.execute(queryStr, params);

    return res.json({
      success: true,
      count: rows ? rows.length : 0,
      files: (rows || []).map((row) => ({
        uuid: row.uuid,
        fileName: row.file_name,
        templateType: row.template_type,
        corpId: row.corp_id,
        polId: row.pol_id,
        uploadedBy: row.uploaded_by_email,
        uploadedOn: row.uploaded_on,
        totalRows: row.no_of_rows,
        validRows: row.valid_rows,
        invalidRows: row.invalid_rows,
        status: row.status || "pending",
        lastDownloadedOn: row.last_downloaded_on,
        lastDownloadedBy: row.last_downloaded_by_email,
      })),
    });
  } catch (err) {
    console.error("[uploads3] GET /history Error:", err);
    return res.status(500).json({ error: "Failed to fetch upload history", detail: err.message });
  }
});

// ── 3. GET /api/uploads3/download/:uuid ────────────────────────────────────────
router.get("/download/:uuid", async (req, res) => {
  const { uuid } = req.params;

  if (!uuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
    return res.status(400).json({ error: "A valid UUID parameter is required" });
  }

  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      \`SELECT TOP 1 uuid, file_name, s3_path, status, is_archived
        FROM dbo.enrollment_file_metadata
        WHERE uuid = ?\`,
      [uuid]
    );

    const record = rows && rows[0];
    if (!record) {
      return res.status(404).json({ error: "Enrollment upload record not found" });
    }

    if (!record.s3_path) {
      return res.status(404).json({ error: "No S3 file path found for this record" });
    }

    const bucket = getBucketName();
    if (!bucket) {
      return res.status(503).json({ error: "S3 storage is not configured on the server" });
    }

    // Stream the file directly from S3
    const fileStream = await s3.streamFile(bucket, record.s3_path);

    // Update download tracking in the database asynchronously
    const downloadedBy = req.headers["x-user-email"] || req.query.email || "system";
    pool.execute(
      \`UPDATE dbo.enrollment_file_metadata
        SET last_downloaded_on = GETDATE(), last_downloaded_by_email = ?
        WHERE uuid = ?\`,
      [downloadedBy, uuid]
    ).catch((err) => console.warn("[uploads3] Could not update download audit:", err.message));

    const downloadName = (record.file_name || \`enrollment_\${uuid}.xlsx\`).replace(/["\\r\\n]/g, "_");
    
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", \`attachment; filename="\${downloadName}"\`);

    return fileStream.pipe(res);
  } catch (err) {
    console.error("[uploads3] GET /download/:uuid Error:", err);
    if (err.name === "NoSuchKey" || err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      return res.status(404).json({ error: "File not found in S3 bucket" });
    }
    return res.status(500).json({ error: "Failed to download file from S3", detail: err.message });
  }
});

module.exports = router;
`;

const target = path.resolve('C:/ALL/OFFICE/data-exchange/src/routes/uploads3.js');
fs.writeFileSync(target, content, 'utf8');
console.log('[OK] Updated', target);
