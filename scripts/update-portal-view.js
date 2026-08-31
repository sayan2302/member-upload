import fs from 'node:fs'
import path from 'node:path'

const viewPath = 'c:/ALL/OFFICE/mayfairmemberportal/Site/Views/HRHome/BulkMemberPolicyUpload.cshtml'

if (!fs.existsSync(viewPath)) {
  console.error('File not found:', viewPath)
  process.exit(1)
}

let content = fs.readFileSync(viewPath, 'utf8')
console.log('Current content length:', content.length)

// Check if userCtx is already extracted
if (!content.includes('userEmail')) {
  // Add userEmail extraction in C# block
  const targetCSharp = 'long providerCorpId = MemberPortal.Interface.Utility.UserContext.Current != null && MemberPortal.Interface.Utility.UserContext.Current.ProviderCorpID > 0\r\n        ? MemberPortal.Interface.Utility.UserContext.Current.ProviderCorpID\r\n        : corpId;'
  
  // Also handle \n alone
  const targetCSharpRegex = /long providerCorpId = MemberPortal\.Interface\.Utility\.UserContext\.Current != null && MemberPortal\.Interface\.Utility\.UserContext\.Current\.ProviderCorpID > 0\s*\?\s*MemberPortal\.Interface\.Utility\.UserContext\.Current\.ProviderCorpID\s*:\s*corpId;/
  
  const replacementCSharp = `long providerCorpId = MemberPortal.Interface.Utility.UserContext.Current != null && MemberPortal.Interface.Utility.UserContext.Current.ProviderCorpID > 0
        ? MemberPortal.Interface.Utility.UserContext.Current.ProviderCorpID
        : corpId;

    var userCtx = MemberPortal.Interface.Utility.UserContext.Current;
    string userEmail = "";
    string userName = "";
    string userId = "";
    if (userCtx != null)
    {
        userEmail = !string.IsNullOrWhiteSpace(userCtx.EmailId)
            ? userCtx.EmailId.Trim()
            : (!string.IsNullOrWhiteSpace(userCtx.LoginName) ? userCtx.LoginName.Trim() : "");
        userName = !string.IsNullOrWhiteSpace(userCtx.UserName) ? userCtx.UserName.Trim() : userEmail;
        userId = userCtx.UserId.ToString();
    }
    if (string.IsNullOrWhiteSpace(userEmail) && Model != null && Model.CorporateConfig != null && !string.IsNullOrWhiteSpace(Model.CorporateConfig.EmailId))
    {
        userEmail = Model.CorporateConfig.EmailId.Trim();
    }`

  if (targetCSharpRegex.test(content)) {
    content = content.replace(targetCSharpRegex, replacementCSharp)
    console.log('Added user context extraction in C# block.')
  } else {
    console.warn('Could not match targetCSharpRegex')
  }

  // Add attributes to #member-upload-root
  const targetMount = 'data-options-url="@ViewBag.AjaxOptionsUrl">'
  const replacementMount = `data-options-url="@ViewBag.AjaxOptionsUrl"
         data-user-email="@userEmail"
         data-user-name="@userName"
         data-user-id="@userId">`
  
  if (content.includes(targetMount)) {
    content = content.replace(targetMount, replacementMount)
    console.log('Added data-user-* attributes to member-upload-root.')
  }

  // Add window.__MEMBER_UPLOAD_CONFIG__ script before memberUpload.js
  const targetScript = '<script type="module" src="~/js/react-dist/memberUpload.js?v=@ticks"></script>'
  const replacementScript = `<script>
    window.__MEMBER_UPLOAD_CONFIG__ = window.__MEMBER_UPLOAD_CONFIG__ || {};
    window.__MEMBER_UPLOAD_CONFIG__.userEmail = '@Html.Raw(HttpUtility.JavaScriptStringEncode(userEmail))';
    window.__MEMBER_UPLOAD_CONFIG__.userName = '@Html.Raw(HttpUtility.JavaScriptStringEncode(userName))';
    window.__MEMBER_UPLOAD_CONFIG__.userId = '@Html.Raw(HttpUtility.JavaScriptStringEncode(userId))';
</script>
<script type="module" src="~/js/react-dist/memberUpload.js?v=@ticks"></script>`

  if (content.includes(targetScript)) {
    content = content.replace(targetScript, replacementScript)
    console.log('Added window.__MEMBER_UPLOAD_CONFIG__ script block.')
  }

  fs.writeFileSync(viewPath, content, 'utf8')
  console.log('BulkMemberPolicyUpload.cshtml successfully updated!')
} else {
  console.log('BulkMemberPolicyUpload.cshtml already has userEmail extraction.')
}
