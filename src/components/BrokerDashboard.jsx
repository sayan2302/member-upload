import React, { useState, useEffect, useCallback } from 'react'
import {
  DownloadIcon,
  ExcelFileIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  UploadCloudIcon,
  LockIcon,
  UnlockIcon,
  InfoIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from './Icons.jsx'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function BrokerDashboard({
  brokerId,
  corporates = [],
  apiConfig,
  onOpenUploadModal,
  hasValidationErrors = false,
  refreshKey = 0,
}) {
  const [historyItems, setHistoryItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingUuid, setProcessingUuid] = useState(null)
  const [unlockConfirmItem, setUnlockConfirmItem] = useState(null)
  
  const [selectedCorpFilter, setSelectedCorpFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Auto-collapse slowly and smoothly when validation has errors
  useEffect(() => {
    if (hasValidationErrors) {
      const timer = setTimeout(() => {
        setIsCollapsed(true)
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [hasValidationErrors])

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const validSubCorpIds = Array.isArray(corporates)
        ? corporates.map((c) => c.id).filter((id) => id && id !== '0' && id !== 0)
        : []
      const params = new URLSearchParams()

      if (selectedCorpFilter !== 'all') {
        params.append('corp_id', selectedCorpFilter)
      } else if (validSubCorpIds.length > 0) {
        params.append('sub_corporate_ids', JSON.stringify(validSubCorpIds))
      }

      params.append('role', 'broker')

      const response = await fetch(
        `${apiConfig.apiBaseUrl}/uploads3/history?${params.toString()}`,
        {
          headers: { 'x-api-key': apiConfig.apiKey },
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Failed to fetch broker dashboard (${response.status})`)
      }

      const data = await response.json()
      const items = Array.isArray(data.files) ? data.files : []
      setHistoryItems(items)
    } catch (err) {
      console.error('[BrokerDashboard] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [apiConfig, corporates, selectedCorpFilter])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard, refreshKey])

  const brokerFetch = async (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'x-api-key': apiConfig.apiKey,
        'x-user-id': String(brokerId),
      }
    })
  }

  const downloadOriginal = async (item) => {
    try {
      const response = await fetch(`${apiConfig.apiBaseUrl}/uploads3/download/${item.uuid}?role=broker`, {
        headers: {
          'x-api-key': apiConfig.apiKey,
          'x-user-id': String(brokerId),
        },
      })
      if (!response.ok) throw new Error(`Download failed (${response.status})`)
      
      const blob = await response.blob()
      const rawHeaderFilename = response.headers
        .get('content-disposition')
        ?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)?.[1]
        ?.replace(/['"]/g, '')

      const downloadName = rawHeaderFilename || item.fileName || 'enrollment.xlsx'
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = downloadName
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[BrokerDashboard] Download error:', err)
      throw err;
    }
  }

  const handleDownloadAndLock = async (item) => {
    if (!item.uuid || processingUuid) return
    setProcessingUuid(item.uuid)
    
    try {
      const lockRes = await brokerFetch(`${apiConfig.apiBaseUrl}/uploads3/lock/${item.uuid}`, { method: 'POST' })
      if (!lockRes.ok) {
        const errorData = await lockRes.json().catch(() => ({}))
        throw new Error(errorData.error || `Lock failed (${lockRes.status})`)
      }

      await fetchDashboard()
      await downloadOriginal(item)

    } catch (err) {
      console.error('[BrokerDashboard] Lock & Download error:', err)
      setError(err instanceof Error ? err.message : 'Could not lock and download the file.')
    } finally {
      setProcessingUuid(null)
    }
  }

  const handleUnlockClick = (item) => {
    if (!item.uuid || processingUuid) return
    setError('')
    setUnlockConfirmItem(item)
  }

  const confirmUnlock = async () => {
    if (!unlockConfirmItem || processingUuid) return
    const item = unlockConfirmItem
    setProcessingUuid(item.uuid)
    setError('')
    try {
      const res = await brokerFetch(`${apiConfig.apiBaseUrl}/uploads3/unlock/${item.uuid}`, { method: 'POST' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Unlock failed (${res.status})`)
      }
      setUnlockConfirmItem(null)
      await fetchDashboard()
    } catch (err) {
      console.error('[BrokerDashboard] Unlock error:', err)
      setError(err instanceof Error ? err.message : 'Could not unlock the file.')
    } finally {
      setProcessingUuid(null)
    }
  }

  const handleDownload = async (item) => {
    if (!item.uuid || processingUuid) return
    setProcessingUuid(item.uuid)
    setError('')
    try {
      await downloadOriginal(item)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download the file.')
    } finally {
      setProcessingUuid(null)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch {
      return String(dateStr)
    }
  }

  const getStatusBadge = (status, lockedByUserId) => {
    const s = String(status || 'pending').toLowerCase()
    
    if (s === 'approved' || s === 'completed') {
      return (
        <span 
          className="history-badge is-approved" 
          title="Approved: All member records have been successfully validated, enrolled, and finalized in the core database."
        >
          <CheckCircleIcon size={12} />
          <span>Approved</span>
        </span>
      )
    }

    if (s === 'staged') {
      return (
        <span 
          className="history-badge is-staged" 
          style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}
          title="Staged: Revised file is safely saved in S3 and queued in RabbitMQ for core database enrollment."
        >
          <ClockIcon size={12} />
          <span>Staged</span>
        </span>
      )
    }

    if (s === 'processing') {
      return (
        <span 
          className="history-badge is-processing" 
          style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}
          title="Enrolling: Background worker is currently inserting beneficiary records into core tables."
        >
          <ClockIcon size={12} />
          <span>Enrolling...</span>
        </span>
      )
    }

    if (s === 'failed') {
      return (
        <span 
          className="history-badge is-failed" 
          style={{ background: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5' }}
          title="Failed: Processing error occurred. Message has been moved to the Dead Letter Queue for retry."
        >
          <AlertTriangleIcon size={12} />
          <span>Failed</span>
        </span>
      )
    }

    if (lockedByUserId) {
      if (String(lockedByUserId) === String(brokerId)) {
        return (
          <span 
            className="history-badge is-pending" 
            style={{ background: '#e0f2fe', color: '#0284c7', borderColor: '#bae6fd' }}
            title="Locked by You: You currently have exclusive edit rights on this corporate submission."
          >
            <LockIcon size={12} />
            <span>Locked by You</span>
          </span>
        )
      } else {
        return (
          <span 
            className="history-badge is-pending" 
            style={{ background: '#f1f5f9', color: '#64748b', borderColor: '#e2e8f0' }}
            title={`Locked by ${lockedByUserId}: Another broker is currently reviewing/editing this submission.`}
          >
            <LockIcon size={12} />
            <span>Locked by {lockedByUserId}</span>
          </span>
        )
      }
    }

    return (
      <span 
        className="history-badge is-pending"
        title="Pending Review: Uploaded by HR. Awaiting broker review and validation."
      >
        <ClockIcon size={12} />
        <span>Pending Review</span>
      </span>
    )
  }

  const filteredItems = historyItems.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (item.fileName || '').toLowerCase().includes(q);
  });

  return (
    <div className="upload-history-container">
      <div className="history-header" style={{ flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div>
          <h3 className="history-title">
            HR File Submissions
            <span className="history-count-badge">{filteredItems.length}</span>
            <button
              type="button"
              className="history-collapse-btn"
              onClick={() => setIsCollapsed(prev => !prev)}
              title={isCollapsed ? "Expand submissions list" : "Collapse submissions list"}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? <ChevronDownIcon size={13} /> : <ChevronUpIcon size={13} />}
              <span>{isCollapsed ? 'Show' : 'Collapse'}</span>
            </button>
          </h3>
        </div>

        {!isCollapsed && (
          <div className="history-actions" style={{ flexWrap: 'wrap' }}>
            <input
              type="text"
              className="history-search-input"
              placeholder="Search files..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '13px',
                width: '220px'
              }}
            />

            {corporates.length > 1 && (
              <select
                className="history-corp-select"
                value={selectedCorpFilter}
                onChange={(e) => setSelectedCorpFilter(e.target.value)}
              >
                <option value="all">All Sub-Corporates</option>
                {corporates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              className="history-refresh-btn"
              onClick={fetchDashboard}
              disabled={isLoading}
              title="Refresh dashboard"
            >
              <RefreshCwIcon size={14} className={isLoading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        )}
      </div>

      {isCollapsed && (
        <div 
          className="history-collapsed-banner"
          onClick={() => setIsCollapsed(false)}
          role="button"
          tabIndex={0}
          title="Click to expand HR submissions"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsCollapsed(false); }}
        >
          <span>📁 <strong>{filteredItems.length} HR submission{filteredItems.length === 1 ? '' : 's'}</strong> available</span>
          <span className="collapsed-action-text">Show Submissions <ChevronDownIcon size={14} /></span>
        </div>
      )}

      <div className={`history-collapsible-wrapper ${isCollapsed ? 'is-collapsed' : 'is-expanded'}`}>
        <div className="history-collapsible-inner">
          {error && (
            <div className="message-banner is-error" role="alert" style={{ marginTop: '12px' }}>
              <span className="message-icon"><AlertTriangleIcon size={18} /></span>
              <span className="message-text">{error}</span>
              <button type="button" className="retry-btn" onClick={fetchDashboard}>Retry</button>
            </div>
          )}

          {isLoading && historyItems.length === 0 ? (
            <div className="history-loading">
              <div className="spinner" />
              <p>Loading HR submissions…</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="history-empty-state">
              <div className="empty-icon-wrapper">
                <ExcelFileIcon size={40} />
              </div>
              <h4>No Submissions Found</h4>
              <p>There are no HR file submissions matching your current filters.</p>
            </div>
          ) : (
            <div className="history-table-wrapper" style={{ marginTop: '16px', maxHeight: '500px', overflowY: 'auto' }}>
              <table className="history-table">
                <thead>
                  <tr>
                    <th className="col-file">File Name</th>
                    <th className="col-uploader">Uploaded By / On</th>
                    <th className="col-records">Records</th>
                    <th className="col-status">
                      <div className="status-header-cell">
                        <span>Status</span>
                        <div className="status-info-popover-wrapper">
                          <button 
                            type="button" 
                            className="status-info-trigger" 
                            aria-label="Status Definitions Guide"
                            title="Click or hover to view status definitions"
                          >
                            <InfoIcon size={13} />
                          </button>
                          <div className="status-popover-card">
                            <div className="status-popover-header">Status Lifecycle Guide</div>
                            
                            <div className="status-popover-item">
                              <span className="status-dot dot-pending" />
                              <div className="status-popover-text">
                                <div className="status-popover-label">Pending Review</div>
                                <div className="status-popover-desc">Uploaded by HR; awaiting broker review and validation.</div>
                              </div>
                            </div>

                            <div className="status-popover-item">
                              <span className="status-dot dot-locked" />
                              <div className="status-popover-text">
                                <div className="status-popover-label">Locked by You / Broker</div>
                                <div className="status-popover-desc">Locked for exclusive editing to prevent concurrent overwrites.</div>
                              </div>
                            </div>

                            <div className="status-popover-item">
                              <span className="status-dot dot-staged" />
                              <div className="status-popover-text">
                                <div className="status-popover-label">Staged</div>
                                <div className="status-popover-desc">Saved in S3; queued in RabbitMQ for database enrollment.</div>
                              </div>
                            </div>

                            <div className="status-popover-item">
                              <span className="status-dot dot-processing" />
                              <div className="status-popover-text">
                                <div className="status-popover-label">Enrolling...</div>
                                <div className="status-popover-desc">Background worker is inserting member records into core tables.</div>
                              </div>
                            </div>

                            <div className="status-popover-item">
                              <span className="status-dot dot-approved" />
                              <div className="status-popover-text">
                                <div className="status-popover-label">Approved</div>
                                <div className="status-popover-desc">Enrollment complete and finalized in core database.</div>
                              </div>
                            </div>

                            <div className="status-popover-item">
                              <span className="status-dot dot-failed" />
                              <div className="status-popover-text">
                                <div className="status-popover-label">Failed</div>
                                <div className="status-popover-desc">Processing error; queued in Dead Letter Queue (DLQ) for retry.</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isApproved = String(item.status || 'pending').toLowerCase() === 'approved';
                    const isLocked = !!item.lockedByUserId;
                    const isLockedByMe = isLocked && String(item.lockedByUserId) === String(brokerId);
                    const isLockedByOther = isLocked && !isLockedByMe;
                    
                    return (
                      <tr key={item.uuid} className={isLockedByOther ? 'is-disabled-row' : ''} style={{ opacity: isLockedByOther ? 0.6 : 1 }}>
                        <td className="history-file-cell">
                          <div className="history-file-info">
                            <ExcelFileIcon size={24} />
                            <span className="history-filename" title={item.fileName}>{item.fileName}</span>
                          </div>
                        </td>
                        <td className="history-date-cell">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ color: '#334155', fontWeight: 500 }}>{item.uploadedBy || 'HR Admin'}</span>
                            <span>{formatDate(item.uploadedOn)}</span>
                          </div>
                        </td>
                        <td className="history-rows-cell">
                          <span className="valid-count">{item.validRows ?? item.totalRows ?? 0}</span>
                          <span className="total-count"> / {item.totalRows ?? 0}</span>
                        </td>
                        <td className="history-status-cell" style={{ whiteSpace: 'nowrap' }}>{getStatusBadge(item.status, item.lockedByUserId)}</td>
                        <td className="history-action-cell" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                            
                            {/* 1. Upload - always present */}
                            <button
                              type="button"
                              className="history-download-btn action-btn-upload"
                              onClick={() => onOpenUploadModal(item)}
                              disabled={isLockedByOther || isApproved || processingUuid === item.uuid}
                              title="Upload revised file"
                            >
                              <UploadCloudIcon size={14} />
                              <span>Upload</span>
                            </button>
                            
                            {/* 2. Unlock - only if locked by me */}
                            {!isApproved && isLockedByMe && (
                              <button
                                type="button"
                                className="history-download-btn action-btn-unlock"
                                onClick={() => handleUnlockClick(item)}
                                disabled={processingUuid === item.uuid}
                                title="Unlock file to allow others to review"
                              >
                                <UnlockIcon size={14} />
                                <span>Unlock</span>
                              </button>
                            )}
                            
                            {/* 3. Download & Lock - if unlocked and unpicked */}
                            {!isApproved && !isLocked && (
                              <button
                                type="button"
                                className="history-download-btn action-btn-lock"
                                onClick={() => handleDownloadAndLock(item)}
                                disabled={processingUuid === item.uuid}
                                title="Lock this file to yourself and download"
                              >
                                <LockIcon size={14} />
                                <span>{processingUuid === item.uuid ? 'Locking...' : 'Download & Lock'}</span>
                              </button>
                            )}

                            {/* 4. Download - if locked by me, or locked by someone else, or approved */}
                            {(isApproved || isLocked) && (
                              <button
                                type="button"
                                className="history-download-btn action-btn-download"
                                onClick={() => handleDownload(item)}
                                disabled={processingUuid === item.uuid}
                                title="Download file"
                              >
                                <DownloadIcon size={14} />
                                <span>Download</span>
                              </button>
                            )}

                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Unlock Confirmation Modal Dialog */}
      {unlockConfirmItem && (
        <div className="success-modal-overlay" role="dialog" aria-modal="true">
          <div className="success-modal-card" style={{ maxWidth: '440px', textAlign: 'center' }}>
            <button
              type="button"
              className="modal-close-icon-btn"
              onClick={() => setUnlockConfirmItem(null)}
              aria-label="Close dialog"
            >
              ×
            </button>

            <div
              className="success-modal-icon"
              style={{ background: '#fef3c7', color: '#b45309', boxShadow: '0 0 0 8px #fefce8' }}
            >
              <UnlockIcon size={26} />
            </div>

            <h3 className="success-modal-title">Unlock File?</h3>
            <p className="success-modal-desc">
              Are you sure you want to unlock <strong>{unlockConfirmItem.fileName}</strong>? Once unlocked, other brokers will be able to lock and work on it.
            </p>

            <div className="success-modal-actions">
              <button
                type="button"
                className="modal-btn-secondary"
                onClick={() => setUnlockConfirmItem(null)}
                disabled={processingUuid === unlockConfirmItem.uuid}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn-primary"
                style={{ background: '#d97706', borderColor: '#b45309' }}
                onClick={confirmUnlock}
                disabled={processingUuid === unlockConfirmItem.uuid}
              >
                {processingUuid === unlockConfirmItem.uuid ? 'Unlocking…' : 'Yes, Unlock File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
