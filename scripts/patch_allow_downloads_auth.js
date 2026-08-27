import fs from 'fs';

const authPath = 'C:/ALL/OFFICE/data-exchange/src/middleware/apiKeyAuth.js';
let content = fs.readFileSync(authPath, 'utf8');

const targetStr = `function apiKeyAuth(req, res, next) {
  const provided = req.headers["x-api-key"] || req.query.apiKey || req.query.api_key;`;

const replacementStr = `function apiKeyAuth(req, res, next) {
  // Allow direct browser downloads for templates, snapshots, and file attachments
  const isPublicDownload = req.method === "GET" && (
    (req.path && req.path.includes("sample-csv")) ||
    (req.path && req.path.includes("/download")) ||
    (req.path && req.path.includes("download-snapshot"))
  );
  if (isPublicDownload && !req.headers["x-api-key"] && !req.query.apiKey && !req.query.api_key) {
    return next();
  }

  const provided = req.headers["x-api-key"] || req.query.apiKey || req.query.api_key;`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(authPath, content, 'utf8');
  console.log('✔ Successfully patched apiKeyAuth.js to permit browser file downloads');
} else {
  console.log('Pattern not matched in apiKeyAuth.js');
}
