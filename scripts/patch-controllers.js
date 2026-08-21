import fs from 'node:fs'
import path from 'node:path'

const hrControllerPath = path.resolve('c:/ALL/OFFICE/mayfairmemberportal/Site/Controllers/HRHomeController.cs')
const brokerControllerPath = path.resolve('c:/ALL/OFFICE/mayfairmemberportal/Site/Controllers/BrokerHomeController.cs')

// 1. Patch HRHomeController.cs to remove invalid IsAdminBroker property assignment
if (fs.existsSync(hrControllerPath)) {
  let content = fs.readFileSync(hrControllerPath, 'utf8')
  if (content.includes('IsAdminBroker = true')) {
    content = content.replace('IsAdminBroker = true\r\n', '')
    content = content.replace('IsAdminBroker = true\n', '')
    content = content.replace('IsAdminBroker = true', '')
    fs.writeFileSync(hrControllerPath, content, 'utf8')
    console.log('Successfully patched HRHomeController.cs!')
  }
}

// 2. Patch BrokerHomeController.cs ReportsIndex null check
if (fs.existsSync(brokerControllerPath)) {
  let content = fs.readFileSync(brokerControllerPath, 'utf8')
  const targetOld = `        [HttpGet]
        public ActionResult ReportsIndex()
        {
            try
            {
                BrokerContext brokerContext = UserContext.Current as BrokerContext;
                UserContext user = UserContext.Current;
                Session[MessageConstant.FEATURES_ACCESS_PERMISSIONS] = user.FeaturePermissions;`

  const targetNew = `        [HttpGet]
        public ActionResult ReportsIndex()
        {
            try
            {
                UserContext user = UserContext.Current;
                if (user == null)
                {
                    return RedirectToAction("Login", "Account");
                }
                BrokerContext brokerContext = user as BrokerContext;
                Session[MessageConstant.FEATURES_ACCESS_PERMISSIONS] = user.FeaturePermissions;`

  if (content.includes(targetOld)) {
    content = content.replace(targetOld, targetNew)
    fs.writeFileSync(brokerControllerPath, content, 'utf8')
    console.log('Successfully patched BrokerHomeController.cs ReportsIndex!')
  }
}

console.log('Controllers patch script finished!')
