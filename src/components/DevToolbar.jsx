import { useState } from 'react'

export function DevToolbar({
  role,
  corpId,
  providerCorpId,
  brokerId,
  onChangeMode,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [customCorpId, setCustomCorpId] = useState(corpId || '1422104')
  const [customProviderCorpId, setCustomProviderCorpId] = useState(providerCorpId || '1018900')
  const [customBrokerId, setCustomBrokerId] = useState(brokerId || '120')

  const handleApply = (e) => {
    e.preventDefault()
    if (role === 'broker') {
      onChangeMode('broker', customCorpId, customProviderCorpId, customBrokerId.trim())
    } else {
      onChangeMode('hr', customCorpId.trim(), customProviderCorpId.trim(), customBrokerId)
    }
  }

  const handlePreset = (presetType) => {
    if (presetType === 'single-hr') {
      setCustomCorpId('1422104')
      setCustomProviderCorpId('1018900')
      onChangeMode('hr', '1422104', '1018900', brokerId)
    } else if (presetType === 'group-hr') {
      setCustomCorpId('1422138')
      setCustomProviderCorpId('1422138')
      onChangeMode('hr', '1422138', '1422138', brokerId)
    } else if (presetType === 'broker') {
      setCustomBrokerId('120')
      onChangeMode('broker', corpId, providerCorpId, '120')
    }
  }

  // Rule: if role is HR and corp_id === provider_corp_id -> Group Corporate
  const isGroupHR = role === 'hr' && String(corpId) === String(providerCorpId)
  const isSingleHR = role === 'hr' && String(corpId) !== String(providerCorpId)

  if (isCollapsed) {
    return (
      <div style={styles.collapsedBadge} onClick={() => setIsCollapsed(false)}>
        <span style={styles.badgeText}>
          Dev: <strong>{role.toUpperCase()}</strong>{' '}
          {role === 'broker'
            ? `(Broker #${brokerId})`
            : isGroupHR
            ? `(Group HR: corp_id = provider_corp_id = ${corpId})`
            : `(Single HR: corp_id = ${corpId}, provider = ${providerCorpId})`}
        </span>
        <span style={styles.badgeExpand}>Expand ▾</span>
      </div>
    )
  }

  return (
    <aside style={styles.container} aria-label="Developer Testing Toolbar">
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <span style={styles.title}>Vite Standalone Testing Toolbar</span>
          <span style={styles.devTag}>DEV ONLY</span>
        </div>
        <button
          type="button"
          style={styles.collapseBtn}
          onClick={() => setIsCollapsed(true)}
          title="Minimize toolbar"
        >
          Hide ▴
        </button>
      </div>

      <div style={styles.body}>
        {/* Quick Role & Mode Presets */}
        <div style={styles.section}>
          <span style={styles.label}>Portal Type:</span>
          <div style={styles.btnGroup}>
            <button
              type="button"
              style={{
                ...styles.modeBtn,
                ...(isSingleHR ? styles.modeBtnActive : {}),
              }}
              onClick={() => handlePreset('single-hr')}
              title="Single HR: corp_id != provider_corp_id"
            >
              Single Corporate (1422104)
            </button>
            <button
              type="button"
              style={{
                ...styles.modeBtn,
                ...(isGroupHR ? styles.modeBtnActive : {}),
              }}
              onClick={() => handlePreset('group-hr')}
              title="Group HR: corp_id == provider_corp_id (1422138)"
            >
              Group Corporate (1422138)
            </button>
            <button
              type="button"
              style={{
                ...styles.modeBtn,
                ...(role === 'broker' ? styles.modeBtnActive : {}),
              }}
              onClick={() => handlePreset('broker')}
              title="Broker / Partner Portal"
            >
              Broker / Partner (120)
            </button>
          </div>
        </div>

        {/* Custom IDs Form */}
        <form onSubmit={handleApply} style={styles.customForm}>
          {role === 'broker' ? (
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="dev-broker-id">Broker ID:</label>
              <input
                id="dev-broker-id"
                type="text"
                value={customBrokerId}
                onChange={(e) => setCustomBrokerId(e.target.value)}
                placeholder="e.g. 120"
                style={styles.input}
              />
            </div>
          ) : (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="dev-corp-id">corp_id:</label>
                <input
                  id="dev-corp-id"
                  type="text"
                  value={customCorpId}
                  onChange={(e) => setCustomCorpId(e.target.value)}
                  placeholder="e.g. 1422104"
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="dev-provider-corp-id">provider_corp_id:</label>
                <input
                  id="dev-provider-corp-id"
                  type="text"
                  value={customProviderCorpId}
                  onChange={(e) => setCustomProviderCorpId(e.target.value)}
                  placeholder="e.g. 1422138"
                  style={styles.input}
                />
              </div>
            </>
          )}
          <button type="submit" style={styles.applyBtn}>
            Apply IDs
          </button>
        </form>
      </div>

      {/* Active Diagnostics Summary */}
      <div style={styles.footer}>
        <span style={styles.footerItem}>
          <strong>Active Portal:</strong>{' '}
          <span style={{ color: role === 'broker' ? '#38bdf8' : isGroupHR ? '#f59e0b' : '#4ade80' }}>
            {role === 'broker' ? 'BROKER / PARTNER' : isGroupHR ? 'GROUP CORPORATE / HR' : 'SINGLE CORPORATE / HR'}
          </span>
        </span>
        <span style={styles.footerItem}>
          <strong>corp_id (E_Id):</strong> <code>"{corpId}"</code>
        </span>
        <span style={styles.footerItem}>
          <strong>provider_corp_id (E_ParentId):</strong> <code>"{providerCorpId}"</code>
        </span>
        <span style={styles.footerItem}>
          <strong>Rule Match:</strong>{' '}
          <em style={{ color: isGroupHR ? '#fbbf24' : '#94a3b8' }}>
            {role === 'broker'
              ? 'Broker mode (passes broker_id)'
              : isGroupHR
              ? 'corp_id == provider_corp_id (Group Corporate)'
              : 'corp_id != provider_corp_id (Single Corporate)'}
          </em>
        </span>
      </div>
    </aside>
  )
}

const styles = {
  container: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    color: '#e2e8f0',
    padding: '10px 20px',
    borderBottom: '2px solid #3b82f6',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    fontSize: '13px',
    fontFamily: 'Inter, system-ui, sans-serif',
    zIndex: 9999,
    position: 'sticky',
    top: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  badgeIcon: {
    fontSize: '16px',
  },
  title: {
    fontWeight: '700',
    fontSize: '14px',
    letterSpacing: '-0.01em',
    color: '#ffffff',
  },
  devTag: {
    background: '#dc2626',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '4px',
    letterSpacing: '0.05em',
  },
  collapseBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: '#94a3b8',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
  },
  body: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  section: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  label: {
    fontWeight: '600',
    color: '#94a3b8',
    fontSize: '12px',
  },
  btnGroup: {
    display: 'flex',
    gap: '6px',
  },
  modeBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#cbd5e1',
    padding: '5px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.15s ease',
  },
  modeBtnActive: {
    background: '#2563eb',
    borderColor: '#3b82f6',
    color: '#ffffff',
    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
  },
  customForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  input: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    color: '#ffffff',
    padding: '4px 8px',
    fontSize: '12px',
    width: '100px',
    outline: 'none',
  },
  applyBtn: {
    background: '#10b981',
    border: 'none',
    color: '#ffffff',
    padding: '5px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '700',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    paddingTop: '6px',
    fontSize: '11px',
    color: '#94a3b8',
    flexWrap: 'wrap',
  },
  footerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  collapsedBadge: {
    position: 'fixed',
    top: '10px',
    right: '10px',
    background: '#1e293b',
    color: '#e2e8f0',
    border: '1px solid #3b82f6',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  badgeText: {
    fontSize: '12px',
  },
  badgeExpand: {
    color: '#38bdf8',
    fontSize: '11px',
    fontWeight: '600',
  },
}
