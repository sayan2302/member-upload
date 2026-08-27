import fs from 'fs';

const authPath = 'C:/ALL/OFFICE/data-exchange/src/middleware/apiKeyAuth.js';
let content = fs.readFileSync(authPath, 'utf8');

if (!content.includes('req.query.apiKey')) {
  content = content.replace(
    'const provided = req.headers["x-api-key"];',
    'const provided = req.headers["x-api-key"] || req.query.apiKey || req.query.api_key;'
  );
  fs.writeFileSync(authPath, content, 'utf8');
  console.log('✔ Successfully patched apiKeyAuth.js to accept apiKey in query params');
} else {
  console.log('apiKeyAuth.js already accepts apiKey query param.');
}
