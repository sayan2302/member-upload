const fs = require('fs');
const path = require('path');

const csvGenPath = path.resolve('C:/ALL/OFFICE/data-exchange/src/utils/csvGenerator.js');
let csvGenContent = fs.readFileSync(csvGenPath, 'utf8');

const regex = /function buildMappingWorkbook\(fields, forHr = false, \{ includeFixedCols = true \} = \{\}\) \{[\s\S]*?const mappingFields = fieldsForRole\(fields, forHr \? "hr" : "broker"\)[\s\S]*?\.filter\(\(field\) => !forHr \|\| field\.showToHr !== false\);/;

const replacement = `function buildMappingWorkbook(fields, forHr = false, { includeFixedCols = true, corporateNames = [] } = {}) {
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

if (regex.test(csvGenContent)) {
  csvGenContent = csvGenContent.replace(regex, replacement);
  fs.writeFileSync(csvGenPath, csvGenContent, 'utf8');
  console.log('[OK] Updated csvGenerator.js via regex');
} else {
  console.log('[SKIP] Regex did not match csvGenerator.js');
}
