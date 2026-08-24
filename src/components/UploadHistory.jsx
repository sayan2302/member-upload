import { useState, useEffect, useCallback } from 'react'
import {
  DownloadIcon,
  ExcelFileIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  SearchIcon
} from './Icons.jsx'

export function UploadHistory({
  corpId,
  corporates = [],
  role = 'hr',
  apiConfig,
  refreshTrigger,
  onNavigateToUpload,
}) {
  const [historyItems, setHistoryItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadingUuid, setDownloadingUuid] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory, refreshTrigger])

  const handleDownload = async (item) => {
    if (!item.uuid || downloadingUuid) return

    setDownloadingUuid(item.uuid)
    try {
      const downloadUrl = `${apiConfig.apiBaseUrl}/uploads3/download/${item.uuid}?role=hr`
      const response = await fetch(downloadUrl, {
        headers: { 'x-api-key': apiConfig.apiKey },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Download failed (${response.status})`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = item.fileName || 'enrollment.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[UploadHistory] Download error:', err)
      setError(err instanceof Error ? err.message : 'Could not download the file.')
    } finally {
      setDownloadingUuid(null)
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

  const getStatusBadge = (status) => {
    const s = String(status || 'pending').toLowerCase()
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
        <span className="history-badge is-rejected">
          <AlertTriangleIcon size={12} />
          <span>Rejected</span>
        </span>
      )
    }
    return (
      <span className="history-badge is-pending">
        <ClockIcon size={12} />
        <span>Pending Review</span>
      </span>
    )
  }

  const filteredItems = historyItems.filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const fileName = (item.fileName || '').toLowerCase()
    const uploader = (item.uploadedByEmail || item.uploadedBy || '').toLowerCase()
    const status = (item.status || '').toLowerCase()
    return fileName.includes(q) || uploader.includes(q) || status.includes(q)
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
            View all enrollment files submitted and download the original files.
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

          <button
            type="button"
            className="history-refresh-btn"
            onClick={fetchHistory}
            disabled={isLoading}
            title="Refresh history"
          >
            <RefreshCwIcon size={14} className={isLoading ? 'spin' : ''} />
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
                <th className="col-records">Records</th>
                <th className="col-status">Status</th>
                <th className="col-actions" style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.uuid}>
                  <td className="history-file-cell">
                    <div className="history-file-info">
                      <ExcelFileIcon size={22} />
                      <span className="history-filename" title={item.fileName}>
                        {item.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="history-date-cell">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span 
                        className="history-uploader-name"
                        title={item.uploadedByEmail || item.uploadedBy || 'HR Admin'}
                      >
                        {item.uploadedByEmail && item.uploadedByEmail !== 'system' 
                          ? item.uploadedByEmail 
                          : (item.uploadedBy || 'hr.admin@mayfair.com')}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>{formatDate(item.uploadedOn)}</span>
                    </div>
                  </td>
                  <td className="history-rows-cell" style={{ whiteSpace: 'nowrap' }}>
                    <span className="valid-count" title={`${item.noOfRows ?? item.validRows ?? 0} member records`}>
                      {item.noOfRows ?? item.validRows ?? 0}
                    </span>
                  </td>
                  <td className="history-status-cell">{getStatusBadge(item.status)}</td>
                  <td className="history-action-cell" style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="history-download-btn"
                      onClick={() => handleDownload(item)}
                      disabled={downloadingUuid === item.uuid}
                      title="Download original file"
                    >
                      <DownloadIcon size={13} />
                      <span>
                        {downloadingUuid === item.uuid ? 'Downloading…' : 'Download'}
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
