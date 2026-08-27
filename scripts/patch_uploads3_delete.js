import fs from 'fs'
import path from 'path'

const uploads3Path = path.resolve('C:/ALL/OFFICE/data-exchange/src/routes/uploads3.js')
let content = fs.readFileSync(uploads3Path, 'utf8')

// 1. Add status != 'deleted' to GET /history query
if (!content.includes("AND (m.status != 'deleted' OR m.status IS NULL)")) {
  content = content.replace(
    `WHERE (m.is_archived = 0 OR m.is_archived IS NULL)`,
    `WHERE (m.is_archived = 0 OR m.is_archived IS NULL)\n        AND (m.status != 'deleted' OR m.status IS NULL)`
  )
}

// 2. Add DELETE /:uuid route after unlock route
const deleteRouteCode = `
// ── 5.1 DELETE /api/uploads3/:uuid (HR File Deletion with Broker Lock Check) ─
router.delete("/:uuid", async (req, res) => {
  const { uuid } = req.params;
  const userId = req.headers["x-user-id"] || req.body?.user_id || req.headers["x-user-email"] || "hr_user";
  const userEmail = req.headers["x-user-email"] || req.body?.user_email || "hr_admin";

  if (!uuid) return res.status(400).json({ error: "UUID is required" });

  try {
    const pool = getPool();

    // 1. Verify file existence
    const [metaRows] = await pool.execute(\`
      SELECT TOP 1 uuid, file_name, status, is_archived
      FROM dbo.enrollment_file_metadata
      WHERE uuid = ?
    \`, [uuid]);

    if (!metaRows || metaRows.length === 0) {
      return res.status(404).json({ error: "File submission not found" });
    }

    const fileMeta = metaRows[0];
    if (fileMeta.status === "deleted" || fileMeta.is_archived === 1) {
      return res.status(400).json({ error: "This file submission has already been deleted." });
    }

    // 2. Check latest state in enrollment_transaction_log
    const [latestLogs] = await pool.execute(\`
      SELECT TOP 1 action_code, user_id, details
      FROM dbo.enrollment_transaction_log
      WHERE file_uuid = ? AND action_code IN ('LOCKED', 'UNLOCKED', 'APPROVED', 'DELETED')
      ORDER BY created_at DESC, id DESC
    \`, [uuid]);

    const lastAction = latestLogs && latestLogs[0];

    // Lock check: Broker has locked this file
    if (lastAction && lastAction.action_code === "LOCKED") {
      return res.status(409).json({
        error: \`Cannot delete file: This submission is currently locked by Broker (ID: \${lastAction.user_id}) for review. Please ask the broker to unlock it first.\`,
        locked: true,
        locked_by: lastAction.user_id
      });
    }

    // Approval check: File already committed to live database
    if ((lastAction && lastAction.action_code === "APPROVED") || fileMeta.status === "approved") {
      return res.status(400).json({
        error: "Cannot delete file: This submission has already been approved and committed to the live member database."
      });
    }

    // 3. Mark as deleted in metadata table
    await pool.execute(\`
      UPDATE dbo.enrollment_file_metadata
      SET status = 'deleted', is_archived = 1
      WHERE uuid = ?
    \`, [uuid]);

    // 4. Log standardized DELETED transaction
    await pool.execute(\`
      INSERT INTO dbo.enrollment_transaction_log (file_uuid, action_code, user_id, details)
      VALUES (?, 'DELETED', ?, ?)
    \`, [uuid, userId, JSON.stringify({ deleted_at: new Date().toISOString(), deleted_by_email: userEmail })]);

    logger.info(\`[uploads3] File \${uuid} successfully deleted by \${userId}\`);
    return res.json({
      success: true,
      message: "File submission deleted successfully",
      uuid
    });
  } catch (err) {
    logger.error("[uploads3] DELETE /:uuid Error:", err);
    return res.status(500).json({ error: "Failed to delete file", detail: err.message });
  }
});
`

if (!content.includes('router.delete("/:uuid"')) {
  content = content.replace(
    '// ── 6. POST /api/uploads3/broker-upload/:uuid',
    deleteRouteCode + '\n// ── 6. POST /api/uploads3/broker-upload/:uuid'
  )
}

fs.writeFileSync(uploads3Path, content, 'utf8')
console.log('Successfully patched uploads3.js with DELETE endpoint and lock check!')
