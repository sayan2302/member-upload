import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  DownloadIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FilterIcon,
  SearchIcon,
  CloseIcon,
  ExcelFileIcon,
  ChevronLeftIcon,
  CopyIcon,
  CheckIcon,
  LockIcon,
  UnlockIcon,
  TrashIcon,
  UserIcon,
  InfoIcon,
  ZapIcon,
  MessageSquareIcon,
  TableIcon,
  SparklesIcon,
  DatabaseIcon,
  MaximizeIcon,
  MinimizeIcon,
  BuildingIcon,
  RefreshCwIcon,
  LayersIcon,
  FilterErrorIcon,
} from './Icons.jsx'
import { parseExcelWorkbook } from '../utils/excelParser.js'

export function formatAuditTimestamp(dateStr, { includeSeconds = false } = {}) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'

    const now = new Date()
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()

    const timeOptions = {
      hour: 'numeric',
      minute: '2-digit',
      ...(includeSeconds ? { second: '2-digit' } : {}),
      hour12: true,
    }
    const formattedTime = d.toLocaleTimeString(undefined, timeOptions)

    if (isToday) {
      return formattedTime
    }

    const dateOptions = {
      day: 'numeric',
      month: 'short',
    }
    const formattedDate = d.toLocaleDateString(undefined, dateOptions)
    return `${formattedDate}, ${formattedTime}`
  } catch {
    return '—'
  }
}

export function getActorIdentity(actorObj, fileInfo = {}) {
  let name = ''
  let email = ''

  if (typeof actorObj === 'string') {
    const cleanStr = actorObj.trim()
    if (cleanStr.toLowerCase() !== 'system' && cleanStr.toLowerCase() !== 'system user') {
      if (cleanStr.includes('@')) {
        email = cleanStr
      } else {
        name = cleanStr
      }
    }
  } else if (actorObj && typeof actorObj === 'object') {
    name = actorObj.name || actorObj.uploadedByName || actorObj.username || actorObj.created_by_name || ''
    email = actorObj.email || actorObj.uploadedByEmail || actorObj.userEmail || actorObj.created_by_email || ''

    if (name.toLowerCase() === 'system' || name.toLowerCase() === 'system user') name = ''
    if (email.toLowerCase() === 'system' || email.toLowerCase() === 'system user') email = ''
  }

  // Fallback to genuine file uploader metadata from database
  if (!name && !email) {
    name = fileInfo.uploadedByName || fileInfo.uploaded_by_name || fileInfo.username || fileInfo.uploadedBy || ''
    email = fileInfo.uploadedByEmail || fileInfo.uploaded_by_email || fileInfo.email || fileInfo.userEmail || ''
  }

  if (!name && email) name = email
  if (!email && name && name.includes('@')) email = name

  const role = actorObj?.role || fileInfo?.role || (email.toLowerCase().includes('broker') ? 'broker' : 'hr')

  return {
    name: name || 'HR User',
    email: email !== name ? email : '',
    role: String(role).toUpperCase()
  }
}

