import React, { useState, useEffect, useCallback } from 'react'
import {
  DownloadIcon,
  ExcelFileIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
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
  const [selectedCorpFilter, setSelectedCorpFilter] = useState('all')

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const validSubCorpIds = Array.isArray(corporates)
        ? corporates.map((c) => c.id).filter((id) => id && id !== '0' && id !== 0)
        : []
      const params = new URLSearchParams()

      if (selectedCorpFilter !== 'all') {
        params.append('corp_id', selectedCorpFilter)
      } else if (validSubCorpIds.length > 1) {
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
  }, [apiConfig, corpId, corporates, role, selectedCorpFilter])

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
      setError(err instanceof Error ? err.message : 'Could not download the file from S3.')
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

  return (
    <div className="upload-history-container">
      {/* Header with controls */}
      <div className="history-header">
        <div>
          <h3 className="history-title">
            Upload History
            <span className="history-count-badge">{historyItems.length}</span>
          </h3>
          <p className="history-subtitle">
            View all enrollment spreadsheets submitted to S3 and download the original files.
          </p>
        </div>

        <div className="history-actions">
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
      ) : (
        /* Table of past uploads */
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Uploaded Date</th>
                <th>Uploaded By</th>
                <th>Records</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {historyItems.map((item) => (
                <tr key={item.uuid}>
                  <td className="history-file-cell">
                    <div className="history-file-info">
                      <ExcelFileIcon size={24} />
                      <span className="history-filename" title={item.fileName}>
                        {item.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="history-date-cell">{formatDate(item.uploadedOn)}</td>
                  <td className="history-user-cell">{item.uploadedBy || 'HR Admin'}</td>
                  <td className="history-rows-cell">
                    <span className="valid-count">{item.validRows ?? item.totalRows ?? 0}</span>
                    <span className="total-count"> / {item.totalRows ?? 0}</span>
                  </td>
                  <td className="history-status-cell">{getStatusBadge(item.status)}</td>
                  <td className="history-action-cell" style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="history-download-btn"
                      onClick={() => handleDownload(item)}
                      disabled={downloadingUuid === item.uuid}
                      title="Download original file from S3"
                    >
                      <DownloadIcon size={14} />
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
