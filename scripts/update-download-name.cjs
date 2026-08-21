const fs = require('fs');
const path = require('path');

const metaPath = path.resolve('C:/ALL/OFFICE/data-exchange/src/routes/enrolmentMeta.js');
let content = fs.readFileSync(metaPath, 'utf8');

const regex = /let downloadName;\s*if \(isFilenamePatternValidationEnabled\(\)\) \{[\s\S]*?\} else \{\s*downloadName = forHr \? "corporate-template\.xlsx" : "partner-template\.xlsx";\s*\}/;

const replacement = `const downloadName = req.query.for === "hr"
    ? "corporate-template.xlsx"
    : "partner-template.xlsx";`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(metaPath, content, 'utf8');
  console.log('[OK] Updated downloadName in enrolmentMeta.js');
} else {
  console.log('[WARN] Regex did not match downloadName in enrolmentMeta.js');
}
