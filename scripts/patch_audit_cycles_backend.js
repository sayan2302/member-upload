import fs from 'fs';

const uploads3Path = 'C:/ALL/OFFICE/data-exchange/src/routes/uploads3.js';
let content = fs.readFileSync(uploads3Path, 'utf8');

// Replace file_size in query
if (content.includes('uuid, file_name, file_size, status,')) {
  content = content.replace('uuid, file_name, file_size, status,', 'uuid, file_name, status,');
  fs.writeFileSync(uploads3Path, content, 'utf8');
  console.log('✔ Fixed file_size column in uploads3.js');
} else {
  console.log('file_size column already removed or not present.');
}
