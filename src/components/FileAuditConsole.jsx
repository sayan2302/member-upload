import { useState, useEffect, useMemo } from 'react'
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
  LockIcon,
  UnlockIcon,
  TrashIcon,
} from './Icons.jsx'
import { parseExcelWorkbook } from '../utils/excelParser.js'

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
          `${apiConfig.apiBaseUrl}/uploads3/download/${fileUuid}?role=${encodeURIComponent(role || 'hr')}`,
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

        // Expand all cycles by default
        const initExpanded = {}
        if (data.cycles) {
          data.cycles.forEach((c) => {
            initExpanded[c.cycle_id] = true
          })
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
    return allSubTransactions.find((t) => t.id === selectedTxId) || allSubTransactions[0] || null
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
        <div className="audit-loading-container">
          <div className="audit-spinner" />
          <h3>Loading Forensic File Timeline…</h3>
          <p>Reconstructing hierarchical transaction cycles and historical worksheet snapshots.</p>
        </div>
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
          <div className="copy-toast-badge">✓</div>
          <div className="copy-toast-content">Copied <strong>{copyToast}</strong> to clipboard</div>
        </div>
      )}

      {/* ── Fixed Top Command Bar ────────────────────────────────────────── */}
      <header className="audit-header-bar">
        <div className="audit-header-left">
          <button type="button" className="audit-back-btn" onClick={onBack} title="Return to Dashboard">
            ← Back to Dashboard
          </button>
          <div className="audit-file-headline">
            <h1 className="audit-file-name" title={fileInfo.file_name}>
              {fileInfo.file_name || 'File Timeline'}
            </h1>
            <span
              className="audit-uuid-pill"
              onClick={() => copyToClipboard(fileInfo.uuid, 'File UUID')}
              title="Click to copy full UUID"
            >
              UUID: {fileInfo.uuid ? fileInfo.uuid.substring(0, 13) + '…' : ''} 📋
            </span>
            <span className={`audit-status-badge is-${(fileInfo.status || 'pending').toLowerCase()}`}>
              {fileInfo.status ? fileInfo.status.toUpperCase() : 'PENDING'}
            </span>
          </div>
        </div>

        <div className="audit-header-meta">
          <div className="audit-meta-stat">
            <span className="meta-stat-label">Corporate</span>
            <span className="meta-stat-val">ID: {fileInfo.corp_id || 'N/A'}</span>
          </div>
          <div className="audit-meta-stat">
            <span className="meta-stat-label">Cycles</span>
            <span className="meta-stat-val">{summary.total_cycles || 0}</span>
          </div>
          <div className="audit-meta-stat">
            <span className="meta-stat-label">Sub-Transactions</span>
            <span className="meta-stat-val">{summary.total_sub_transactions || 0}</span>
          </div>
        </div>
      </header>

      {/* ── Main Split Console View ──────────────────────────────────────── */}
      <div className="audit-console-body">
        {/* ── Left Sidebar: Chronological Cycle Stepper & Search ─────────── */}
        <aside className="audit-timeline-col no-print">
          {/* Search Member / Keyword */}
          <div className="timeline-search-box">
            <SearchIcon size={14} />
            <input
              type="text"
              placeholder="Search Member, Staff ID, or Error…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="timeline-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="timeline-filter-pills">
            <button
              type="button"
              className={`timeline-pill ${filterMode === 'all' ? 'is-active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              All ({auditData?.cycles?.length || 0})
            </button>
            <button
              type="button"
              className={`timeline-pill ${filterMode === 'committed' ? 'is-active' : ''}`}
              onClick={() => setFilterMode('committed')}
            >
              Committed ({summary.committed_count || 0})
            </button>
            <button
              type="button"
              className={`timeline-pill is-abandoned ${filterMode === 'cancelled' ? 'is-active' : ''}`}
              onClick={() => setFilterMode('cancelled')}
            >
              Cancelled ({summary.abandoned_count || 0})
            </button>
          </div>

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
                        <span className="cycle-seq-badge">Cycle {cycle.cycle_seq || cIdx + 1}</span>
                        <span className={`cycle-status-pill is-${(cycle.cycle_status || 'committed').toLowerCase()}`}>
                          {isAbandoned ? '⚠️ Cancelled / Aborted' : isRejected ? '❌ Rejected' : isForce ? '⚡ Force Approved' : '✅ Committed'}
                        </span>
                        <span className="cycle-toggle-icon">
                          {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
                        </span>
                      </div>

                      <h4 className="cycle-title">{cycle.cycle_label || 'File Session'}</h4>

                      <div className="cycle-meta-row">
                        <span className="cycle-actor-text">
                          👤 {cycle.actor?.email || cycle.actor?.user_id || 'System'}
                        </span>
                        <span className="cycle-date-text">
                          🕒 {new Date(cycle.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Sub-Transactions */}
                    {isExpanded && (
                      <div className="cycle-substeps-list">
                        {cycle.sub_transactions.map((sub, sIdx) => {
                          const isSelected = activeTx?.id === sub.id
                          const isSubCancelled = sub.is_cancelled
                          const hasErrors = sub.bypassed_errors_count > 0 || (sub.worksheet_snapshot?.rejectedRows > 0)

                          return (
                            <div
                              key={sub.id || sIdx}
                              className={`substep-item ${isSelected ? 'is-active' : ''} ${isSubCancelled ? 'is-cancelled' : ''}`}
                              onClick={() => setSelectedTxId(sub.id)}
                            >
                              <div className="substep-track-dot" />
                              <div className="substep-content">
                                <div className="substep-top">
                                  <span className="substep-seq">Step {sub.sub_seq || `${cIdx + 1}.${sIdx + 1}`}</span>
                                  <span className="substep-time">
                                    {new Date(sub.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </span>
                                </div>
                                <div className="substep-title">{sub.action_title || sub.action_code}</div>
                                {hasErrors && (
                                  <div className="substep-error-hint">
                                    ⚠️ {sub.bypassed_errors_count || sub.worksheet_snapshot?.rejectedRows} error(s) flagged
                                  </div>
                                )}
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
          {activeTx ? (
            <div className="inspector-panel">
              {/* Event Context Header */}
              <div className="inspector-event-header">
                <div className="event-title-group">
                  <div className="event-step-pill">
                    Step {activeTx.sub_seq} • Cycle {activeTx.parentCycle?.cycle_seq}
                  </div>
                  <h2 className="event-main-title">{activeTx.action_title}</h2>
                  <div className="event-action-code">
                    <code>action_code: {activeTx.action_code}</code>
                  </div>
                </div>

                <div className="event-actor-card">
                  <div className="actor-avatar">
                    {activeTx.actor?.role === 'broker' ? '🛡️' : '🏢'}
                  </div>
                  <div className="actor-info">
                    <span className="actor-name">{activeTx.actor?.email || 'Unknown User'}</span>
                    <span className="actor-role">Role: {activeTx.actor?.role ? activeTx.actor.role.toUpperCase() : 'USER'} • ID: {activeTx.actor?.user_id}</span>
                    <span className="actor-time">
                      Logged: {new Date(activeTx.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Context Banners */}
              {activeTx.rejection_comments && (
                <div className="audit-callout-box is-rejection">
                  <div className="callout-icon">💬</div>
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
                  <div className="callout-icon">⚠️</div>
                  <div className="callout-body">
                    <strong>Session Cancelled / Discarded:</strong>
                    <p>The user initiated this session but chose to cancel without committing changes to the database. All exploratory validation states are captured here for audit forensics.</p>
                  </div>
                </div>
              )}

              {activeTx.action_code === 'FORCE_APPROVED_WITH_ERRORS' && (
                <div className="audit-callout-box is-force">
                  <div className="callout-icon">⚡</div>
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
                  <span style={{ fontSize: '18px' }}>ℹ️</span>
                  <div>
                    <strong>Legacy Milestone Summary:</strong> This transaction recorded <strong>{displayFaultyRows} bypassed error(s)</strong> prior to granular row snapshot persistence. The original file data is rendered below.
                  </div>
                </div>
              )}

              {/* Action Toolbar for Worksheet Snapshot */}
              <div className="inspector-worksheet-toolbar">
                <div className="toolbar-stats-strip">
                  <span className="sheet-stat-chip">
                    📊 Total Rows: {displayTotalRows}
                  </span>
                  <span className="sheet-stat-chip is-clean">
                    ✓ Clean Rows: {displayCleanRows}
                  </span>
                  <span className={`sheet-stat-chip ${displayFaultyRows > 0 ? 'is-faulty' : ''}`}>
                    ⚠️ Faulty Rows: {displayFaultyRows}
                  </span>
                </div>

                <div className="toolbar-actions-strip">
                  <button
                    type="button"
                    className={`toolbar-btn ${errorsOnly ? 'is-active' : ''}`}
                    onClick={() => setErrorsOnly(!errorsOnly)}
                  >
                    <FilterIcon size={14} />
                    <span>{errorsOnly ? 'Showing Faulty Rows Only' : 'Filter Faulty Only'}</span>
                  </button>
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

              {/* End of Inspector Panel */}
            </div>
          ) : (
            <div className="inspector-placeholder">
              <ClockIcon size={48} />
              <h3>Select a transaction from the timeline</h3>
              <p>Choose any cycle or sub-transaction on the left to inspect its historical state.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

/**
 * ── Helper Table for Historical Worksheet Snapshot ───────────────────────
 */
function HistoricalWorksheetTable({ rows, errorsOnly, isLegacy, bypassedCount, baseHeaders, baseRows }) {
  // Derive column headers unconditionally:
  // 1. If baseHeaders exists from the raw Excel workbook in S3, use all of them in exact template order
  // 2. Otherwise derive from row values
  const colKeys = useMemo(() => {
    if (Array.isArray(baseHeaders) && baseHeaders.length > 0) {
      return baseHeaders.map((h) => (typeof h === 'string' ? h : h.name)).filter(Boolean)
    }
    const keys = new Set()
    ;(rows || []).forEach((r) => {
      if (r.values && typeof r.values === 'object') {
        Object.keys(r.values).forEach((k) => keys.add(k))
      }
    })
    return Array.from(keys)
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
            {isLegacy ? 'ℹ' : '✓'}
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
                <tr key={r.row || rIdx} className={hasErrors ? 'is-row-error' : 'is-row-valid'}>
                  <td className="cell-row-num">{r.sourceRow || rIdx + 1}</td>
                  <td className="cell-status">
                    <span className={`status-pill ${hasErrors ? 'is-error' : 'is-valid'}`}>
                      {hasErrors ? 'FAULTY' : 'VALID'}
                    </span>
                  </td>
                  {colKeys.map((col) => {
                    const val = getCellValue(r, rIdx, col)
                    const fieldError = getFieldError(r, col)

                    return (
                      <td
                        key={col}
                        className={fieldError ? 'cell-has-error' : ''}
                        title={fieldError ? fieldError.message : undefined}
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
                            <strong>{err.field}:</strong> {err.message}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="no-error-dash">—</span>
                    )}
                  </td>
                </tr>
              )
            })
          }
        </tbody>
      </table>
    </div>
  )
}
