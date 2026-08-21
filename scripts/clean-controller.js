import fs from 'node:fs'
import path from 'node:path'

const hrControllerPath = path.resolve('c:/ALL/OFFICE/mayfairmemberportal/Site/Controllers/HRHomeController.cs')
if (fs.existsSync(hrControllerPath)) {
  let content = fs.readFileSync(hrControllerPath, 'utf8')
  content = content.replace(
    `                CorporateConfigModel model = new CorporateConfigModel
                {
                    CorporateConfig = user.CorpConfig,
                                    };`,
    `                CorporateConfigModel model = new CorporateConfigModel
                {
                    CorporateConfig = user.CorpConfig
                };`
  )
  fs.writeFileSync(hrControllerPath, content, 'utf8')
  console.log('Cleaned up HRHomeController.cs model init!')
}
