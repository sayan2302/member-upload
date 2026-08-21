import fs from 'node:fs'
import path from 'node:path'

const viewPath = path.resolve('c:/ALL/OFFICE/mayfairmemberportal/Site/Views/HRHome/BulkMemberPolicyUpload.cshtml')

const viewContent = `@model Site.Models.CorporateConfigModel
@{
    MemberPortal.Interface.Utility.ITPAUnSignedConfiguration unSignedConfig = null;
    try
    {
        unSignedConfig = MemberPortal.Interface.Utility.TPAConfigurationsFactory.Instance.GetUnSignedTPAConfig();
    }
    catch
    {
        unSignedConfig = MemberPortal.Interface.Utility.TPAConfigurationsFactory.Instance.GetUnSignedTPAConfig(HttpContext.Current.Request.Url.DnsSafeHost.ToLower());
    }
    if (unSignedConfig != null && !string.IsNullOrEmpty(unSignedConfig.LayoutPage))
    {
        Layout = unSignedConfig.LayoutPage;
    }
    long corpId = Model != null && Model.CorporateConfig != null ? Model.CorporateConfig.CorpId : 0;
    long providerCorpId = MemberPortal.Interface.Utility.UserContext.Current != null && MemberPortal.Interface.Utility.UserContext.Current.ProviderCorpID > 0
        ? MemberPortal.Interface.Utility.UserContext.Current.ProviderCorpID
        : corpId;

    var corpList = new List<object>();
    var hrCtx = MemberPortal.Interface.Utility.UserContext.Current as MemberPortal.Interface.Utility.CorpHRContext;
    if (hrCtx != null && hrCtx.SubCorporates != null && hrCtx.SubCorporates.Count > 0)
    {
        foreach (var kv in hrCtx.SubCorporates)
        {
            corpList.Add(new { id = kv.Key.ToString(), name = kv.Value });
        }
    }
    else
    {
        string cName = "Corporate";
        if (Model != null && Model.CorporateConfig != null)
        {
            if (Model.CorporateConfig.AddDetail != null && !string.IsNullOrEmpty(Model.CorporateConfig.AddDetail.DisplayName))
            {
                cName = Model.CorporateConfig.AddDetail.DisplayName;
            }
            else if (!string.IsNullOrEmpty(Model.CorporateConfig.ShortName))
            {
                cName = Model.CorporateConfig.ShortName;
            }
        }
        corpList.Add(new { id = corpId.ToString(), name = cName });
    }
    string corpJson = Newtonsoft.Json.JsonConvert.SerializeObject(corpList);
    long ticks = DateTime.UtcNow.Ticks;
}

@if (Model != null && Model.IsAdminBroker)
{
    @Html.Partial("AdminBrokerSideMenu")
}
else
{
    @Html.Partial("BrokerSideMenu")
}

<link rel="stylesheet" href="~/css/react-dist/member-upload.css?v=@ticks" />

<div class="bmpu-page" style="padding: 20px 24px 24px 24px; background: #f8fafc; min-height: calc(100vh - 73px); box-sizing: border-box;">
    <!-- Breadcrumb -->
    <div style="margin-bottom: 12px;">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb" style="background: transparent; padding: 0; margin: 0; font-size: 13px; list-style: none; display: flex; gap: 6px;">
                <li class="breadcrumb-item">
                    <a href="@(Model != null && Model.IsAdminBroker ? Url.Action("IndexHR", "HRHome") : Url.Action("IndexBrokerMayfair", "BrokerHome"))" style="color: #2563eb; text-decoration: none;">Home</a>
                    <span style="color: #94a3b8;">/</span>
                </li>
                <li class="c-item active" style="color: #64748b;" aria-current="page">Member Data Upload</li>
            </ol>
        </nav>
    </div>

    <!-- React Mount Container -->
    <div id="member-upload-root"
         data-role="@(Model != null && Model.IsAdminBroker ? "hr" : "broker")"
         data-corp-id="@corpId"
         data-provider-corp-id="@providerCorpId"
         data-corporates='@Html.Raw(corpJson)'
         data-options-url="@ViewBag.AjaxOptionsUrl">
    </div>
</div>

<script type="module" src="~/js/react-dist/memberUpload.js?v=@ticks"></script>
`

fs.writeFileSync(viewPath, viewContent, 'utf8')
console.log('[OK] Updated BulkMemberPolicyUpload.cshtml with correct CorporateConfig property access')
