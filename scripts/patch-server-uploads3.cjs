const fs = require('fs');
const path = require('path');

const serverPath = path.resolve('C:/ALL/OFFICE/data-exchange/src/server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// 1. Add the import after enrollmentRouter
const importLine = 'const enrollmentRouter         = require("./routes/enrollment.routes");';
const newImport  = 'const uploads3Router           = require("./routes/uploads3");';

if (!content.includes('uploads3Router')) {
  content = content.replace(
    importLine,
    importLine + '\r\n' + newImport
  );
  console.log('[OK] Added uploads3Router import');
} else {
  console.log('[SKIP] uploads3Router import already exists');
}

// 2. Add route registration after enrollment route
const enrollmentRoute = 'app.use("/api/enrollment",         enrollmentRouter);        // Member Enrollment API (RabbitMQ Publisher)';
const newRoute        = 'app.use("/api/uploads3",           uploads3Router);          // HR/Broker file upload to S3 + metadata';

if (!content.includes('uploads3Router') || content.includes(newRoute)) {
  // already patched via above, just check mount
}

if (!content.includes('/api/uploads3')) {
  content = content.replace(
    enrollmentRoute,
    enrollmentRoute + '\r\n' + newRoute
  );
  console.log('[OK] Added /api/uploads3 route mount');
} else {
  console.log('[SKIP] /api/uploads3 route already mounted');
}

fs.writeFileSync(serverPath, content, 'utf8');
console.log('[DONE] server.js patched');
