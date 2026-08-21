const fs = require('fs');
const path = require('path');

const metaPath = path.resolve('C:/ALL/OFFICE/data-exchange/src/routes/enrolmentMeta.js');
let metaContent = fs.readFileSync(metaPath, 'utf8');

metaContent = metaContent.replace('// router.get("/:id/sample-csv", async (req, res) => {', 'router.get("/:id/sample-csv", async (req, res) => {');

fs.writeFileSync(metaPath, metaContent, 'utf8');
console.log('[OK] Fixed route declaration in enrolmentMeta.js');
