import fs from 'node:fs'
import path from 'node:path'

const portalDir = path.resolve('c:/ALL/OFFICE/mayfairmemberportal/Site')

console.log('Updating dashboard cards and sidebar menus in .NET portal...')

// 1. Update Broker Dashboard (IndexBrokerMayfair.cshtml)
const brokerDashPath = path.join(portalDir, 'Views', 'BrokerHome', 'IndexBrokerMayfair.cshtml')
if (fs.existsSync(brokerDashPath)) {
  let content = fs.readFileSync(brokerDashPath, 'utf8')
  if (!content.includes('href="@Url.Action("MemberUpload", "BrokerHome")"')) {
    const cardHtml = `            <a href="@Url.Action("MemberUpload", "BrokerHome")">
                <div class="card-with-img-content">
                    <div class="img-content">
                        <img src="/img/member-enrolment.png" alt="Member Upload">
                    </div>
                    <h3>Member Upload</h3>
                    <p>Upload and validate employee enrollment spreadsheets.</p>
                </div>
            </a>\n`
    const target = '<a href="@Url.Action("PolicyDetails", "BrokerHome" )">'
    if (content.includes(target)) {
      content = content.replace(target, cardHtml + '            ' + target)
      fs.writeFileSync(brokerDashPath, content, 'utf8')
      console.log('Added Member Upload card to IndexBrokerMayfair.cshtml')
    }
  } else {
    console.log('Member Upload card already exists in IndexBrokerMayfair.cshtml')
  }
}

// 2. Update HR Dashboard (TPAIndexHRMWC.cshtml)
const tpaHrDashPath = path.join(portalDir, 'Views', 'HRHome', 'TPAIndexHRMWC.cshtml')
if (fs.existsSync(tpaHrDashPath)) {
  let content = fs.readFileSync(tpaHrDashPath, 'utf8')
  if (!content.includes('href="@Url.Action("MemberUpload", "HrHome")"')) {
    const cardHtml = `                <a href="@Url.Action("MemberUpload", "HrHome")">
                    <div class="card-with-img-content">
                        <div class="img-content">
                            <img src="/img/member-enrolment.png" alt="Member Upload">
                        </div>
                        <h3>Member Upload</h3>
                        <p>Upload and validate member enrollment spreadsheets.</p>
                    </div>
                </a>\n`
    const target = '<a href="@Url.Action("BulkMemberPolicyUpload", "HrHome" )">'
    if (content.includes(target)) {
      content = content.replace(target, cardHtml + '                ' + target)
      fs.writeFileSync(tpaHrDashPath, content, 'utf8')
      console.log('Added Member Upload card to TPAIndexHRMWC.cshtml')
    }
  } else {
    console.log('Member Upload card already exists in TPAIndexHRMWC.cshtml')
  }
}

// 3. Update HR Dashboard (LawtonIndexHR.cshtml)
const lawtonHrDashPath = path.join(portalDir, 'Views', 'HRHome', 'LawtonIndexHR.cshtml')
if (fs.existsSync(lawtonHrDashPath)) {
  let content = fs.readFileSync(lawtonHrDashPath, 'utf8')
  if (!content.includes('href="@Url.Action("MemberUpload", "HrHome")"')) {
    const cardHtml = `            <a href="@Url.Action("MemberUpload", "HrHome")">
                <div class="card-with-img-content">
                    <div class="img-content">
                        <img src="/img/member-enrolment.png" alt="Member Upload">
                    </div>
                    <h3>Member Upload</h3>
                    <p>Upload and validate member enrollment spreadsheets.</p>
                </div>
            </a>\n`
    const target = '<a href="@Url.Action("BulkMemberPolicyUpload", "HrHome" )">'
    if (content.includes(target)) {
      content = content.replace(target, cardHtml + '            ' + target)
      fs.writeFileSync(lawtonHrDashPath, content, 'utf8')
      console.log('Added Member Upload card to LawtonIndexHR.cshtml')
    }
  } else {
    console.log('Member Upload card already exists in LawtonIndexHR.cshtml')
  }
}

