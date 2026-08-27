import fs from 'fs';

const serverPath = 'C:/ALL/OFFICE/data-exchange/src/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

const target = 'app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));';
const replacement = 'app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*", exposedHeaders: ["Content-Disposition", "Content-Type"] }));';

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('✔ Updated server.js CORS to expose Content-Disposition header');
} else {
  console.log('Target not found in server.js');
}
