import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  DownloadIcon,
  ExcelFileIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  UploadCloudIcon,
  LockIcon,
  DownloadLockIcon,
  UnlockIcon,
  InfoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
  CloseIcon,
  MessageSquareIcon
} from './Icons.jsx'
import { downloadFile } from '../utils/fileDownloader.js'
import { CorporatePolicySelector } from './CorporatePolicySelector.jsx'
import { SortDropdown } from './SortDropdown.jsx'
import { StatusFilterDropdown } from './StatusFilterDropdown.jsx'
import { DateRangeFilterDropdown } from './DateRangeFilterDropdown.jsx'

const PRESET_REASONS = [
  'Missing mandatory fields',
  'Incorrect policy details',
  'Member data mismatch',
  'Invalid file formatting',
  'Duplicate employee records',
  'Other'
]

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function BrokerDashboard({
  apiConfig,
  corporates = [],
  brokerId = '120',
  corpId = '',
  providerCorpId = '',
  userEmail = '',
  userName = '',
  onOpenUploadModal = () => {},
  onOpenAudit = () => {},
  refreshKey = 0,
  hasValidationErrors = false,
}) {
  const [historyItems, setHistoryItems] = useState([])
  const [totalServerCount, setTotalServerCount] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [processingUuid, setProcessingUuid] = useState(null)
  const [unlockConfirmItem, setUnlockConfirmItem] = useState(null)
  const [itemToReject, setItemToReject] = useState(null)
  const [selectedPresetReason, setSelectedPresetReason] = useState(PRESET_REASONS[0])
  const [rejectionComment, setRejectionComment] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectError, setRejectError] = useState('')
  const [rejectionSuccessToast, setRejectionSuccessToast] = useState(null)
  const [activeFeedbackItem, setActiveFeedbackItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('mayfair_accordion_file_submissions_collapsed')
      if (saved !== null) {
        return saved === 'true'
      }
    } catch (_) {}
    return false
  })
  const [sortBy, setSortBy] = useState('date') // 'date' | 'name' | 'records'
  const [sortOrder, setSortOrder] = useState('desc') // 'desc' | 'asc'

  const getUploaderInfo = useCallback((item) => {
    if (!item) {
      return {
        username: '—',
        email: '—',
        roleTag: 'HR',
      }
    }

    const isBroker = (
      item?.uploaderRole ||
      item?.uploader_role ||
      item?.templateType ||
      (item?.role === 'broker' ? 'broker' : 'hr')
    ).toLowerCase() === 'broker'

    const rawName = (
      item?.uploadedByName ||
      item?.uploaded_by_name ||
      item?.uploadedBy ||
      item?.uploaded_by ||
      item?.uploaderName ||
      item?.uploader_name ||
      item?.created_by_name ||
      item?.created_by ||
      item?.createdBy ||
      item?.actor_name ||
      item?.actorName ||
      item?.user_name ||
      item?.userName ||
      item?.name ||
      ''
    ).toString().trim()

    const rawEmail = (
      item?.uploadedByEmail ||
      item?.uploaded_by_email ||
      item?.uploaderEmail ||
      item?.uploader_email ||
      item?.created_by_email ||
      item?.createdByEmail ||
      item?.actor_email ||
      item?.actorEmail ||
      item?.user_email ||
      item?.userEmail ||
      item?.email ||
      ''
    ).toString().trim()

    let email = rawEmail || '—'
    let username = '—'

    if (rawName && !rawName.includes('@')) {
      username = rawName
    } else if (rawEmail && rawEmail.includes('@')) {
      const prefix = rawEmail.split('@')[0]
      username = prefix
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    } else if (rawName) {
      username = rawName
    }

    if (username === '—' && email !== '—') {
      if (email.includes('@')) {
        const prefix = email.split('@')[0]
        username = prefix
          .split(/[._-]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')
      } else {
        username = email
      }
    }

    return {
      username: username || '—',
      email: email || '—',
      roleTag: isBroker ? 'Broker' : 'HR',
    }
  }, [])

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('mayfair_accordion_file_submissions_collapsed', String(next))
      } catch (_) {}
      return next
    })
  }

  // Auto-collapse slowly and smoothly when validation has errors
  useEffect(() => {
    if (hasValidationErrors) {
      const timer = setTimeout(() => {
        setIsCollapsed(true)
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [hasValidationErrors])

  const fetchDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true)
    setError('')
    try {
      const clientCorpIds = Array.isArray(corporates)
        ? corporates.map((c) => c.id).filter((id) => id && id !== '0' && id !== 0)
        : []
      
      const brokerCorpIds = [corpId, providerCorpId]
        .filter((id) => id && id !== '0' && id !== 0)

      const allSubCorpIds = [...new Set([...clientCorpIds, ...brokerCorpIds])]

      const params = new URLSearchParams()

      if (allSubCorpIds.length > 0) {
        params.append('sub_corporate_ids', JSON.stringify(allSubCorpIds))
      }

      if (corpId || providerCorpId) {
        params.append('corp_id', String(corpId || providerCorpId))
      }

      params.append('role', 'broker')
      params.append('limit', '500')
      params.append('max_results', '500')

      const response = await fetch(
        `${apiConfig.apiBaseUrl}/uploads3/history?${params.toString()}`,
        {
          headers: { 
            'x-api-key': apiConfig.apiKey,
            ...(userEmail ? { 'x-user-email': userEmail } : {}),
          },
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Failed to fetch broker dashboard (${response.status})`)
      }

      const data = await response.json()
      const items = Array.isArray(data.files)
        ? data.files
        : Array.isArray(data.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : []
      const serverCount = data.total ?? data.total_count ?? data.totalCount ?? data.count ?? data.total_files
      setTotalServerCount(typeof serverCount === 'number' ? serverCount : null)
      setHistoryItems(items)
    } catch (err) {
      console.error('[BrokerDashboard] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      if (!isSilent) setIsLoading(false)
    }
  }, [apiConfig, corporates, corpId, providerCorpId, userEmail])

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true)
    try {
      await fetchDashboard()
    } finally {
      setTimeout(() => {
        setIsManualRefreshing(false)
      }, 650)
    }
  }

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
        ...(userEmail ? { 'x-user-email': userEmail } : {}),
      }
    })
  }

  const downloadOriginal = (item) => {
    try {
      const downloadUrl = `${apiConfig.apiBaseUrl}/uploads3/download/${item.uuid}?role=broker&broker_id=${encodeURIComponent(brokerId)}`
      downloadFile(downloadUrl, item.fileName || 'enrollment.xlsx')
    } catch (err) {
      console.error('[BrokerDashboard] Download error:', err)
      throw err;
    }
  }

  const handleDownloadAndLock = async (item) => {
    if (!item.uuid || processingUuid) return
    setProcessingUuid(item.uuid)
    
    // Optimistically update the item state so the UI immediately shows "Locked by You" & upload/unlock buttons without any lag
    setHistoryItems((prev) =>
      prev.map((it) =>
        it.uuid === item.uuid
          ? {
              ...it,
              isLocked: true,
              lockedByUserId: brokerId,
              locked_by_user_id: brokerId,
              lockedBy: brokerId,
              locked_by: brokerId,
            }
          : it
      )
    )

    try {
      const lockRes = await brokerFetch(`${apiConfig.apiBaseUrl}/uploads3/lock/${item.uuid}`, { method: 'POST' })
      if (!lockRes.ok) {
        const errorData = await lockRes.json().catch(() => ({}))
        throw new Error(errorData.error || `Lock failed (${lockRes.status})`)
      }

      await fetchDashboard(true)
      await downloadOriginal(item)

    } catch (err) {
      console.error('[BrokerDashboard] Lock & Download error:', err)
      setError(err instanceof Error ? err.message : 'Could not lock and download the file.')
      await fetchDashboard(true)
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
    setUnlockConfirmItem(null)

    // Optimistically update the item state to unlocked immediately
    setHistoryItems((prev) =>
      prev.map((it) =>
        it.uuid === item.uuid
          ? {
              ...it,
              isLocked: false,
              lockedByUserId: null,
              locked_by_user_id: null,
              lockedBy: null,
              locked_by: null,
            }
          : it
      )
    )

    try {
      const res = await brokerFetch(`${apiConfig.apiBaseUrl}/uploads3/unlock/${item.uuid}`, { method: 'POST' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Unlock failed (${res.status})`)
      }
      await fetchDashboard(true)
    } catch (err) {
      console.error('[BrokerDashboard] Unlock error:', err)
      setError(err instanceof Error ? err.message : 'Could not unlock the file.')
      await fetchDashboard(true)
    } finally {
      setProcessingUuid(null)
    }
  }

  const handleOpenRejectModal = (item) => {
    if (!item.uuid || processingUuid) return
    setItemToReject(item)
    setSelectedPresetReason(PRESET_REASONS[0])
    setRejectionComment('')
    setRejectError('')
  }

  const handleConfirmReject = async () => {
    if (!itemToReject || isRejecting) return
    const commentTrimmed = rejectionComment.trim()
    if (!commentTrimmed) {
      setRejectError('Please enter specific rejection comments/notes for HR.')
      return
    }

    setIsRejecting(true)
    setRejectError('')

    try {
      const res = await brokerFetch(`${apiConfig.apiBaseUrl}/uploads3/reject/${itemToReject.uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker_id: brokerId,
          reason: selectedPresetReason,
          comment: commentTrimmed,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Rejection failed (${res.status})`)
      }

      const rejectedName = itemToReject.fileName
      const itemUuid = itemToReject.uuid
      setItemToReject(null)
      setRejectionSuccessToast(`Submission "${rejectedName}" was successfully marked as Rejected.`)
      
      // Optimistically update status
      setHistoryItems((prev) =>
        prev.map((it) =>
          it.uuid === itemUuid
            ? {
                ...it,
                status: 'rejected',
                rejectionDetails: {
                  reason: selectedPresetReason,
                  comment: commentTrimmed,
                  rejectedAt: new Date().toISOString(),
                  rejectedByEmail: userEmail || 'Broker Reviewer',
                },
              }
            : it
        )
      )

      await fetchDashboard(true)
    } catch (err) {
      console.error('[BrokerDashboard] Reject error:', err)
      setRejectError(err instanceof Error ? err.message : 'Could not reject file.')
    } finally {
      setIsRejecting(false)
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

  useEffect(() => {
    const isAnyModalOpen = Boolean(activeFeedbackItem || itemToReject || unlockConfirmItem);
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          if (!isRejecting) {
            setItemToReject(null);
            setRejectError('');
          }
          setActiveFeedbackItem(null);
          setUnlockConfirmItem(null);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [activeFeedbackItem, itemToReject, unlockConfirmItem, isRejecting]);

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

  const isItemLocked = (item) => Boolean(item && (item.isLocked || item.lockedByUserId || item.locked_by_user_id || item.lockedBy || item.locked_by));
  const getLockedUserId = (item) => item ? (item.lockedByUserId || item.locked_by_user_id || item.lockedBy || item.locked_by || null) : null;

  const getStatusBadge = (status, lockedByUserId, rejectionDetails, itemObj) => {
    const s = String(status || 'pending').toLowerCase()
    
    if (s === 'approved' || s === 'completed') {
      return (
        <span 
          className="history-badge is-approved" 
          title="Approved: All member records validated and saved to database."
        >
          <CheckCircleIcon size={12} />
          <span>Approved</span>
        </span>
      )
    }

    if (s === 'failed') {
      return (
        <span 
          className="history-badge is-failed" 
          style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }}
          title="Validation or system processing failed."
        >
          <CloseIcon size={12} />
          <span>Failed</span>
        </span>
      )
    }

    if (s === 'rejected') {
      return (
        <span 
          className={`history-badge is-rejected ${rejectionDetails ? 'has-feedback-trigger' : ''}`}
          style={{ background: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5', cursor: rejectionDetails ? 'pointer' : 'default' }}
          title={rejectionDetails ? "Click to view broker rejection comments" : "Submission rejected by broker"}
          onClick={() => {
            if (rejectionDetails) {
              setActiveFeedbackItem(rejectionDetails)
            }
          }}
        >
          <MessageSquareIcon size={12} />
          <span>Rejected</span>
        </span>
      )
    }

    if (s === 'revoked') {
      return (
        <span 
          className="history-badge is-revoked" 
          title="Revoked: This file submission was revoked by HR."
        >
          <CloseIcon size={12} />
          <span>Revoked</span>
        </span>
      )
    }

    const locked = isItemLocked(itemObj || { lockedByUserId });
    const lockedUserId = getLockedUserId(itemObj || { lockedByUserId }) || lockedByUserId;

    if (locked) {
      if (String(lockedUserId) === String(brokerId)) {
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
            title={`Locked by ${lockedUserId}: Another broker is currently reviewing/editing this submission.`}
          >
            <LockIcon size={12} />
            <span>Locked by {lockedUserId}</span>
          </span>
        )
      }
    }

    return (
      <span 
        className="history-badge is-pending" 
        title="Pending: Uploaded by HR, awaiting broker validation."
      >
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

  const filteredItems = historyItems.filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!(item.fileName || '').toLowerCase().includes(q)) {
        return false;
      }
    }

    if (statusFilter !== 'all') {
      const s = String(item.status || 'pending').toLowerCase();
      const locked = isItemLocked(item);
      const isPendingState = s === 'pending' || s === 'pending_review' || s === 'processing' || !item.status;

      if (statusFilter === 'approved') {
        if (s !== 'approved' && s !== 'completed') return false;
      } else if (statusFilter === 'failed') {
        if (s !== 'failed') return false;
      } else if (statusFilter === 'rejected') {
        if (s !== 'rejected') return false;
      } else if (statusFilter === 'locked') {
        if (!isPendingState || !locked) return false;
      } else if (statusFilter === 'pending') {
        if (!isPendingState || locked) return false;
      } else if (statusFilter === 'revoked') {
        if (s !== 'revoked') return false;
      }
    }

    if (startDate || endDate) {
      const rawDate = item.uploadedOn || item.createdAt || item.uploaded_on;
      if (!rawDate) return false;
      const itemTime = new Date(rawDate).getTime();
      if (isNaN(itemTime)) return false;

      if (startDate) {
        const [sY, sM, sD] = startDate.split('-').map(Number);
        const startTime = new Date(sY, sM - 1, sD, 0, 0, 0, 0).getTime();
        if (itemTime < startTime) return false;
      }

      if (endDate) {
        const [eY, eM, eD] = endDate.split('-').map(Number);
        const endTime = new Date(eY, eM - 1, eD, 23, 59, 59, 999).getTime();
        if (itemTime > endTime) return false;
      }
    }

    return true;
  });

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
      const timeA = getTime(a)
      const timeB = getTime(b)
      comp = timeA - timeB
    }

    return sortOrder === 'asc' ? comp : -comp
  })

  return (
    <div className={`upload-history-container ${isCollapsed ? 'is-collapsed-container' : ''}`}>
      <div 
        className={`history-header ${isCollapsed ? 'is-header-collapsed' : ''}`} 
        style={{ 
          flexWrap: 'wrap', 
          gap: '12px', 
          alignItems: 'center',
          marginBottom: isCollapsed ? 0 : '16px'
        }}
      >
        <div>
          <button
            type="button"
            className="history-title-toggle"
            onClick={toggleCollapsed}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? "Click to expand submissions" : "Click to collapse submissions"}
          >
            <h3 className="history-title" style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              File Submissions
              <span className="history-count-badge">
                {Boolean(searchQuery.trim() || statusFilter !== 'all' || startDate || endDate)
                  ? filteredItems.length
                  : (totalServerCount ?? historyItems.length)}
              </span>
            </h3>
            <span className={`history-chevron-indicator ${isCollapsed ? 'is-collapsed' : 'is-expanded'}`}>
              <ChevronDownIcon size={16} />
            </span>
          </button>
        </div>

        {!isCollapsed && (
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
              isBroker={true}
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
              className="history-refresh-btn"
              onClick={handleManualRefresh}
              disabled={isLoading || isManualRefreshing}
              title="Refresh submissions list"
            >
              <RefreshCwIcon
                size={14}
                style={{
                  animation: (isLoading || isManualRefreshing) ? 'spin 1s linear infinite' : 'none',
                }}
              />
              <span>Refresh</span>
            </button>
          </div>
        )}
      </div>

      <div className={`history-collapsible-wrapper ${isCollapsed ? 'is-collapsed' : 'is-expanded'}`}>
        <div className="history-collapsible-inner">
          {error && (
            <div className="history-error-banner">
              <AlertTriangleIcon size={16} />
              <span>{error}</span>
              <button
                type="button"
                className="history-error-retry"
                onClick={fetchDashboard}
              >
                Retry
              </button>
            </div>
          )}

          {isLoading && historyItems.length === 0 ? (
            <div className="history-loading-skeleton">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : historyItems.length === 0 ? (
            <div className="history-empty-state">
              <p>No member enrollment files found for this corporate group.</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="history-empty-state" style={{ padding: '36px 16px' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                No files match your active filters or search query.
              </p>
            </div>
          ) : (
            <div className="history-table-wrapper" style={{ marginTop: '16px', maxHeight: '500px', overflowY: 'auto' }}>
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
                            <div className="status-popover-header">Broker Status Guide</div>
                            
                            <div className="status-popover-item">
                              <span className="status-dot dot-pending" />
                              <div className="status-popover-text">
                                <div className="status-popover-label">Pending</div>
                                <div className="status-popover-desc">Awaiting underwriting review (unclaimed by brokers).</div>
                              </div>
                            </div>

                            <div className="status-popover-item">
                              <span className="status-dot dot-locked" />
                              <div className="status-popover-text">
                                <div className="status-popover-label">Locked</div>
                                <div className="status-popover-desc">Claimed for exclusive editing.</div>
                              </div>
                            </div>

                            <div className="status-popover-item">
                              <span className="status-dot dot-approved" />
                              <div className="status-popover-text">
                                <div className="status-popover-label">Approved</div>
                                <div className="status-popover-desc">Enrollment finalized and active in underwriting system.</div>
                              </div>
                            </div>

                            <div className="status-popover-item">
                              <span className="status-dot dot-rejected" />
                              <div className="status-popover-text">
                                <div className="status-popover-label">Rejected</div>
                                <div className="status-popover-desc">Returned to HR with required correction comments.</div>
                              </div>
                            </div>

                            <div className="status-popover-item">
                              <span className="status-dot dot-failed" />
                              <div className="status-popover-text">
                                <div className="status-popover-label">Failed</div>
                                <div className="status-popover-desc">Validation error or parsing failure on submission.</div>
                              </div>
                            </div>

                            <div className="status-popover-item">
                              <span className="status-dot dot-revoked" />
                              <div className="status-popover-text">
                                <div className="status-popover-label">Revoked</div>
                                <div className="status-popover-desc">Revoked by HR prior to broker underwriting review.</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </th>
                    <th className="col-actions" style={{ minWidth: '220px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <span>Actions</span>
                        <div className="status-info-popover-wrapper">
                          <button 
                            type="button" 
                            className="status-info-trigger" 
                            aria-label="Action Buttons Lifecycle Guide"
                            title="Click or hover to view action button guide"
                          >
                            <InfoIcon size={13} />
                          </button>
                          <div className="status-popover-card popover-right" style={{ width: '300px' }}>
                            <div className="status-popover-header">Broker Actions Guide</div>
                            
                            <div className="status-popover-item">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: '#e0e7ff', color: '#4f46e5', flexShrink: 0 }}>
                                <UploadCloudIcon size={13} />
                              </div>
                              <div className="status-popover-text">
                                <div className="status-popover-label" style={{ color: '#4f46e5' }}>Upload Revised File</div>
                                <div className="status-popover-desc">Upload corrected Excel file on locked submissions.</div>
                              </div>
                            </div>

                            <div className="status-popover-item">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: '#fef3c7', color: '#d97706', flexShrink: 0 }}>
                                <UnlockIcon size={13} />
                              </div>
                              <div className="status-popover-text">
                                <div className="status-popover-label" style={{ color: '#d97706' }}>Release Lock</div>
                                <div className="status-popover-desc">Release your lock to let other team brokers review.</div>
                              </div>
                            </div>

                            <div className="status-popover-item">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', flexShrink: 0 }}>
                                <CloseIcon size={13} />
                              </div>
                              <div className="status-popover-text">
                                <div className="status-popover-label" style={{ color: '#dc2626' }}>Reject Submission</div>
                                <div className="status-popover-desc">Return submission to HR with mandatory feedback notes.</div>
                              </div>
                            </div>

                            <div className="status-popover-item">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: '#dcfce7', color: '#16a34a', flexShrink: 0 }}>
                                <DownloadLockIcon size={13} />
                              </div>
                              <div className="status-popover-text">
                                <div className="status-popover-label" style={{ color: '#16a34a' }}>Download &amp; Lock</div>
                                <div className="status-popover-desc">Download Excel file and claim exclusive edit lock.</div>
                              </div>
                            </div>

                            <div className="status-popover-item">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: '#e0f2fe', color: '#0284c7', flexShrink: 0 }}>
                                <ClockIcon size={13} />
                              </div>
                              <div className="status-popover-text">
                                <div className="status-popover-label" style={{ color: '#0284c7' }}>File Audit History</div>
                                <div className="status-popover-desc">Inspect multi-cycle events, timestamps, and versions.</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => {
                    const isRevoked = String(item.status || 'pending').toLowerCase() === 'revoked';
                    const isRejected = String(item.status || 'pending').toLowerCase() === 'rejected';
                    const isApproved = String(item.status || 'pending').toLowerCase() === 'approved';
                    const isLocked = isItemLocked(item);
                    const lockedUserId = getLockedUserId(item);
                    const isLockedByMe = isLocked && String(lockedUserId) === String(brokerId);
                    const isLockedByOther = isLocked && !isLockedByMe;
                    
                    return (
                      <tr key={item.uuid} className={isLockedByOther ? 'is-disabled-row' : ''} style={{ opacity: isLockedByOther ? 0.6 : 1 }}>
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
                        <td className="history-status-cell" style={{ whiteSpace: 'nowrap' }}>
                          {getStatusBadge(item.status, item.lockedByUserId, item.rejectionDetails, item)}
                        </td>
                        <td className="history-action-cell" style={{ textAlign: 'right', whiteSpace: 'nowrap', minWidth: '220px' }}>
                          <div className="broker-actions-grid">
                            {/* ── Slot 1: Upload Action (only when locked by me) ── */}
                            <div className="broker-action-slot slot-upload">
                              {!isRevoked && !isRejected && !isApproved && isLockedByMe && (
                                <div className="broker-icon-btn-wrap">
                                  <button
                                    type="button"
                                    className="broker-icon-btn btn-upload"
                                    onClick={() => onOpenUploadModal && onOpenUploadModal(item)}
                                    aria-label="Upload Revised File"
                                  >
                                    <UploadCloudIcon size={14} />
                                  </button>
                                  <div className="broker-tooltip">
                                    <span className="tooltip-title">Upload Revised File</span>
                                    <span className="tooltip-desc">Upload fixed file for this corporate</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* ── Slot 2: Unlock Action (only when locked by me) ── */}
                            <div className="broker-action-slot slot-unlock">
                              {!isRevoked && !isRejected && !isApproved && isLockedByMe && (
                                <div className="broker-icon-btn-wrap">
                                  <button
                                    type="button"
                                    className="broker-icon-btn btn-unlock"
                                    onClick={() => setUnlockConfirmItem(item)}
                                    disabled={processingUuid === item.uuid}
                                    aria-label="Release lock"
                                  >
                                    <UnlockIcon size={14} />
                                  </button>
                                  <div className="broker-tooltip">
                                    <span className="tooltip-title">Release Lock</span>
                                    <span className="tooltip-desc">Unlock so others can edit</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* ── Slot 3: Reject Action (when unlocked or locked by me) ── */}
                            <div className="broker-action-slot slot-reject">
                              {!isRevoked && !isRejected && !isApproved && (isLockedByMe || !isLocked) && (
                                <div className="broker-icon-btn-wrap">
                                  <button
                                    type="button"
                                    className="broker-icon-btn btn-reject"
                                    onClick={() => {
                                      setItemToReject(item)
                                      setRejectError('')
                                      setRejectionComment('')
                                      setSelectedPresetReason(PRESET_REASONS[0])
                                    }}
                                    disabled={processingUuid === item.uuid}
                                    aria-label="Reject Submission"
                                  >
                                    <CloseIcon size={14} />
                                  </button>
                                  <div className="broker-tooltip tooltip-right">
                                    <span className="tooltip-title">Reject</span>
                                    <span className="tooltip-desc">Return to HR with feedback</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* ── Slot 4: Download Action (Download, Download & Lock, or Locked) ── */}
                            <div className="broker-action-slot slot-download">
                              {!isRevoked && !isRejected && !isApproved && !isLocked && (
                                <div className="broker-icon-btn-wrap">
                                  <button
                                    type="button"
                                    className="broker-icon-btn btn-lock"
                                    onClick={() => handleDownloadAndLock(item)}
                                    disabled={processingUuid === item.uuid}
                                    aria-label="Download & Lock file"
                                  >
                                    <DownloadLockIcon size={15} />
                                  </button>
                                  <div className="broker-tooltip tooltip-right">
                                    <span className="tooltip-title">Download &amp; Lock</span>
                                    <span className="tooltip-desc">Claim lock & download template</span>
                                  </div>
                                </div>
                              )}

                              {!isRevoked && !isRejected && !isApproved && isLockedByMe && (
                                <div className="broker-icon-btn-wrap">
                                  <button
                                    type="button"
                                    className="broker-icon-btn btn-download"
                                    onClick={() => handleDownload(item)}
                                    disabled={processingUuid === item.uuid}
                                    aria-label="Download file"
                                  >
                                    <DownloadIcon size={14} />
                                  </button>
                                  <div className="broker-tooltip tooltip-right">
                                    <span className="tooltip-title">Download File</span>
                                    <span className="tooltip-desc">Download original spreadsheet</span>
                                  </div>
                                </div>
                              )}

                              {!isRevoked && !isRejected && !isApproved && isLockedByOther && (
                                <div className="broker-icon-btn-wrap">
                                  <button
                                    type="button"
                                    className="broker-icon-btn btn-locked-other"
                                    disabled
                                    aria-label={`Locked by Broker ${lockedUserId || item.lockedByUserId}`}
                                  >
                                    <LockIcon size={14} />
                                  </button>
                                  <div className="broker-tooltip tooltip-right">
                                    <span className="tooltip-title">Locked by Broker {lockedUserId || item.lockedByUserId}</span>
                                    <span className="tooltip-desc">Currently claimed by another broker</span>
                                  </div>
                                </div>
                              )}

                              {(isApproved || isRejected) && (
                                <div className="broker-icon-btn-wrap">
                                  <button
                                    type="button"
                                    className="broker-icon-btn btn-download"
                                    onClick={() => handleDownload(item)}
                                    disabled={processingUuid === item.uuid}
                                    aria-label="Download spreadsheet"
                                  >
                                    <DownloadIcon size={14} />
                                  </button>
                                  <div className="broker-tooltip tooltip-right">
                                    <span className="tooltip-title">Download</span>
                                    <span className="tooltip-desc">Download original file</span>
                                  </div>
                                </div>
                              )}

                              {isRevoked && (
                                <div className="broker-icon-btn-wrap">
                                  <button
                                    type="button"
                                    className="broker-icon-btn btn-download"
                                    onClick={() => handleDownload(item)}
                                    disabled={processingUuid === item.uuid}
                                    aria-label="Download spreadsheet"
                                  >
                                    <DownloadIcon size={14} />
                                  </button>
                                  <div className="broker-tooltip tooltip-right">
                                    <span className="tooltip-title">Download</span>
                                    <span className="tooltip-desc">Download original file</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* ── Slot 5: Audit Trail Icon Button ── */}
                            <div className="broker-action-slot slot-audit">
                              <div className="broker-icon-btn-wrap">
                                <button
                                  type="button"
                                  className="broker-icon-btn btn-audit"
                                  onClick={() => onOpenAudit && onOpenAudit(item.uuid)}
                                  aria-label="View History"
                                >
                                  <ClockIcon size={14} />
                                </button>
                                <div className="broker-tooltip">
                                  <span className="tooltip-title">History</span>
                                  <span className="tooltip-desc">Inspect lifecycle timeline & cycles</span>
                                </div>
                              </div>
                            </div>
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

      {rejectionSuccessToast && typeof document !== 'undefined' && createPortal(
        <div className="history-success-toast">
          <CheckCircleIcon size={16} />
          <span>{rejectionSuccessToast}</span>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setRejectionSuccessToast(null)}
          >
            ×
          </button>
        </div>,
        document.body
      )}

      {itemToReject && typeof document !== 'undefined' && createPortal(
        <div
          className="delete-modal-backdrop"
          onClick={() => {
            if (!isRejecting) {
              setItemToReject(null)
              setRejectError('')
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="delete-modal-window reject-modal-window"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
          >
            <div className="delete-modal-header">
              <div className="delete-icon-badge reject-icon-badge">
                <CloseIcon size={20} />
              </div>
              <div>
                <h3 className="delete-modal-title">Reject File Submission</h3>
                <span className="delete-modal-subtitle">
                  Send mandatory feedback to HR explaining required corrections
                </span>
              </div>
              <button
                type="button"
                className="delete-modal-close-btn"
                onClick={() => {
                  if (!isRejecting) {
                    setItemToReject(null)
                    setRejectError('')
                  }
                }}
                disabled={isRejecting}
                title="Cancel (Esc)"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="delete-modal-body">
              {rejectError ? (
                <div className="delete-error-banner" style={{ marginBottom: '14px' }}>
                  <div className="delete-error-icon">
                    <AlertTriangleIcon size={18} />
                  </div>
                  <div>
                    <strong>Rejection Error</strong>
                    <p>{rejectError}</p>
                  </div>
                </div>
              ) : null}

              <div className="delete-file-summary-card" style={{ marginBottom: '14px' }}>
                <div className="delete-file-row">
                  <span className="df-label">File Name:</span>
                  <strong className="df-val">{itemToReject.fileName}</strong>
                </div>
                <div className="delete-file-row">
                  <span className="df-label">Records:</span>
                  <span className="df-val">{itemToReject.noOfRows ?? itemToReject.validRows ?? 0} members</span>
                </div>
                <div className="delete-file-row">
                  <span className="df-label">Uploaded By:</span>
                  <span className="df-val">{getUploaderInfo(itemToReject).username} ({getUploaderInfo(itemToReject).email})</span>
                </div>
              </div>

              <div className="reject-field-group">
                <label className="reject-field-label">
                  Reason Category <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="preset-chips-container">
                  {PRESET_REASONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`preset-chip ${selectedPresetReason === preset ? 'is-selected' : ''}`}
                      onClick={() => setSelectedPresetReason(preset)}
                      disabled={isRejecting}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="reject-field-group" style={{ marginTop: '12px' }}>
                <label className="reject-field-label">
                  Comments for HR <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="reject-comment-textarea"
                  rows={3}
                  placeholder="Explain the specific issue (e.g. Row 4 is missing Employee ID, DOB format is invalid, or incorrect Plan Code selected)..."
                  value={rejectionComment}
                  onChange={(e) => setRejectionComment(e.target.value)}
                  disabled={isRejecting}
                  autoFocus
                />
              </div>

              <div className="delete-notice-box" style={{ marginTop: '12px' }}>
                <InfoIcon size={16} />
                <span>
                  <strong>HR Visibility:</strong> HR will receive this comment in their submission history and can download their file to fix and re-upload.
                </span>
              </div>
            </div>

            <div className="delete-modal-footer">
              <button
                type="button"
                className="delete-modal-cancel-btn"
                onClick={() => {
                  setItemToReject(null)
                  setRejectError('')
                }}
                disabled={isRejecting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-modal-confirm-btn reject-confirm-btn"
                onClick={handleConfirmReject}
                disabled={isRejecting || !rejectionComment.trim()}
              >
                {isRejecting ? 'Rejecting Submission…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {activeFeedbackItem && typeof document !== 'undefined' && createPortal(
        <div
          className="delete-modal-backdrop"
          onClick={() => setActiveFeedbackItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="delete-modal-window feedback-viewer-window"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div className="delete-modal-header" style={{ borderBottomColor: '#fecaca' }}>
              <div className="delete-icon-badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                <AlertTriangleIcon size={20} />
              </div>
              <div>
                <h3 className="delete-modal-title" style={{ color: '#991b1b' }}>Broker Rejection Feedback</h3>
                <span className="delete-modal-subtitle">
                  Feedback details for this rejected submission
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
                  <strong>Broker Note:</strong>
                  <span className="feedback-author-email">({activeFeedbackItem.rejectedByEmail || 'Broker Reviewer'})</span>
                </div>
                <p className="feedback-comment-text">
                  "{activeFeedbackItem.comment || 'No specific comments provided.'}"
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {unlockConfirmItem && typeof document !== 'undefined' && createPortal(
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
        </div>,
        document.body
      )}
    </div>
  )
}