// 4. Update Broker Side Menu (BrokerSideMenu.cshtml)
const brokerMenuPath = path.join(portalDir, 'Views', 'Shared', 'BrokerSideMenu.cshtml')
if (fs.existsSync(brokerMenuPath)) {
  let content = fs.readFileSync(brokerMenuPath, 'utf8')
  if (!content.includes('href="@Url.Action("MemberUpload", "BrokerHome")"')) {
    const linkHtml = `            <li>
                <a href="@Url.Action("MemberUpload", "BrokerHome")">
                    <i class="fa fa-cloud-upload"></i>
                    Member Upload
                </a>
            </li>\n`
    const target = '<a href="@Url.Action("BulkEnrollmentReview", "BrokerHome")">'
    if (content.includes(target)) {
      content = content.replace(target, 'MemberUpload" == "a" ? "" : "")\n' + linkHtml + '                ' + target)
      // cleaner replacement
      content = fs.readFileSync(brokerMenuPath, 'utf8')
      const pos = content.indexOf(target)
      if (pos !== -1) {
        const liStart = content.lastIndexOf('<li>', pos)
        content = content.slice(0, liStart) + linkHtml + content.slice(liStart)
        fs.writeFileSync(brokerMenuPath, content, 'utf8')
        console.log('Added Member Upload link to BrokerSideMenu.cshtml')
      }
    }
  } else {
    console.log('Member Upload link already exists in BrokerSideMenu.cshtml')
  }
}

// 5. Update HR Side Menu (HRSideMenu.cshtml)
const hrMenuPath = path.join(portalDir, 'Views', 'Shared', 'HRSideMenu.cshtml')
if (fs.existsSync(hrMenuPath)) {
  let content = fs.readFileSync(hrMenuPath, 'utf8')
  if (!content.includes('href="@Url.Action("MemberUpload", "HRHome")"')) {
    const linkHtml = `            <li>
                <a href="@Url.Action("MemberUpload", "HRHome")">
                    <i class="fa fa-cloud-upload"></i>
                    Member Upload
                </a>
            </li>\n`
    const target = '<a href="@Url.Action("BulkMemberPolicyUpload", "HRHome")">'
    const pos = content.indexOf(target)
    if (pos !== -1) {
      const liStart = content.lastIndexOf('<li>', pos)
      content = content.slice(0, liStart) + linkHtml + content.slice(liStart)
      fs.writeFileSync(hrMenuPath, content, 'utf8')
      console.log('Added Member Upload link to HRSideMenu.cshtml')
    }
  } else {
    console.log('Member Upload link already exists in HRSideMenu.cshtml')
  }
}

// 6. Update MWC HR Side Menu (MWCHRSideMenu.cshtml)
const mwcHrMenuPath = path.join(portalDir, 'Views', 'Shared', 'MWCHRSideMenu.cshtml')
if (fs.existsSync(mwcHrMenuPath)) {
  let content = fs.readFileSync(mwcHrMenuPath, 'utf8')
  if (!content.includes('href="@Url.Action("MemberUpload", "HRHome")"')) {
    const linkHtml = `            <li>
                <a href="@Url.Action("MemberUpload", "HRHome")">
                    <i class="fa fa-cloud-upload"></i>
                    Member Upload
                </a>
            </li>\n`
    const target = '<a href="@Url.Action("BulkMemberPolicyUpload", "HRHome")">'
    const pos = content.indexOf(target)
    if (pos !== -1) {
      const liStart = content.lastIndexOf('<li>', pos)
      content = content.slice(0, liStart) + linkHtml + content.slice(liStart)
      fs.writeFileSync(mwcHrMenuPath, content, 'utf8')
      console.log('Added Member Upload link to MWCHRSideMenu.cshtml')
    }
  } else {
    console.log('Member Upload link already exists in MWCHRSideMenu.cshtml')
  }
}

console.log('Dashboard cards and sidebar menus update complete!')
