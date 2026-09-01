import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/member-upload.css'
import MemberUpload from '../components/MemberUpload.jsx'
import { DevToolbar } from '../components/DevToolbar.jsx'

function DevApp() {
  const getInitialParams = () => {
    const params = new URLSearchParams(window.location.search)
    const roleParam = params.get('role')?.toLowerCase()
    const corpIdParam = params.get('corp_id')
    const providerCorpIdParam = params.get('provider_corp_id')
    const brokerIdParam = params.get('broker_id')

    return {
      role: roleParam === 'broker' ? 'broker' : 'hr',
      corpId: corpIdParam || '1422104',
      providerCorpId: providerCorpIdParam || '1422104',
      brokerId: brokerIdParam || '120',
    }
  }

  const [config, setConfig] = useState(getInitialParams)

  const handleChangeMode = (newRole, newCorpId, newProviderCorpId, newBrokerId) => {
    setConfig({
      role: newRole,
      corpId: newCorpId,
      providerCorpId: newProviderCorpId,
      brokerId: newBrokerId,
    })

    const params = new URLSearchParams()
    params.set('role', newRole)
    if (newRole === 'broker') {
      params.set('broker_id', newBrokerId)
    } else {
      params.set('corp_id', newCorpId)
      params.set('provider_corp_id', newProviderCorpId)
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState(null, '', newUrl)
  }

  // Pre-configured mock data matching real DB entities in Lawton_Provider.pmr.ENTITY
  const isGroupHR = config.role === 'hr' && String(config.corpId) === String(config.providerCorpId)

  let mockCorporates = [{ id: '1422104', name: 'Bangkok Patana School' }]
  let mockPolicies = [
    { id: '411932', pol_id: '411932', policy_no: 'BPS_Local_OP_16022026', policy_name: 'Local Outpatient Plan', corp_id: '1422104' },
    { id: '411933', pol_id: '411933', policy_no: 'BPS_Local_TOPUP_16022026', policy_name: 'Local Top-up Plan', corp_id: '1422104' },
    { id: '411934', pol_id: '411934', policy_no: 'HS256576', policy_name: 'Hospital & Surgical', corp_id: '1422104' },
    { id: '411935', pol_id: '411935', policy_no: 'DEN_BPS_2026_01', policy_name: 'Executive Dental Rider', corp_id: '1422104' },
    { id: '411936', pol_id: '411936', policy_no: 'MAT_BPS_2026_02', policy_name: 'Maternity Benefit Tier A', corp_id: '1422104' },
    { id: '411937', pol_id: '411937', policy_no: 'VIS_BPS_2026_03', policy_name: 'Vision Care Standard', corp_id: '1422104' },
    { id: '411938', pol_id: '411938', policy_no: 'LIFE_BPS_2026_04', policy_name: 'Group Term Life Extended', corp_id: '1422104' },
    { id: '411939', pol_id: '411939', policy_no: 'PA_BPS_2026_05', policy_name: 'Personal Accident Plan', corp_id: '1422104' },
    { id: '411940', pol_id: '411940', policy_no: 'CI_BPS_2026_06', policy_name: 'Critical Illness Protection', corp_id: '1422104' },
  ]

  if (isGroupHR) {
    // Group Corporate: corp_id === provider_corp_id (e.g. 1422138 with 2 child entities in pmr.ENTITY)
    mockCorporates = [
      { id: '1422135', name: 'A3 Test industries' },
      { id: '1422138', name: 'ELTS Corporate' },
    ]
    mockPolicies = [
      { id: '412849', pol_id: '412849', policy_no: '900010062026_J10', policy_name: 'Group Health Standard', corp_id: '1422135' },
      { id: '412854', pol_id: '412854', policy_no: 'EL_97238928391606', policy_name: 'Comprehensive Care Plan', corp_id: '1422138' },
    ]
  } else if (config.role === 'broker') {
    mockCorporates = [
      { id: '1422104', name: 'Bangkok Patana School' },
      { id: '1422135', name: 'A3 Test industries' },
      { id: '1422138', name: 'ELTS Corporate' },
    ]
    mockPolicies = [
      { id: '411932', pol_id: '411932', policy_no: 'BPS_Local_OP_16022026', policy_name: 'Local Outpatient Plan', corp_id: '1422104' },
      { id: '411933', pol_id: '411933', policy_no: 'BPS_Local_TOPUP_16022026', policy_name: 'Local Top-up Plan', corp_id: '1422104' },
      { id: '411934', pol_id: '411934', policy_no: 'HS256576', policy_name: 'Hospital & Surgical', corp_id: '1422104' },
      { id: '411935', pol_id: '411935', policy_no: 'DEN_BPS_2026_01', policy_name: 'Executive Dental Rider', corp_id: '1422104' },
      { id: '411936', pol_id: '411936', policy_no: 'MAT_BPS_2026_02', policy_name: 'Maternity Benefit Tier A', corp_id: '1422104' },
      { id: '411937', pol_id: '411937', policy_no: 'VIS_BPS_2026_03', policy_name: 'Vision Care Standard', corp_id: '1422104' },
      { id: '411938', pol_id: '411938', policy_no: 'LIFE_BPS_2026_04', policy_name: 'Group Term Life Extended', corp_id: '1422104' },
      { id: '411939', pol_id: '411939', policy_no: 'PA_BPS_2026_05', policy_name: 'Personal Accident Plan', corp_id: '1422104' },
      { id: '411940', pol_id: '411940', policy_no: 'CI_BPS_2026_06', policy_name: 'Critical Illness Protection', corp_id: '1422104' },
      { id: '412849', pol_id: '412849', policy_no: '900010062026_J10', policy_name: 'Group Health Standard', corp_id: '1422135' },
      { id: '412854', pol_id: '412854', policy_no: 'EL_97238928391606', policy_name: 'Comprehensive Care Plan', corp_id: '1422138' },
    ]
  }

  return (
    <>
      <DevToolbar
        role={config.role}
        corpId={config.corpId}
        providerCorpId={config.providerCorpId}
        brokerId={config.brokerId}
        onChangeMode={handleChangeMode}
      />
      <div className="bmpu-page" style={{ padding: '16px 24px 32px 24px', background: '#ffffff', minHeight: 'auto', boxSizing: 'border-box' }}>
        <div className="bmpu-breadcrumb-row" style={{ marginBottom: '14px' }}>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb m-b-0" id="portal-breadcrumb-list" style={{ background: 'transparent', padding: 0, margin: 0, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', listStyle: 'none' }}>
              <li className="breadcrumb-item"><a href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Home</a></li>
              <li className="breadcrumb-item active" style={{ color: '#64748b' }}>Member Data Upload</li>
            </ol>
          </nav>
        </div>
        <MemberUpload
          key={`${config.role}-${config.providerCorpId}-${config.corpId}-${config.brokerId}`}
          role={config.role}
          corpId={config.corpId}
          providerCorpId={config.providerCorpId}
          brokerId={config.brokerId}
          corporates={mockCorporates}
          policies={mockPolicies}
        />
      </div>
    </>
  )
}

function initMemberUpload() {
  const targetElement =
    document.getElementById('member-upload-root') ||
    document.getElementById('root')

  if (!targetElement) {
    console.warn('[MemberUpload] No mount container found (#member-upload-root or #root)')
    return
  }

  if (import.meta.env.DEV && targetElement.id === 'root') {
    createRoot(targetElement).render(
      <StrictMode>
        <DevApp />
      </StrictMode>
    )
  } else {
    const globalConfig = window.__MEMBER_UPLOAD_CONFIG__ || {}
    const roleAttr = targetElement.getAttribute('data-role')
    const corpIdAttr = targetElement.getAttribute('data-corp-id')
    const providerCorpIdAttr = targetElement.getAttribute('data-provider-corp-id')
    const brokerIdAttr = targetElement.getAttribute('data-broker-id')
    const optionsUrl = targetElement.getAttribute('data-options-url') || globalConfig.optionsUrl || null
    const corporatesAttr = targetElement.getAttribute('data-corporates')
    const policiesAttr = targetElement.getAttribute('data-policies')

    let corporates = null
    if (corporatesAttr) {
      try {
        const parsed = JSON.parse(corporatesAttr)
        if (Array.isArray(parsed)) corporates = parsed
      } catch (e) {
        console.warn('[MemberUpload] Failed to parse data-corporates JSON', e)
      }
    }
    if (!corporates && Array.isArray(globalConfig.corporates)) {
      corporates = globalConfig.corporates
    }

    const firstCorpId = Array.isArray(corporates) && corporates.length > 0 && corporates[0].id && corporates[0].id !== '0'
      ? String(corporates[0].id).trim()
      : null

    const rawCorpId = corpIdAttr && corpIdAttr.trim() !== '' && corpIdAttr.trim() !== '0'
      ? corpIdAttr.trim()
      : null

    const rawProviderId = providerCorpIdAttr && providerCorpIdAttr.trim() !== '' && providerCorpIdAttr.trim() !== '0'
      ? providerCorpIdAttr.trim()
      : null

    const urlParams = new URLSearchParams(window.location.search)
    const urlRole = urlParams.get('role')?.toLowerCase()
    const pathLower = window.location.pathname.toLowerCase()
    const isBrokerPath = pathLower.includes('/brokerhome') || pathLower.includes('/broker')
    const isHRPath = pathLower.includes('/hrhome') || pathLower.includes('/hr')
    const pathRole = isBrokerPath ? 'broker' : isHRPath ? 'hr' : null

    const role = (urlRole || pathRole || roleAttr || globalConfig.role || 'hr').toLowerCase()
    const corpId = rawCorpId || rawProviderId || firstCorpId || globalConfig.corpId || globalConfig.corp_id || (role === 'hr' ? '1422138' : '')
    const providerCorpId = rawProviderId || corpId
    const brokerId = (brokerIdAttr && brokerIdAttr.trim() !== '')
      ? brokerIdAttr.trim()
      : (globalConfig.brokerId || globalConfig.broker_id || (role === 'broker' ? '120' : ''))

    let policies = null
    if (policiesAttr) {
      try {
        const parsed = JSON.parse(policiesAttr)
        if (Array.isArray(parsed)) policies = parsed
      } catch (e) {
        console.warn('[MemberUpload] Failed to parse data-policies JSON', e)
      }
    }
    if (!policies && Array.isArray(globalConfig.policies)) {
      policies = globalConfig.policies
    }

    const userEmailAttr = targetElement.getAttribute('data-user-email')
    const userNameAttr = targetElement.getAttribute('data-user-name')
    const userIdAttr = targetElement.getAttribute('data-user-id')

    const domUser = document.querySelector('.header-user span')?.textContent?.trim() || ''

    const userEmail = (userEmailAttr && userEmailAttr.trim() !== '')
      ? userEmailAttr.trim()
      : (globalConfig.userEmail || globalConfig.user_email || (domUser.includes('@') ? domUser : ''))
    const userName = (userNameAttr && userNameAttr.trim() !== '')
      ? userNameAttr.trim()
      : (globalConfig.userName || globalConfig.user_name || domUser || userEmail)
    const userId = (userIdAttr && userIdAttr.trim() !== '')
      ? userIdAttr.trim()
      : (globalConfig.userId || globalConfig.user_id || '')

    createRoot(targetElement).render(
      <StrictMode>
        <MemberUpload
          role={role}
          corpId={corpId}
          providerCorpId={providerCorpId}
          brokerId={brokerId}
          optionsUrl={optionsUrl}
          corporates={corporates}
          policies={policies}
          userEmail={userEmail}
          userName={userName}
          userId={userId}
        />
      </StrictMode>
    )
  }
}

initMemberUpload()
