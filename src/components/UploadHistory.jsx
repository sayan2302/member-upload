import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DownloadIcon,
  ExcelFileIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  SearchIcon,
  TrashIcon,
  LockIcon,
  CloseIcon,
  InfoIcon,
  MessageSquareIcon
} from './Icons.jsx'
import { SortDropdown } from './SortDropdown.jsx'
import { StatusFilterDropdown } from './StatusFilterDropdown.jsx'
import { downloadFile } from '../utils/fileDownloader.js'
import { DateRangeFilterDropdown } from './DateRangeFilterDropdown.jsx'

export function UploadHistory({
  corpId,
  corporates = [],
  role = 'hr',
  apiConfig,
  userEmail = '',
  userName = '',
  refreshTrigger,
  onNavigateToUpload,
  onOpenAudit,
}) {
  const [historyItems, setHistoryItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [downloadingUuid, setDownloadingUuid] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'pending' | 'approved' | 'failed'
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState('date') // 'date' | 'name' | 'records'
  const [sortOrder, setSortOrder] = useState('desc') // 'desc' | 'asc'

  const getUploaderInfo = useCallback((item) => {
    const isBroker = (item?.uploaderRole || item?.templateType || (item?.role === 'broker' ? 'broker' : 'hr')).toLowerCase() === 'broker'

    if (!item) {
      return {
        username: '—',
        email: '—',
        roleTag: isBroker ? 'Broker' : 'HR',
      }
    }

    const rawName = (item.uploadedByName || item.uploadedBy || '').trim()
    const isValidName = Boolean(
      rawName &&
      rawName.toLowerCase() !== 'system' &&
      !rawName.toLowerCase().includes('system') &&
      !rawName.toLowerCase().includes('hr.admin@') &&
      rawName.toLowerCase() !== 'hr admin'
    )

    const rawEmail = (item.uploadedByEmail || '').trim()
    const isValidEmail = Boolean(
      rawEmail &&
      rawEmail.toLowerCase() !== 'system' &&
      !rawEmail.toLowerCase().includes('system') &&
      rawEmail.includes('@') &&
      !rawEmail.toLowerCase().includes('hr.admin@mayfair.com') &&
      rawEmail.toLowerCase() !== 'hr@company.com'
    )

    let username = '—'
    let email = isValidEmail ? rawEmail : '—'

    // 1. Resolve Username
    if (isValidName && !rawName.includes('@')) {
      username = rawName
    } else if (isValidEmail) {
      const prefix = rawEmail.split('@')[0]
      username = prefix
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    }

    return {
      username,
      email,
      roleTag: isBroker ? 'Broker' : 'HR',
    }
  }, [])

  // Delete / Recall states
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [deleteSuccessToast, setDeleteSuccessToast] = useState(null)
  const [activeFeedbackItem, setActiveFeedbackItem] = useState(null)

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const validSubCorpIds = Array.isArray(corporates)
        ? corporates.map((c) => c.id).filter((id) => id && id !== '0' && id !== 0)
        : []
      const params = new URLSearchParams()

      if (validSubCorpIds.length > 1) {
        params.append('sub_corporate_ids', JSON.stringify(validSubCorpIds))
      } else if (corpId && corpId !== '0' && corpId !== 0) {
        params.append('corp_id', corpId)
      }

      params.append('role', role)

      const response = await fetch(
        `${apiConfig.apiBaseUrl}/uploads3/history?${params.toString()}`,
        {
          headers: { 'x-api-key': apiConfig.apiKey },
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Failed to fetch upload history (${response.status})`)
      }

      const data = await response.json()
      const items = Array.isArray(data.files)
        ? data.files
        : Array.isArray(data.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : []
      setHistoryItems(items)
    } catch (err) {
      console.error('[UploadHistory] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load upload history')
    } finally {
      setIsLoading(false)
    }
  }, [apiConfig, corpId, corporates, role])

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true)
    try {
      await fetchHistory()
    } finally {
      setTimeout(() => {
        setIsManualRefreshing(false)
      }, 650)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory, refreshTrigger])

  const handleDownload = (item) => {
    if (!item.uuid || downloadingUuid) return

    setDownloadingUuid(item.uuid)
    try {
      const downloadUrl = `${apiConfig.apiBaseUrl}/uploads3/download/${item.uuid}?role=${encodeURIComponent(role || 'hr')}`
      downloadFile(downloadUrl, item.fileName || 'enrollment.xlsx')
    } catch (err) {
      console.error('[UploadHistory] Download error:', err)
      setError(err instanceof Error ? err.message : 'Could not download the file.')
    } finally {
      setTimeout(() => setDownloadingUuid(null), 1500)
    }
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(
        `${apiConfig.apiBaseUrl}/uploads3/${itemToDelete.uuid}`,
        {
          method: 'DELETE',
          headers: {
            'x-api-key': apiConfig.apiKey,
            'x-user-id': 'hr_admin',
            'x-user-email': itemToDelete.uploadedByEmail || userEmail || '',
          },
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(
            data.error ||
              `Cannot delete file: This submission is currently locked by a broker for underwriting review. Please ask the broker to unlock it first.`
          )
        }
        throw new Error(data.error || `Failed to delete file (${response.status})`)
      }

      // Success
      const deletedName = itemToDelete.fileName
      setItemToDelete(null)
      setDeleteSuccessToast(`Submission "${deletedName}" was successfully removed.`)
      setTimeout(() => setDeleteSuccessToast(null), 4500)
      fetchHistory()
    } catch (err) {
      console.error('[UploadHistory] Delete error:', err)
      setDeleteError(err instanceof Error ? err.message : 'Could not delete the file.')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return String(dateStr)
    }
  }

  const getStatusBadge = (item) => {
    const s = String(item.status || 'pending').toLowerCase()
    if (s === 'approved' || s === 'completed') {
      return (
        <span className="history-badge is-approved">
          <CheckCircleIcon size={12} />
          <span>Approved</span>
        </span>
      )
    }
    if (s === 'rejected' || s === 'failed') {
      return (
        <span 
          className={`history-badge is-rejected ${item.rejectionDetails ? 'has-feedback-trigger' : ''}`}
          onClick={() => item.rejectionDetails && setActiveFeedbackItem(item.rejectionDetails)}
          style={{ cursor: item.rejectionDetails ? 'pointer' : 'default' }}
          title={item.rejectionDetails ? "Click to view broker rejection comments" : "Submission rejected by broker"}
        >
          <MessageSquareIcon size={12} />
          <span>Rejected</span>
        </span>
      )
    }
    if (s === 'revoked') {
      return (
        <span className="history-badge is-revoked" title="Revoked by HR: This file submission was revoked and cannot be downloaded.">
          <CloseIcon size={12} />
          <span>Revoked</span>
        </span>
      )
    }
    return (
      <span className="history-badge is-pending">
        <ClockIcon size={12} />
        <span>Pending</span>
      </span>
    )
  }

  const getTime = (item) => {
    const raw = item.uploadedOn || item.createdAt || item.uploaded_on
    if (!raw) return 0
    const t = new Date(raw).getTime()
    return isNaN(t) ? 0 : t
  }

  const filteredItems = historyItems.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const fileName = (item.fileName || '').toLowerCase()
      const uploader = (item.uploadedByEmail || item.uploadedBy || '').toLowerCase()
      if (!fileName.includes(q) && !uploader.includes(q)) {
        return false
      }
    }

    if (statusFilter !== 'all') {
      const s = String(item.status || 'pending').toLowerCase()
      if (statusFilter === 'approved') {
        if (s !== 'approved' && s !== 'completed') return false
      } else if (statusFilter === 'failed') {
        if (s !== 'failed' && s !== 'rejected') return false
      } else if (statusFilter === 'pending') {
        if (s !== 'pending' && s !== 'pending_review' && s !== 'processing') return false
      } else if (statusFilter === 'revoked') {
        if (s !== 'revoked') return false
      }
    }

    if (startDate || endDate) {
      const rawDate = item.uploadedOn || item.createdAt || item.uploaded_on
      if (!rawDate) return false
      const itemTime = new Date(rawDate).getTime()
      if (isNaN(itemTime)) return false

      if (startDate) {
        const [sY, sM, sD] = startDate.split('-').map(Number)
        const startTime = new Date(sY, sM - 1, sD, 0, 0, 0, 0).getTime()
        if (itemTime < startTime) return false
      }

      if (endDate) {
        const [eY, eM, eD] = endDate.split('-').map(Number)
        const endTime = new Date(eY, eM - 1, eD, 23, 59, 59, 999).getTime()
        if (itemTime > endTime) return false
      }
    }

    return true
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    let comp = 0
    if (sortBy === 'name') {
      const nameA = String(a.fileName || '').toLowerCase()
      const nameB = String(b.fileName || '').toLowerCase()
      comp = nameA.localeCompare(nameB)
    } else if (sortBy === 'records') {
      const recA = Number(a.noOfRows ?? a.validRows ?? 0)
      const recB = Number(b.noOfRows ?? b.validRows ?? 0)
      comp = recA - recB
    } else {
      // Default: 'date'
      const timeA = getTime(a)
      const timeB = getTime(b)
      comp = timeA - timeB
    }

    return sortOrder === 'asc' ? comp : -comp
  })

  return (
    <div className="upload-history-container">
      {/* Header with controls */}
      <div className="history-header">
        <div>
          <h3 className="history-title">
            Upload History
            <span className="history-count-badge">{filteredItems.length}</span>
          </h3>
          <p className="history-subtitle">
            View and download previously submitted enrollment spreadsheets.
          </p>
        </div>

        <div className="history-actions" style={{ flexWrap: 'wrap' }}>
          <div className="history-search-wrapper">
            <SearchIcon size={14} className="search-icon-svg" />
            <input
              type="text"
              className="history-search-input"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-mini"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <StatusFilterDropdown
            selectedStatus={statusFilter}
            onStatusChange={(newStatus) => setStatusFilter(newStatus)}
            isBroker={false}
          />

          <DateRangeFilterDropdown
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={({ startDate: s, endDate: e }) => {
              setStartDate(s)
              setEndDate(e)
            }}
          />

          <SortDropdown
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={({ sortBy: newSortBy, sortOrder: newSortOrder }) => {
              setSortBy(newSortBy)
              setSortOrder(newSortOrder)
            }}
          />

          <button
            type="button"
            className={`history-refresh-btn ${isManualRefreshing || isLoading ? 'is-refreshing' : ''}`}
            onClick={handleManualRefresh}
            disabled={isLoading || isManualRefreshing}
            title="Refresh history"
          >
            <RefreshCwIcon size={14} className={isManualRefreshing || isLoading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="message-banner is-error" role="alert">
          <span className="message-icon">
            <AlertTriangleIcon size={18} />
          </span>
          <span className="message-text">{error}</span>
          <button type="button" className="retry-btn" onClick={fetchHistory}>
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && historyItems.length === 0 ? (
        <div className="history-loading">
          <div className="spinner" />
          <p>Loading submission history…</p>
        </div>
      ) : historyItems.length === 0 ? (
        /* Empty State */
        <div className="history-empty-state">
          <div className="empty-icon-wrapper">
            <ExcelFileIcon size={40} />
          </div>
          <h4>No Submissions Yet</h4>
          <p>
            You haven’t submitted any enrollment files yet. Once you validate and submit a file, it
            will appear here with download options.
          </p>
          {onNavigateToUpload && (
            <button
              type="button"
              className="upload-now-btn"
              onClick={onNavigateToUpload}
            >
              Upload & Validate a File
            </button>
          )}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="history-empty-state" style={{ padding: '36px 16px' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            No files match "<strong>{searchQuery}</strong>".
          </p>
        </div>
      ) : (
        /* Table of past uploads */
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th className="col-file">File Name</th>
                <th className="col-uploader">Uploaded By / On</th>
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
                            <div className="status-popover-label">Pending</div>
                            <div className="status-popover-desc">Uploaded by HR; awaiting broker review and validation.</div>
                          </div>
                        </div>

                        <div className="status-popover-item">
                          <span className="status-dot dot-locked" />
                          <div className="status-popover-text">
                            <div className="status-popover-label">Locked by Broker</div>
                            <div className="status-popover-desc">A broker is reviewing this file (cannot be deleted while locked).</div>
                          </div>
                        </div>

                        <div className="status-popover-item">
                          <span className="status-dot dot-approved" />
                          <div className="status-popover-text">
                            <div className="status-popover-label">Approved</div>
                            <div className="status-popover-desc">All member records validated and saved to database.</div>
                          </div>
                        </div>

                        <div className="status-popover-item">
                          <span className="status-dot dot-rejected" />
                          <div className="status-popover-text">
                            <div className="status-popover-label">Rejected</div>
                            <div className="status-popover-desc">Rejected by broker with specific feedback comments (HR can fix & re-upload).</div>
                          </div>
                        </div>

                        <div className="status-popover-item">
                          <span className="status-dot dot-failed" />
                          <div className="status-popover-text">
                            <div className="status-popover-label">Failed</div>
                            <div className="status-popover-desc">Error occurred during validation or saving records to database.</div>
                          </div>
                        </div>

                        <div className="status-popover-item">
                          <span className="status-dot dot-revoked" />
                          <div className="status-popover-text">
                            <div className="status-popover-label">Revoked</div>
                            <div className="status-popover-desc">Revoked by HR; file is archived and cannot be downloaded or reviewed.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </th>
                <th className="col-actions" style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                    <span>Action</span>
                    <div className="status-info-popover-wrapper">
                      <button 
                        type="button" 
                        className="status-info-trigger" 
                        aria-label="Action Buttons Lifecycle Guide"
                        title="Click or hover to view action button guide"
                      >
                        <InfoIcon size={13} />
                      </button>
                      <div className="status-popover-card popover-right">
                        <div className="status-popover-header">Action Buttons Guide</div>
                        
                        {role === 'hr' && (
                          <div className="status-popover-item">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', flexShrink: 0 }}>
                              <TrashIcon size={13} />
                            </div>
                            <div className="status-popover-text">
                              <div className="status-popover-label" style={{ color: '#dc2626' }}>Revoke Submission</div>
                              <div className="status-popover-desc">Allows HR to revoke a file submission before a broker locks or reviews it.</div>
                            </div>
                          </div>
                        )}

                        <div className="status-popover-item">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: '#dcfce7', color: '#16a34a', flexShrink: 0 }}>
                            <DownloadIcon size={13} />
                          </div>
                          <div className="status-popover-text">
                            <div className="status-popover-label" style={{ color: '#16a34a' }}>Download Excel File</div>
                            <div className="status-popover-desc">Download original Excel file to inspect data or fix issues on rejected files.</div>
                          </div>
                        </div>

                        <div className="status-popover-item">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: '#e0f2fe', color: '#0284c7', flexShrink: 0 }}>
                            <ClockIcon size={13} />
                          </div>
                          <div className="status-popover-text">
                            <div className="status-popover-label" style={{ color: '#0284c7' }}>File History</div>
                            <div className="status-popover-desc">View complete action timeline, events, logs, and state changes for the file.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.uuid}>
                  <td className="history-file-cell">
                    <div className="history-file-info">
                      <ExcelFileIcon size={24} />
                      <div className="history-file-text-wrap">
                        <span className="history-filename" title={item.fileName}>
                          {item.fileName}
                        </span>
                        <span className="history-file-records-badge" title={`${item.noOfRows ?? item.validRows ?? 0} member records`}>
                          {item.noOfRows ?? item.validRows ?? 0} records
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="history-date-cell">
                    {(() => {
                      const uploader = getUploaderInfo(item)
                      return (
                        <div className="broker-uploader-cell-wrap">
                          <span className="broker-uploader-name">{uploader.username}</span>
                          <span className="broker-uploader-email">{uploader.email}</span>
                          <span className="broker-uploader-time">{formatDate(item.uploadedOn)}</span>
                        </div>
                      )
                    })()}
                  </td>
                  <td className="history-status-cell">{getStatusBadge(item)}</td>
                  <td className="history-action-cell" style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      {/* Delete / Revoke Button for HR */}
                      {role === 'hr' && item.status !== 'approved' && item.status !== 'revoked' && item.status !== 'deleted' && item.status !== 'rejected' && (
                        <div className="broker-icon-btn-wrap">
                          <button
                            type="button"
                            className="broker-icon-btn btn-reject"
                            onClick={() => {
                              setItemToDelete(item)
                              setDeleteError(null)
                            }}
                            disabled={isDeleting && itemToDelete?.uuid === item.uuid}
                            aria-label="Revoke submission"
                          >
                            <TrashIcon size={14} />
                          </button>
                          <div className="broker-tooltip tooltip-right">
                            <span className="tooltip-title">Revoke</span>
                            <span className="tooltip-desc">Revoke file before broker locks it</span>
                          </div>
                        </div>
                      )}

                      {/* Download Action Button */}
                      {item.status !== 'revoked' && item.status !== 'deleted' && (
                        <div className="broker-icon-btn-wrap">
                          <button
                            type="button"
                            className="broker-icon-btn btn-download"
                            onClick={() => handleDownload(item)}
                            disabled={downloadingUuid === item.uuid}
                            aria-label="Download file"
                          >
                            {downloadingUuid === item.uuid ? (
                              <RefreshCwIcon size={14} className="spin" />
                            ) : (
                              <DownloadIcon size={14} />
                            )}
                          </button>
                          <div className="broker-tooltip tooltip-right">
                            <span className="tooltip-title">Download</span>
                            <span className="tooltip-desc">
                              {item.status === 'rejected' ? 'Download file to inspect & fix issues' : 'Download original Excel file'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* History Icon Button */}
                      <div className="broker-icon-btn-wrap">
                        <button
                          type="button"
                          className="broker-icon-btn btn-audit"
                          onClick={() => onOpenAudit && onOpenAudit(item.uuid)}
                          aria-label="View History"
                        >
                          <ClockIcon size={14} />
                        </button>
                        <div className="broker-tooltip tooltip-right">
                          <span className="tooltip-title">History</span>
                          <span className="tooltip-desc">Inspect lifecycle timeline & cycles</span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete / Revoke Success Notification Toast */}
      {deleteSuccessToast && (
        <div className="history-success-toast">
          <CheckCircleIcon size={16} />
          <span>{deleteSuccessToast}</span>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setDeleteSuccessToast(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Rejection Feedback Note Viewer Modal for HR */}
      {activeFeedbackItem && (
        <div
          className="delete-modal-backdrop"
          onClick={() => setActiveFeedbackItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="delete-modal-window feedback-viewer-window"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px' }}
          >
            <div className="delete-modal-header" style={{ borderBottomColor: '#fecaca' }}>
              <div className="delete-icon-badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                <AlertTriangleIcon size={20} />
              </div>
              <div>
                <h3 className="delete-modal-title" style={{ color: '#991b1b' }}>Broker Rejection Feedback</h3>
                <span className="delete-modal-subtitle">
                  Review the broker's required corrections before re-uploading
                </span>
              </div>
              <button
                type="button"
                className="delete-modal-close-btn"
                onClick={() => setActiveFeedbackItem(null)}
                title="Close"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="delete-modal-body">
              <div className="feedback-meta-badge-row">
                <span className="feedback-reason-chip">🏷️ {activeFeedbackItem.reason || 'Rejection Note'}</span>
                {activeFeedbackItem.rejectedAt && (
                  <span className="feedback-date-text">{formatDate(activeFeedbackItem.rejectedAt)}</span>
                )}
              </div>

              <div className="feedback-quote-card">
                <div className="feedback-author-line">
                  <strong>Broker Reviewer:</strong>
                  <span className="feedback-author-email">{activeFeedbackItem.rejectedByEmail || 'Broker'}</span>
                </div>
                <p className="feedback-comment-text">
                  "{activeFeedbackItem.comment || 'No specific feedback comment provided.'}"
                </p>
              </div>

              <div className="delete-notice-box" style={{ marginTop: '14px', background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
                <InfoIcon size={16} />
                <span>
                  <strong>Next Steps:</strong> Download your original submitted file, apply the requested fixes, and upload a fresh submission through the <strong>Upload & Validate</strong> tab.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Revoke Confirmation & Lock-Check Modal */}
      {itemToDelete && (
        <div
          className="delete-modal-backdrop"
          onClick={() => {
            if (!isDeleting) {
              setItemToDelete(null)
              setDeleteError(null)
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="delete-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-modal-header">
              <div className="delete-icon-badge">
                <TrashIcon size={20} />
              </div>
              <div>
                <h3 className="delete-modal-title">Revoke File Submission?</h3>
                <span className="delete-modal-subtitle">
                  Mark mistakenly uploaded file as revoked
                </span>
              </div>
              <button
                type="button"
                className="delete-modal-close-btn"
                onClick={() => {
                  if (!isDeleting) {
                    setItemToDelete(null)
                    setDeleteError(null)
                  }
                }}
                disabled={isDeleting}
                title="Cancel (Esc)"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="delete-modal-body">
              {deleteError ? (
                <div className="delete-error-banner">
                  <div className="delete-error-icon">
                    <LockIcon size={18} />
                  </div>
                  <div>
                    <strong>Revocation Blocked</strong>
                    <p>{deleteError}</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="delete-lead-text">
                    Are you sure you want to revoke this submission? It will be marked as <strong>Revoked</strong> and will no longer be available for broker review or download.
                  </p>

                  <div className="delete-file-summary-card">
                    <div className="delete-file-row">
                      <span className="df-label">File Name:</span>
                      <strong className="df-val">{itemToDelete.fileName}</strong>
                    </div>
                    <div className="delete-file-row">
                      <span className="df-label">Records:</span>
                      <span className="df-val">{itemToDelete.noOfRows ?? itemToDelete.validRows ?? 0} members</span>
                    </div>
                    <div className="delete-file-row">
                      <span className="df-label">Uploaded On:</span>
                      <span className="df-val">{formatDate(itemToDelete.uploadedOn)}</span>
                    </div>
                  </div>

                  <div className="delete-notice-box">
                    <AlertTriangleIcon size={16} />
                    <span>
                      <strong>Safety Check:</strong> The system will verify that no broker has claimed or locked this file before marking it as revoked.
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="delete-modal-footer">
              <button
                type="button"
                className="delete-modal-cancel-btn"
                onClick={() => {
                  setItemToDelete(null)
                  setDeleteError(null)
                }}
                disabled={isDeleting}
              >
                {deleteError ? 'Close' : 'Cancel'}
              </button>

              {!deleteError && (
                <button
                  type="button"
                  className="delete-modal-confirm-btn"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Checking Lock & Revoking…' : 'Yes, Revoke File'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
