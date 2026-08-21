import fs from 'node:fs'
import path from 'node:path'

const hrControllerPath = path.resolve('c:/ALL/OFFICE/mayfairmemberportal/Site/Controllers/HRHomeController.cs')

if (fs.existsSync(hrControllerPath)) {
  let content = fs.readFileSync(hrControllerPath, 'utf8')
  if (content.includes('model.;')) {
    content = content.replace('model.;\r\n', '')
    content = content.replace('model.;\n', '')
    content = content.replace('model.;', '')
    fs.writeFileSync(hrControllerPath, content, 'utf8')
    console.log('Successfully fixed syntax error (model.;) in HRHomeController.cs!')
  }
}