export function AuditConsoleLoader({ fileUuid }) {
  const [stepIndex, setStepIndex] = useState(0)

  const steps = [
    { label: 'Ledger Check', desc: 'Fetching metadata and transaction ledger from server...' },
    { label: 'Parse Cycles', desc: 'Reconstructing historical upload cycles and submissions...' },
    { label: 'Verify Events', desc: 'Synchronizing timeline milestones and validation diagnostics...' },
    { label: 'Prepare Console', desc: 'Synthesizing 61-column worksheet grid & diff records...' },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 700)
    return () => clearInterval(timer)
  }, [steps.length])

  const progressPercent = Math.min(100, Math.round(((stepIndex + 1) / steps.length) * 100))

  return (
    <div className="audit-loader-stage">
      <div className="audit-loader-card">
        {/* Top Header Badge */}
        <div className="audit-loader-top-badge">
          <span className="audit-loader-pill">
            <SparklesIcon size={12} className="loader-sparkle-icon" />
            <span>AUDIT LEDGER ENGINE</span>
          </span>
          {fileUuid && (
            <span className="audit-loader-uuid" title={fileUuid}>
              UUID: {fileUuid.substring(0, 13)}…
            </span>
          )}
        </div>

        {/* Centerpiece Scanner Graphic */}
        <div className="audit-scanner-stage">
          <div className="audit-scanner-orb audit-scanner-orb-outer" />
          <div className="audit-scanner-orb audit-scanner-orb-inner" />
          
          <div className="audit-scanner-doc">
            <div className="audit-scanner-beam" />
            <div className="audit-doc-icon-wrap">
              <ExcelFileIcon size={34} />
            </div>
            {/* Animated Mini Grid Lines */}
            <div className="audit-doc-grid-preview">
              <div className="audit-grid-line" style={{ width: '85%' }} />
              <div className="audit-grid-line" style={{ width: '65%' }} />
              <div className="audit-grid-line" style={{ width: '92%' }} />
              <div className="audit-grid-line" style={{ width: '45%' }} />
            </div>
          </div>
        </div>

        {/* Main Headline & Dynamic Subtitle */}
        <div className="audit-loader-headline">
          <h3 className="audit-loader-title">Assembling File Audit Trail</h3>
          <p className="audit-loader-desc">{steps[stepIndex].desc}</p>
        </div>

        {/* Gradient Progress Bar */}
        <div className="audit-progress-track">
          <div 
            className="audit-progress-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Sequence Pills */}
        <div className="audit-steps-row">
          {steps.map((st, i) => {
            const isDone = i < stepIndex
            const isCurrent = i === stepIndex
            return (
              <div 
                key={st.label} 
                className={`audit-step-chip ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-active' : ''}`}
              >
                <span className="step-chip-num">
                  {isDone ? '✓' : (i + 1)}
                </span>
                <span className="step-chip-text">{st.label}</span>
              </div>
            )
          })}
        </div>

        {/* Micro-Skeleton Console Wireframe Preview */}
        <div className="audit-loader-wireframe">
          <div className="wireframe-sidebar">
            <div className="wireframe-pill shimmer" style={{ width: '65%', height: '14px' }} />
            <div className="wireframe-cycle shimmer" style={{ height: '38px' }} />
            <div className="wireframe-cycle shimmer" style={{ height: '38px' }} />
          </div>
          <div className="wireframe-body">
            <div className="wireframe-header shimmer" style={{ width: '45%', height: '16px' }} />
            <div className="wireframe-grid">
              <div className="wireframe-row shimmer" />
              <div className="wireframe-row shimmer" />
              <div className="wireframe-row shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FileAuditConsole({ fileUuid, role, onBack, apiConfig }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [auditData, setAuditData] = useState(null)
  const [baseWorksheet, setBaseWorksheet] = useState(null)
  const [sheetLoading, setSheetLoading] = useState(false)

  // Selected sub-transaction (defaults to latest)
  const [selectedTxId, setSelectedTxId] = useState(null)

  // Filters & Search
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'committed' | 'cancelled'
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCycles, setExpandedCycles] = useState({})
  const [errorsOnly, setErrorsOnly] = useState(false)
  const [copyToast, setCopyToast] = useState(null)
  const [isInspectorFullscreen, setIsInspectorFullscreen] = useState(false)

  // Escape key handler and body overflow lock to exit inspector fullscreen
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isInspectorFullscreen) {
        setIsInspectorFullscreen(false)
      }
    }
    if (isInspectorFullscreen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isInspectorFullscreen])

  // Fetch audit timeline and base file worksheet from S3
  useEffect(() => {
    if (!fileUuid) return
    setLoading(true)
    setError(null)
    setSheetLoading(true)

    const fetchAudit = async () => {
      try {
        const auditPromise = fetch(`${apiConfig.apiBaseUrl}/uploads3/audit/${fileUuid}`, {
          headers: {
            'x-api-key': apiConfig.apiKey,
          },
        }).then(async (res) => {
          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}))
            throw new Error(errBody.error || errBody.detail || `Failed to fetch audit records (${res.status})`)
          }
          return res.json()
        })

        // Fetch actual Excel file from S3 via download endpoint to reconstruct full worksheet
        const filePromise = fetch(
          `${apiConfig.apiBaseUrl}/uploads3/download/${fileUuid}?role=${encodeURIComponent(role || 'hr')}&internal=true`,
          {
            headers: {
              'x-api-key': apiConfig.apiKey,
            },
          }
        )
          .then(async (res) => {
            if (!res.ok) return null
            return res.arrayBuffer()
          })
          .catch(() => null)

        const [data, fileBuffer] = await Promise.all([auditPromise, filePromise])
        setAuditData(data)

        if (fileBuffer) {
          try {
            const parsed = await parseExcelWorkbook(fileBuffer)
            setBaseWorksheet(parsed)
          } catch (e) {
            console.error('[FileAuditConsole] Failed to parse Excel buffer:', e)
          }
        }

        // Only keep the last cycle expanded by default, others collapsed
        const initExpanded = {}
        if (data.cycles && data.cycles.length > 0) {
          const lastCycle = data.cycles[data.cycles.length - 1]
          initExpanded[lastCycle.cycle_id] = true
        }
        setExpandedCycles(initExpanded)

        // Select latest transaction by default
        if (data.cycles && data.cycles.length > 0) {
          const lastCycle = data.cycles[data.cycles.length - 1]
          if (lastCycle.sub_transactions && lastCycle.sub_transactions.length > 0) {
            const lastTx = lastCycle.sub_transactions[lastCycle.sub_transactions.length - 1]
            setSelectedTxId(lastTx.id)
          }
        }
      } catch (err) {
        setError(err.message || 'Unable to load file audit trail.')
      } finally {
        setLoading(false)
        setSheetLoading(false)
      }
    }

    fetchAudit()
  }, [fileUuid, role, apiConfig])

  const fileInfo = auditData?.file || {}
  const summary = auditData?.summary || {}

  // Flatten all transactions for easy lookup
  const allSubTransactions = useMemo(() => {
    if (!auditData?.cycles) return []
    const list = []
    auditData.cycles.forEach((cycle) => {
      cycle.sub_transactions.forEach((st) => {
        list.push({ ...st, parentCycle: cycle })
      })
    })
    return list
  }, [auditData])

  // Active selected transaction
  const activeTx = useMemo(() => {
    if (!selectedTxId) return allSubTransactions[allSubTransactions.length - 1] || null
    return allSubTransactions.find((t) => String(t.id) === String(selectedTxId)) || allSubTransactions[0] || null
  }, [selectedTxId, allSubTransactions])

  // Compute effective interactive worksheet snapshot for selected sub-transaction
  const effectiveSnapshot = useMemo(() => {
    if (
      activeTx?.worksheet_snapshot &&
      Array.isArray(activeTx.worksheet_snapshot.rows) &&
      activeTx.worksheet_snapshot.rows.length > 0
    ) {
      return activeTx.worksheet_snapshot
    }
    return baseWorksheet || null
  }, [activeTx, baseWorksheet])

  // Legacy snapshot detection (when bypassed errors were logged prior to full row persistence)
  const isLegacyRecordWithoutSnapshot = useMemo(() => {
    const hasExplicitSnapshotRows = Boolean(
      activeTx?.worksheet_snapshot &&
      Array.isArray(activeTx.worksheet_snapshot.rows) &&
      activeTx.worksheet_snapshot.rows.length > 0
    )
    const hasLoggedErrors = Boolean(
      activeTx?.bypassed_errors_count > 0 ||
      (activeTx?.action_code === 'FORCE_APPROVED_WITH_ERRORS' && ((fileInfo?.invalid_rows || 0) > 0 || (activeTx?.bypassed_errors_count || 0) > 0)) ||
      (activeTx?.action_code === 'VALIDATION_FAILED' && (fileInfo?.invalid_rows || 0) > 0)
    )
    return !hasExplicitSnapshotRows && hasLoggedErrors
  }, [activeTx, fileInfo])

  const displayTotalRows = useMemo(() => {
    return effectiveSnapshot?.totalRows ?? (fileInfo?.no_of_rows || 0)
  }, [effectiveSnapshot, fileInfo])

  const displayFaultyRows = useMemo(() => {
    if (activeTx?.worksheet_snapshot && activeTx.worksheet_snapshot.rejectedRows !== undefined) {
      return activeTx.worksheet_snapshot.rejectedRows
    }
    if (activeTx?.bypassed_errors_count !== undefined && activeTx?.bypassed_errors_count !== null && activeTx?.bypassed_errors_count > 0) {
      return activeTx.bypassed_errors_count
    }
    if (activeTx?.action_code === 'FORCE_APPROVED_WITH_ERRORS' || activeTx?.action_code === 'VALIDATION_FAILED') {
      return fileInfo?.invalid_rows || 0
    }
    return effectiveSnapshot?.rejectedRows || 0
  }, [effectiveSnapshot, activeTx, fileInfo])

  const displayCleanRows = useMemo(() => {
    if (activeTx?.worksheet_snapshot && activeTx.worksheet_snapshot.acceptedRows !== undefined) {
      return activeTx.worksheet_snapshot.acceptedRows
    }
    return Math.max(0, displayTotalRows - displayFaultyRows)
  }, [effectiveSnapshot, activeTx, displayTotalRows, displayFaultyRows])

  // Search filter across member data inside snapshots
  const matchingTxIds = useMemo(() => {
    if (!searchTerm.trim()) return null
    const term = searchTerm.toLowerCase().trim()
    const matches = new Set()

    allSubTransactions.forEach((tx) => {
      // Check action code or title
      if (tx.action_title?.toLowerCase().includes(term) || tx.action_code?.toLowerCase().includes(term)) {
        matches.add(tx.id)
        return
      }
      // Check actor
      if (tx.actor?.email?.toLowerCase().includes(term) || String(tx.actor?.user_id).includes(term)) {
        matches.add(tx.id)
        return
      }
      // Check comments
      if (tx.rejection_comments?.toLowerCase().includes(term)) {
        matches.add(tx.id)
        return
      }
      // Check worksheet rows
      const rows = tx.worksheet_snapshot?.rows || baseWorksheet?.rows
      if (Array.isArray(rows)) {
        const hasRowMatch = rows.some((r) => {
          if (!r.values) return false
          return Object.values(r.values).some((v) => String(v).toLowerCase().includes(term))
        })
        if (hasRowMatch) matches.add(tx.id)
      }
    })

    return matches
  }, [searchTerm, allSubTransactions, baseWorksheet])

  // Filter cycles based on filterMode and matchingTxIds
  const filteredCycles = useMemo(() => {
    if (!auditData?.cycles) return []

    return auditData.cycles.filter((c) => {
      // Status filter
      if (filterMode === 'committed' && c.cycle_status === 'ABANDONED_CANCELLED') return false
      if (filterMode === 'cancelled' && c.cycle_status !== 'ABANDONED_CANCELLED') return false

      // Search matching filter
      if (matchingTxIds !== null) {
        const hasMatchingSub = c.sub_transactions.some((st) => matchingTxIds.has(st.id))
        if (!hasMatchingSub) return false
      }

      return true
    })
  }, [auditData, filterMode, matchingTxIds])

  const toggleCycle = (cycleId) => {
    setExpandedCycles((prev) => ({
      ...prev,
      [cycleId]: !prev[cycleId],
    }))
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopyToast(label)
    setTimeout(() => setCopyToast(null), 2500)
  }

  if (loading) {
    return (
      <main className="page-shell audit-page-shell">
        <AuditConsoleLoader fileUuid={fileUuid} />
      </main>
    )
  }

  if (error) {
    return (
      <main className="page-shell audit-page-shell">
        <div className="audit-error-container">
          <AlertTriangleIcon size={36} />
          <h3>Failed to Load Audit Trail</h3>
          <p>{error}</p>
          <button type="button" className="modal-btn-primary" onClick={onBack} style={{ marginTop: '16px' }}>
            ← Back to Dashboard
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="page-shell audit-page-shell">
      {/* Toast Notification */}
      {copyToast && (
        <div className="copy-toast">
          <div className="copy-toast-badge"><CheckIcon size={12} /></div>
          <div className="copy-toast-content">Copied <strong>{copyToast}</strong> to clipboard</div>
        </div>
      )}

      {/* ── Fixed Top Command Bar ────────────────────────────────────────── */}
      <div className="audit-header-bar" style={{ marginBottom: '24px' }}>
        <div className="audit-header-left">
          <div className="audit-file-headline">
            <div className="audit-file-icon-wrap" title="Excel Document">
              <ExcelFileIcon size={20} />
            </div>
            <h1 className="audit-file-name" title={fileInfo.file_name}>
              {fileInfo.file_name || 'File Timeline'}
            </h1>
            <span className={`audit-status-badge is-${(fileInfo.status || 'pending').toLowerCase()}`}>
              <span className="status-pulsing-dot" />
              <span>{fileInfo.status ? fileInfo.status.toUpperCase() : 'PENDING'}</span>
            </span>
          </div>
        </div>

        <div className="audit-header-meta">
          <div className="audit-meta-stat" title="Corporate ID">
            <BuildingIcon size={13} className="meta-stat-icon" />
            <span className="meta-stat-label">Corporate ID</span>
            <span className="meta-stat-val">{fileInfo.corp_id || 'N/A'}</span>
          </div>
          <div className="audit-meta-stat" title="Upload Cycles">
            <RefreshCwIcon size={13} className="meta-stat-icon" />
            <span className="meta-stat-label">Cycles</span>
            <span className="meta-stat-val">{summary.total_cycles || 0}</span>
          </div>
          <div className="audit-meta-stat" title="Milestone Events">
            <LayersIcon size={13} className="meta-stat-icon" />
            <span className="meta-stat-label">Milestones</span>
            <span className="meta-stat-val">{summary.total_sub_transactions || 0}</span>
          </div>
        </div>
      </div>

      {/* ── Main Split Console View ──────────────────────────────────────── */}
      <div className="audit-console-body" style={{ marginTop: '24px' }}>
        {/* ── Left Sidebar: Chronological Cycle Stepper ─────────── */}
        <aside className="audit-timeline-col no-print">
          {/* Cycles Accordion List */}
          <div className="timeline-cycles-list">
            {filteredCycles.length === 0 ? (
              <div className="timeline-empty-msg">
                No transaction cycles match the selected filter.
              </div>
            ) : (
              filteredCycles.map((cycle, cIdx) => {
                const isExpanded = !!expandedCycles[cycle.cycle_id]
                const isAbandoned = cycle.cycle_status === 'ABANDONED_CANCELLED'
                const isRejected = cycle.cycle_status === 'REJECTED'
                const isForce = cycle.cycle_status === 'FORCE_APPROVED'

                return (
                  <div
                    key={cycle.cycle_id || cIdx}
                    className={`cycle-card-block ${isAbandoned ? 'is-abandoned' : ''} ${isRejected ? 'is-rejected' : ''} ${isForce ? 'is-force' : ''}`}
                  >
                    {/* Cycle Card Header */}
                    <div className="cycle-card-header" onClick={() => toggleCycle(cycle.cycle_id)}>
                      <div className="cycle-header-top">
                        <div className="cycle-title-group">
                          <span className="cycle-title-text">
                            Cycle {cycle.cycle_seq || cIdx + 1}
                          </span>
                          <span className="cycle-time-badge">
                            {formatAuditTimestamp(cycle.started_at, { includeSeconds: false })}
                          </span>
                        </div>
                        <span className="cycle-toggle-icon">
                          {isExpanded ? <ChevronDownIcon size={13} /> : <ChevronRightIcon size={13} />}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Sub-Transactions */}
                    {isExpanded && (
                      <div className="cycle-substeps-list">
                        {cycle.sub_transactions.map((sub, sIdx) => {
                          const isSelected = String(activeTx?.id) === String(sub.id)
                          const isSubCancelled = sub.is_cancelled
                          const hasErrors = sub.bypassed_errors_count > 0 || (sub.worksheet_snapshot?.rejectedRows > 0)

                          return (
                            <div
                              key={sub.id || sIdx}
                              className={`substep-item ${isSelected ? 'is-active' : ''} ${isSubCancelled ? 'is-cancelled' : ''}`}
                              onClick={() => setSelectedTxId(sub.id)}
                            >
                              <div className="substep-indicator-col">
                                <div className="substep-track-dot" />
                                {sIdx < cycle.sub_transactions.length - 1 && <div className="substep-timeline-connector" />}
                              </div>
                              <div className="substep-content">
                                <div className="substep-top">
                                  <span className="substep-seq">Step {sub.sub_seq || `${cIdx + 1}.${sIdx + 1}`}</span>
                                  <span className="substep-time">
                                    {formatAuditTimestamp(sub.timestamp, { includeSeconds: true })}
                                  </span>
                                </div>
                                <div className="substep-title">{sub.action_title || sub.action_code}</div>
                                {isSubCancelled && (
                                  <div className="substep-cancel-hint">
                                    Session discarded before commit
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </aside>

        {/* ── Right Inspector: Deep Time-Travel Preview ──────────────────── */}
        <section className="audit-inspector-col">
          {(() => {
            if (!activeTx) {
              return (
                <div className="inspector-placeholder">
                  <ClockIcon size={48} />
                  <h3>Select a transaction from the timeline</h3>
                  <p>Choose any cycle or sub-transaction on the left to inspect its historical state.</p>
                </div>
              )
            }

            const inspectorNode = (
              <div className={`inspector-panel ${isInspectorFullscreen ? 'is-fullscreen' : ''}`}>
                {/* Event Context Header */}
                <div className="inspector-event-header">
                  <div className="event-title-group">
                    <div className="event-breadcrumb-strip">
                      <span className="breadcrumb-tag">Cycle {activeTx.cycle_seq || activeTx.parentCycle?.cycle_seq || 1}</span>
                      <span className="breadcrumb-dot">•</span>
                      <span className="breadcrumb-tag is-step">Step {activeTx.sub_seq || '1.1'}</span>
                    </div>
                    <h2 className="event-main-title">{activeTx.action_title || activeTx.action_code}</h2>
                    <div className="event-action-code-row">
                      <span className="event-code-badge">action_code: {activeTx.action_code}</span>
                    </div>
                  </div>

                  {(() => {
                    const actor = getActorIdentity(activeTx.actor || activeTx.parentCycle?.actor, fileInfo)
                    return (
                      <div className="event-actor-card">
                        <div className="actor-avatar-badge">
                          {actor.role === 'BROKER' ? 'BR' : 'HR'}
                        </div>
                        <div className="actor-info">
                          <div className="actor-name-row">
                            <span className="actor-name">{actor.name}</span>
                            <span className={`actor-role-pill is-${actor.role.toLowerCase()}`}>
                              {actor.role}
                            </span>
                          </div>
                          {actor.email && (
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>
                              {actor.email}
                            </div>
                          )}
                          <span className="actor-time" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <ClockIcon size={11} />
                            <span>{new Date(activeTx.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' })}</span>
                          </span>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Special Context Banners */}
                {activeTx.rejection_comments && (
                  <div className="audit-callout-box is-rejection">
                    <div className="callout-icon"><MessageSquareIcon size={16} /></div>
                    <div className="callout-body">
                      <strong>Broker Rejection Feedback Note:</strong>
                      <p className="rejection-quote">"{activeTx.rejection_comments}"</p>
                      {activeTx.rejection_reason && (
                        <span className="rejection-tag">Reason: {activeTx.rejection_reason}</span>
                      )}
                    </div>
                  </div>
                )}

                {activeTx.is_cancelled && (
                  <div className="audit-callout-box is-cancelled">
                    <div className="callout-icon"><AlertTriangleIcon size={16} /></div>
                    <div className="callout-body">
                      <strong>Session Cancelled / Discarded:</strong>
                      <p>The user initiated this session but chose to cancel without committing changes to the database. All exploratory validation states are captured here for complete audit compliance and traceability.</p>
                    </div>
                  </div>
                )}

                {activeTx.action_code === 'FORCE_APPROVED_WITH_ERRORS' && (
                  <div className="audit-callout-box is-force">
                    <div className="callout-icon"><ZapIcon size={16} /></div>
                    <div className="callout-body">
                      <strong>Force Ingestion Executed:</strong>
                      <p>Broker bypassed validation and force-ingested <strong>{activeTx.bypassed_errors_count || 1} faulty record(s)</strong> with fallback sanitization.</p>
                    </div>
                  </div>
                )}

                {/* Legacy Milestone Notice for Historical Records */}
                {isLegacyRecordWithoutSnapshot && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    marginBottom: '14px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#475569',
                    lineHeight: '1.4'
                  }}>
                    <InfoIcon size={18} style={{ color: '#0284c7', flexShrink: 0 }} />
                    <div>
                      <strong>Legacy Milestone Summary:</strong> This transaction recorded <strong>{displayFaultyRows} bypassed error(s)</strong> prior to granular row snapshot persistence. The original file data is rendered below.
                    </div>
                  </div>
                )}

                {/* Action Toolbar for Worksheet Snapshot */}
                <div className="inspector-worksheet-toolbar">
                  <div className="toolbar-stats-strip">
                    <span className="sheet-stat-chip">
                      <TableIcon size={12} />
                      <span>Total Rows: {displayTotalRows}</span>
                    </span>
                    <span className="sheet-stat-chip is-clean">
                      <CheckCircleIcon size={12} style={{ color: '#059669' }} />
                      <span>Clean Rows: {displayCleanRows}</span>
                    </span>
                    <span className={`sheet-stat-chip ${displayFaultyRows > 0 ? 'is-faulty' : ''}`}>
                      <AlertTriangleIcon size={12} style={{ color: displayFaultyRows > 0 ? '#dc2626' : 'currentColor' }} />
                      <span>Faulty Rows: {displayFaultyRows}</span>
                    </span>
                  </div>

                  <div className="toolbar-actions-strip">
                    <div className="broker-icon-btn-wrap">
                      <button
                        type="button"
                        className={`toolbar-btn ${errorsOnly ? 'is-active' : ''}`}
                        onClick={() => setErrorsOnly(!errorsOnly)}
                        aria-label={errorsOnly ? 'Showing Faulty Rows Only' : 'Filter Faulty Rows Only'}
                      >
                        <AlertTriangleIcon size={14} style={{ color: errorsOnly ? '#ffffff' : '#dc2626' }} />
                      </button>
                      <div className="broker-tooltip">
                        <span className="tooltip-title">{errorsOnly ? 'Show All Rows' : 'Filter Faulty Only'}</span>
                        <span className="tooltip-desc">{errorsOnly ? 'Display all member records' : 'Display only rows with validation errors'}</span>
                      </div>
                    </div>

                    <div className="broker-icon-btn-wrap">
                      <button
                        type="button"
                        className={`toolbar-btn ${isInspectorFullscreen ? 'is-active' : ''}`}
                        onClick={() => setIsInspectorFullscreen(!isInspectorFullscreen)}
                        aria-label={isInspectorFullscreen ? 'Exit Fullscreen' : 'Maximize Fullscreen'}
                      >
                        {isInspectorFullscreen ? <MinimizeIcon size={14} /> : <MaximizeIcon size={14} />}
                      </button>
                      <div className="broker-tooltip">
                        <span className="tooltip-title">{isInspectorFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                        <span className="tooltip-desc">{isInspectorFullscreen ? 'Return to normal view (Esc)' : 'Expand worksheet to full screen'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Historical Worksheet Snapshot Preview */}
                <div className="inspector-sheet-wrapper">
                  {effectiveSnapshot && Array.isArray(effectiveSnapshot.rows) && effectiveSnapshot.rows.length > 0 ? (
                    <HistoricalWorksheetTable
                      rows={effectiveSnapshot.rows}
                      errorsOnly={errorsOnly}
                      isLegacy={isLegacyRecordWithoutSnapshot}
                      bypassedCount={displayFaultyRows}
                      baseHeaders={baseWorksheet?.headers}
                      baseRows={baseWorksheet?.rows}
                    />
                  ) : sheetLoading ? (
                    <div className="audit-loading-container" style={{ padding: '40px', minHeight: 'auto' }}>
                      <div className="audit-spinner" />
                      <p style={{ marginTop: '12px', color: '#64748b' }}>Reconstructing interactive worksheet...</p>
                    </div>
                  ) : (
                    <div className="historical-table-empty" style={{ padding: '36px' }}>
                      No worksheet rows available for this file.
                    </div>
                  )}
                </div>
              </div>
            )

            if (isInspectorFullscreen && typeof document !== 'undefined') {
              return createPortal(inspectorNode, document.body)
            }

            return inspectorNode
          })()}
        </section>
      </div>
    </main>
  )
}

/**
 * ── Helper Table for Historical Worksheet Snapshot & Visual Diff ────────
 */
function HistoricalWorksheetTable({
  rows,
  errorsOnly,
  isLegacy,
  bypassedCount,
  baseHeaders,
  baseRows,
}) {
  // Derive column headers unconditionally:
  // 1. Derive from the authentic snapshot rows (so 61-col snapshots show all 61 columns, and 28-col shows 28)
  // 2. Fallback to baseHeaders from raw Excel if rows have no keys
  const colKeys = useMemo(() => {
    const keys = new Set()
    ;(rows || []).forEach((r) => {
      if (r.values && typeof r.values === 'object') {
        Object.keys(r.values).forEach((k) => keys.add(k))
      }
    })
    if (keys.size > 0) {
      return Array.from(keys)
    }

    if (Array.isArray(baseHeaders) && baseHeaders.length > 0) {
      return baseHeaders.map((h) => (typeof h === 'string' ? h : h.name)).filter(Boolean)
    }

    return []
  }, [rows, baseHeaders])

  // Filter display rows unconditionally
  const displayRows = useMemo(() => {
    if (!errorsOnly) return rows || []
    return (rows || []).filter((r) => !r.valid || (Array.isArray(r.errors) && r.errors.length > 0))
  }, [rows, errorsOnly])

  const getCellValue = (r, rIdx, col) => {
    // 1. Direct match in r.values
    if (r.values && r.values[col] !== undefined && r.values[col] !== null && r.values[col] !== '') {
      return String(r.values[col])
    }

    // 2. Normalized key match in r.values
    const norm = col.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    if (r.values && r.values[norm] !== undefined && r.values[norm] !== null && r.values[norm] !== '') {
      return String(r.values[norm])
    }

    // 3. Case-insensitive key match in r.values
    if (r.values && typeof r.values === 'object') {
      const match = Object.keys(r.values).find((k) => k.toLowerCase() === col.toLowerCase())
      if (match && r.values[match] !== undefined && r.values[match] !== null && r.values[match] !== '') {
        return String(r.values[match])
      }
    }

    // 4. Fallback to baseRow from the raw Excel file
    if (Array.isArray(baseRows) && baseRows.length > 0) {
      const baseRow = baseRows.find((br) => br.sourceRow === r.sourceRow || br.row === r.row) || baseRows[rIdx]
      if (baseRow && baseRow.values) {
        if (baseRow.values[col] !== undefined && baseRow.values[col] !== null && baseRow.values[col] !== '') {
          return String(baseRow.values[col])
        }
        if (baseRow.values[norm] !== undefined && baseRow.values[norm] !== null && baseRow.values[norm] !== '') {
          return String(baseRow.values[norm])
        }
        const bMatch = Object.keys(baseRow.values).find((k) => k.toLowerCase() === col.toLowerCase())
        if (bMatch && baseRow.values[bMatch] !== undefined && baseRow.values[bMatch] !== null && baseRow.values[bMatch] !== '') {
          return String(baseRow.values[bMatch])
        }
      }
    }

    return '—'
  }

  const getFieldError = (r, col) => {
    if (!Array.isArray(r.errors) || r.errors.length === 0) return null
    const normCol = col.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    return r.errors.find((e) => {
      if (!e.field) return false
      const fLower = e.field.toLowerCase()
      const fNorm = fLower.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
      return fLower === col.toLowerCase() || fNorm === normCol || col.toLowerCase().includes(fLower)
    })
  }

  if (displayRows.length === 0) {
    return (
      <div
        className="historical-table-scroller"
        style={{
          minHeight: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: '36px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: isLegacy ? '#e0f2fe' : '#d1fae5',
              color: isLegacy ? '#0284c7' : '#059669',
              fontSize: '22px',
              fontWeight: 'bold',
              marginBottom: '10px',
            }}
          >
            {isLegacy ? <InfoIcon size={22} /> : <CheckIcon size={22} />}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
            {isLegacy ? 'Summary-Level Error Record' : 'Zero Faulty Rows in This Snapshot'}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', maxWidth: '440px', margin: '0 auto', lineHeight: '1.5' }}>
            {isLegacy
              ? `This legacy milestone recorded ${bypassedCount || 1} bypassed error(s) prior to full row snapshot persistence. Click the button above to view all records.`
              : `All ${(rows || []).length} member records passed validation with 0 errors. Click the button above to view all records.`}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="historical-table-scroller-wrap">
      <div className="historical-table-scroller">
        <table className="historical-data-table">
        <thead>
          <tr>
            <th style={{ width: '60px' }}>Row #</th>
            <th style={{ width: '90px' }}>Status</th>
            {colKeys.map((col) => (
              <th key={col}>{col.replace(/_/g, ' ').toUpperCase()}</th>
            ))}
            <th>Error Details</th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((r, rIdx) => {
              const hasErrors = !r.valid || (Array.isArray(r.errors) && r.errors.length > 0)

              return (
                <tr key={r.sourceRow ?? r.row ?? rIdx} className={hasErrors ? 'is-row-error' : 'is-row-valid'}>
                  <td className="cell-row-num" style={{ fontWeight: 600, color: '#64748b' }}>{r.sourceRow || r.row || rIdx + 1}</td>
                  <td className="cell-status">
                    <span className={`status-pill ${hasErrors ? 'is-error' : 'is-valid'}`} style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: !hasErrors ? '#d1fae5' : '#fee2e2',
                      color: !hasErrors ? '#065f46' : '#991b1b',
                    }}>
                      {hasErrors ? 'FAULTY' : 'VALID'}
                    </span>
                  </td>
                  {colKeys.map((col) => {
                    const fieldError = getFieldError(r, col)
                    const val = getCellValue(r, rIdx, col)

                    return (
                      <td
                        key={col}
                        className={fieldError ? 'cell-has-error' : ''}
                        title={fieldError ? (fieldError.message || (fieldError.remarks || []).join('; ')) : undefined}
                      >
                        <span>{val}</span>
                      </td>
                    )
                  })}
                  <td className="cell-error-notes">
                    {r.errors && r.errors.length > 0 ? (
                      <ul className="row-error-list">
                        {r.errors.map((err, eIdx) => (
                          <li key={eIdx}>
                            <strong>{err.field ? `${err.field}: ` : ''}</strong>
                            {err.message || (err.remarks || []).join('; ')}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="no-error-dash" style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>
                    )}
                  </td>
                </tr>
              )
            })
          }
        </tbody>
      </table>
    </div>
    <div className="sheet-footer-statusbar">
      <div className="statusbar-left">
        <span className="statusbar-dot" />
        <span>Showing <strong>{displayRows.length}</strong> record{displayRows.length === 1 ? '' : 's'}</span>
        <span className="statusbar-sep">•</span>
        <span><strong>{colKeys.length}</strong> columns</span>
      </div>
    </div>
  </div>
  )
}
