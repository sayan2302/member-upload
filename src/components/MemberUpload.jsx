import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { getApiConfig } from './apiConfig.js'
import { CorporatePolicySelector } from './CorporatePolicySelector.jsx'
import { UploadHistory } from './UploadHistory.jsx'
import { BrokerDashboard } from './BrokerDashboard.jsx'
import { BrokerUploadModal } from './BrokerUploadModal.jsx'
import {
  DownloadIcon,
  ExcelFileIcon,
  UploadCloudIcon,
  CloseIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  SendIcon,
  ClockIcon,
  MaximizeIcon,
  MinimizeIcon,
  LayersIcon,
  ChevronDownIcon,
} from './Icons.jsx'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const apiConfig = getApiConfig()

const asErrorText = (remark) => {
  if (!remark) return ''
  let text = typeof remark === 'string' ? remark : remark.message || remark.reason || remark.error || JSON.stringify(remark)
  // Clean up ugly Joi enum lists like "one of [Mr, Miss, Mrs, Khun, , null]" -> "one of [Mr, Miss, Mrs, Khun]"
  text = text.replace(/,\s*,\s*/g, ', ')
  text = text.replace(/,\s*null\s*\]/gi, ']')
  text = text.replace(/,\s*""\s*\]/gi, ']')
  text = text.replace(/\[\s*,\s*/g, '[')
  return text.trim()
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export class ValidationPreviewBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidUpdate(previousProps) {
    if (previousProps.previewKey !== this.props.previewKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="preview-error">
          The validation completed, but this preview could not be displayed. Clear the file and try again.
        </p>
      )
    }
    return this.props.children
  }
}

export function ValidationWorksheet({
  result,
  errorsOnly,
  onErrorsOnlyChange,
  validationSummary,
  role = 'hr',
  isBroker = false,
  hideSummaryText = false,
}) {
  const [visibleRowCount, setVisibleRowCount] = useState(75)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const totalCount = validationSummary?.totalRows ?? result?.summary?.totalRows ?? 0
  const acceptedCount = validationSummary?.acceptedRows ?? result?.summary?.acceptedRows ?? 0
  const errorCount = validationSummary?.rejectedCount ?? result?.summary?.rejectedRows ?? 0

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsFullscreen(false)
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKeyDown)
      }
    } else {
      document.body.style.overflow = ''
    }
  }, [isFullscreen])

  const cleanKey = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '')

  const { rows, errorRows, columns, columnLabels } = useMemo(() => {
    const acceptedRows = Array.isArray(result?.acceptedRows) ? result.acceptedRows : []
    const rejectedRows = Array.isArray(result?.rejectedRows) ? result.rejectedRows : []
    const allRows = [...acceptedRows, ...rejectedRows]
      .filter((row) => row && typeof row === 'object')
      .sort((first, second) => (first.sourceRow || first.row || 0) - (second.sourceRow || second.row || 0))
    const invalidRows = allRows.filter((row) => row.valid === false)
    const headers = [...new Set(allRows.flatMap((row) => Object.keys(row.values || {})))]

    const labelMap = {}
    for (const row of allRows) {
      if (Array.isArray(row.fields)) {
        for (const f of row.fields) {
          if (f?.colMapping && f?.fieldName) {
            labelMap[f.colMapping] = f.fieldName
          }
        }
      }
    }

    return { rows: allRows, errorRows: invalidRows, columns: headers, columnLabels: labelMap }
  }, [result])

  const filteredRows = errorsOnly ? errorRows : rows
  const displayedRows = filteredRows.slice(0, visibleRowCount)

  const getFieldIssues = (row, column) => {
    const fields = Array.isArray(row.fields) ? row.fields : []
    const targetClean = cleanKey(column)
    const targetLower = String(column || '').trim().toLowerCase()

    // Find all matching field objects (by colMapping, fieldName, or normalized alphanumeric key)
    const matchingFields = fields.filter((item) => {
      if (!item) return false
      const colClean = cleanKey(item.colMapping)
      const nameClean = cleanKey(item.fieldName)
      const colLower = String(item.colMapping || '').trim().toLowerCase()
      const nameLower = String(item.fieldName || '').trim().toLowerCase()

      return (
        colClean === targetClean ||
        nameClean === targetClean ||
        colLower === targetLower ||
        nameLower === targetLower
      )
    })

    if (matchingFields.length === 0) return []

    // Collect all unique remarks from all matching field objects
    const allRemarks = []
    for (const f of matchingFields) {
      if (Array.isArray(f.remarks)) {
        for (const rem of f.remarks) {
          const text = asErrorText(rem)
          if (text && !allRemarks.includes(text)) {
            allRemarks.push(text)
          }
        }
      }
      if (f.valid === false && allRemarks.length === 0) {
        allRemarks.push('Invalid value')
      }
    }

    return allRemarks
  }

  return (
    <section 
      className={`upload-card validation-panel ${isCollapsed ? 'is-card-collapsed' : ''} ${isFullscreen ? 'is-fullscreen' : ''}`} 
      aria-label="Interactive Worksheet Preview"
    >
      <div 
        className={`validation-panel-header corporate-section-header ${isCollapsed ? 'is-header-collapsed' : ''}`}
      >
        <div>
          <button
            type="button"
            className="history-title-toggle"
            onClick={() => setIsCollapsed(prev => !prev)}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? "Click to expand worksheet preview" : "Click to collapse worksheet preview"}
          >
            <span className="history-title-text">Interactive Worksheet Preview</span>
            <span className="history-count-badge">{totalCount}</span>
            <span className={`history-chevron-indicator ${isCollapsed ? 'is-collapsed' : 'is-expanded'}`}>
              <ChevronDownIcon size={16} />
            </span>
          </button>
        </div>

        <div className={`validation-header-controls ${isCollapsed ? 'is-hidden-actions' : ''}`}>
          {/* Integrated Compact KPI Metrics Strip */}
          <div className="worksheet-metrics-strip">
            <div className="ws-metric-pill is-total" title="Total records in file">
              <span className="ws-metric-label">TOTAL</span>
              <span className="ws-metric-val">{totalCount}</span>
            </div>

            <div className="ws-metric-pill is-accepted" title="Valid records passed all checks">
              <CheckCircleIcon size={12} className="ws-metric-icon" />
              <span className="ws-metric-label">ACCEPTED</span>
              <span className="ws-metric-val">{acceptedCount}</span>
            </div>

            <div className={`ws-metric-pill is-rejected ${errorCount > 0 ? 'has-errors' : ''}`} title="Records with validation errors">
              <AlertTriangleIcon size={12} className="ws-metric-icon" />
              <span className="ws-metric-label">ERRORS</span>
              <span className="ws-metric-val">{errorCount}</span>
            </div>
          </div>

          {/* Modern Sliding Switch Toggle */}
          <label className="ws-toggle-switch" title="Toggle to display only rows with errors">
            <input
              type="checkbox"
              checked={errorsOnly}
              onChange={(event) => onErrorsOnlyChange(event.target.checked)}
            />
            <span className="ws-toggle-track">
              <span className="ws-toggle-thumb" />
            </span>
            <span className="ws-toggle-label">Show errors only</span>
          </label>

          {/* Fullscreen Button */}
          <button
            type="button"
            className={`worksheet-fullscreen-btn ${isFullscreen ? 'is-active-btn' : ''}`}
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand to Fullscreen"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Expand to Fullscreen"}
          >
            {isFullscreen ? <MinimizeIcon size={14} /> : <MaximizeIcon size={14} />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      <div className={`history-collapsible-wrapper ${isCollapsed ? 'is-collapsed' : 'is-expanded'}`}>
        <div className="history-collapsible-inner">
          <div className="worksheet-scroll">
            <table className="worksheet">
              <thead>
                <tr>
                  <th className="row-number-header">Row</th>
                  {columns.map((column) => (
                    <th key={column}>{columnLabels?.[column] || column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((row) => (
                  <tr
                    key={`${row.sourceRow || row.row}-${row.row}`}
                    className={row.valid === false ? 'has-row-error' : ''}
                  >
                    <th scope="row" className="row-number">
                      {row.sourceRow || row.row}
                    </th>
                    {columns.map((column) => {
                      const issues = getFieldIssues(row, column)
                      const hasError = issues.length > 0
                      const cellVal = row.values?.[column]
                      const displayVal = cellVal !== null && cellVal !== undefined && cellVal !== '' ? String(cellVal) : ''
                      const colName = columnLabels?.[column] || column
                      const tooltip = hasError
                        ? issues.length > 1
                          ? `Errors on ${colName}:\n${issues.map((msg, idx) => `• ${msg}`).join('\n')}`
                          : issues[0]
                        : undefined

                      return (
                        <td
                          key={column}
                          className={hasError ? 'cell-error' : ''}
                          title={tooltip}
                          tabIndex={hasError ? 0 : undefined}
                        >
                          <div className="cell-content">
                            <span className="cell-text">
                              {displayVal || (hasError ? <span className="cell-empty">(empty)</span> : '—')}
                            </span>
                            {hasError && (
                              <span className="cell-error-corner" />
                            )}
                          </div>
                          {hasError && (
                            <div className="cell-error-tooltip">
                              <div className="cell-tooltip-header">
                                <span className="tooltip-field-name">{colName}</span>
                                {issues.length > 1 && (
                                  <span className="tooltip-count-badge">{issues.length} errors</span>
                                )}
                              </div>
                              <ul className="cell-tooltip-list">
                                {issues.map((msg, idx) => (
                                  <li key={idx} className="cell-tooltip-item">
                                    <span className="tooltip-bullet">•</span>
                                    <span>{msg}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {displayedRows.length === 0 && (
                  <tr>
                    <td className="empty-results" colSpan={Math.max(columns.length + 1, 1)}>
                      No rows with errors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {displayedRows.length < filteredRows.length && (
            <button
              type="button"
              className="show-more-button"
              onClick={() => setVisibleRowCount((count) => count + 75)}
            >
              Show 75 more rows
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default function MemberUpload({
  role = 'hr',
  corpId,
  providerCorpId,
  brokerId,
  optionsUrl,
  corporates: initialCorporates,
} = {}) {
  const resolvedRole = (role || 'hr').toLowerCase()
  const firstCorpId = Array.isArray(initialCorporates) && initialCorporates.length > 0 && initialCorporates[0].id && initialCorporates[0].id !== '0'
    ? String(initialCorporates[0].id).trim()
    : null
  const defaultCorpId = String(corpId && corpId !== '0' ? corpId : (firstCorpId || providerCorpId || '1422138')).trim()
  const defaultProviderCorpId = String(providerCorpId && providerCorpId !== '0' ? providerCorpId : defaultCorpId).trim()
  const defaultBrokerId = String(brokerId || '120').trim()

  const [corporates, setCorporates] = useState(() => {
    if (Array.isArray(initialCorporates) && initialCorporates.length > 0) return initialCorporates
    return resolvedRole === 'broker'
      ? [
          { id: '1422135', name: 'A3 Test industries' },
          { id: '1422138', name: 'ELTS Corporate' },
        ]
      : [{ id: defaultCorpId, name: 'ELTS Corporate' }]
  })

  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const [validationSummary, setValidationSummary] = useState(null)
  const [validationResult, setValidationResult] = useState(null)
  const [validationPassed, setValidationPassed] = useState(false)
  const [errorsOnly, setErrorsOnly] = useState(true)

  const [submissionReceipt, setSubmissionReceipt] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [successModal, setSuccessModal] = useState(null)
  const [activeTab, setActiveTab] = useState(resolvedRole === 'broker' ? 'dashboard' : 'upload')
  const [brokerTargetItem, setBrokerTargetItem] = useState(null)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [progressState, setProgressState] = useState(null)
  const [currentFileUuid, setCurrentFileUuid] = useState(null)
  const [uploadModeModal, setUploadModeModal] = useState(null)

  const inputRef = useRef(null)

  // Listen for Escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (successModal) setSuccessModal(null)
        if (uploadModeModal) setUploadModeModal(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [successModal, uploadModeModal])

  // Optional: fetch live corporate options if optionsUrl is provided in .NET
  useEffect(() => {
    if (!optionsUrl) return
    fetch(optionsUrl, { headers: { Accept: 'application/json' } })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success) {
          if (Array.isArray(data.corporates) && data.corporates.length > 0) setCorporates(data.corporates)
        }
      })
      .catch((err) => console.warn('[MemberUpload] Could not fetch options from server', err))
  }, [optionsUrl])

  const selectFile = (selectedFile) => {
    if (!selectedFile) return

    if (selectedFile.size > MAX_FILE_SIZE) {
      setMessage('File is too large. Maximum allowed size is 5 MB.')
      setMessageType('error')
      return
    }

    const isExcel =
      selectedFile.name.endsWith('.xlsx') ||
      selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    if (!isExcel) {
      setMessage('Invalid file type. Please upload a valid .xlsx spreadsheet.')
      setMessageType('error')
      return
    }

    setFile(selectedFile)
    setValidationPassed(false)
    setValidationSummary(null)
    setValidationResult(null)
    setSubmitSuccess(false)
    setSubmissionReceipt(null)
    setMessage('')
  }

  const handleDropZoneClick = (e) => {
    if (e.target.closest('button')) return
    if (file) return
    if (resolvedRole === 'broker') {
      setUploadModeModal({ type: 'browse' })
    } else {
      inputRef.current?.click()
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    const droppedFile = event.dataTransfer.files?.[0]
    if (!droppedFile) return
    if (resolvedRole === 'broker' && !file) {
      setUploadModeModal({ type: 'drop', file: droppedFile })
    } else {
      selectFile(droppedFile)
    }
  }

  const handleProceedFreshUpload = () => {
    const modalData = uploadModeModal
    setUploadModeModal(null)
    if (!modalData) return
    if (modalData.type === 'drop' && modalData.file) {
      selectFile(modalData.file)
    } else {
      inputRef.current?.click()
    }
  }

  const handleGoToSubmissions = () => {
    setUploadModeModal(null)
    const submissionsElement = document.querySelector('.submissions-container-card')
    if (submissionsElement) {
      submissionsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const clearFile = () => {
    setFile(null)
    setValidationPassed(false)
    setValidationSummary(null)
    setValidationResult(null)
    setSubmitSuccess(false)
    setSubmissionReceipt(null)
    setMessage('')
    if (resolvedRole !== 'broker') setBrokerTargetItem(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const downloadTemplate = async () => {
    setIsDownloading(true)
    setMessage('')

    try {
      const validSubCorpIds = Array.isArray(corporates)
        ? corporates.map((c) => c.id).filter((id) => id && id !== '0' && id !== 0)
        : []

      const params = new URLSearchParams()
      params.set('for', resolvedRole === 'broker' ? 'broker' : 'hr')
      if (defaultCorpId && defaultCorpId !== '0') {
        params.set('corp_id', defaultCorpId)
      }
      if (Array.isArray(corporates) && corporates.length > 0) {
        params.set('corporates', JSON.stringify(corporates))
      }
      if (validSubCorpIds.length > 0) {
        params.set('sub_corporate_ids', JSON.stringify(validSubCorpIds))
      }

      const endpoint = `${apiConfig.apiBaseUrl}/enrolment-meta/0/sample-csv?${params.toString()}`
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'x-api-key': apiConfig.apiKey },
      })
      if (!response.ok) throw new Error(`Template download failed (${response.status})`)

      const blob = await response.blob()
      const rawHeaderFilename = response.headers
        .get('content-disposition')
        ?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)?.[1]
        ?.replace(/['"]/g, '')

      const defaultRoleFilename =
        resolvedRole === 'broker'
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Member_Upload_Template_${resolvedRole.toUpperCase()}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setMessage('Unable to download template. Please try again.')
      setMessageType('error')
    } finally {
      setIsDownloading(false)
    }
  }

  const validateFile = async () => {
    if (!file) return
    setIsValidating(true)
    setMessage('')
    setProgressState(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('isRetailPolicy', 'false')
      formData.append('role', resolvedRole)
      formData.append('isBroker', resolvedRole === 'broker' ? 'true' : 'false')
      const isGroupHr = resolvedRole === 'hr' && Array.isArray(corporates) && corporates.length > 1;
      formData.append('is_group', isGroupHr ? 'true' : 'false')
      formData.append('is_group_hr', isGroupHr ? 'true' : 'false')
      formData.append('corp_id', defaultCorpId)
      formData.append('provider_corp_id', defaultProviderCorpId)
      formData.append('broker_id', defaultBrokerId)
      if (currentFileUuid) {
        formData.append('file_uuid', currentFileUuid)
        formData.append('uuid', currentFileUuid)
      }
      formData.append('sub_corporates', JSON.stringify(corporates))
      formData.append('sub_corporate_names', JSON.stringify(corporates.map((c) => c.name)))
      formData.append('sub_corporate_ids', JSON.stringify(corporates.map((c) => c.id)))

      const validateEndpoint = resolvedRole === 'broker'
        ? `${apiConfig.apiBaseUrl}/broker/upload/validate`
        : `${apiConfig.apiBaseUrl}/validate/preview`

      const response = await fetch(validateEndpoint, {
        method: 'POST',
        headers: { 
          'x-api-key': apiConfig.apiKey,
          'x-user-id': String(defaultBrokerId),
        },
        body: formData,
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.detail || data.error || `Validation failed (${response.status})`)
      }

      if (data.uuid || data.file_uuid) {
        setCurrentFileUuid(data.uuid || data.file_uuid)
      }

      const acceptedRows = Array.isArray(data.acceptedRows) ? data.acceptedRows : []
      const rejectedRows = Array.isArray(data.rejectedRows) ? data.rejectedRows : []
      const totalRows = (data.totalRows != null ? data.totalRows : acceptedRows.length + rejectedRows.length) || 0
      const acceptedCount = (data.acceptedCount != null ? data.acceptedCount : acceptedRows.length) || 0
      const rejectedCount = (data.rejectedCount != null ? data.rejectedCount : rejectedRows.length) || 0

      setValidationSummary({
        totalRows,
        acceptedRows: acceptedCount,
        rejectedCount,
      })
      setValidationResult(data)

      const isClean = rejectedCount === 0 && acceptedCount > 0
      setValidationPassed(isClean)

      if (isClean) {
        setMessage('All records passed validation. You can now submit this file.')
        setMessageType('success')
      } else {
        setMessage(`Validation found issues in ${rejectedCount} row(s). Please review and correct them.`)
        setMessageType('error')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to validate the file. Please check file format.')
      setMessageType('error')
      setValidationPassed(false)
      setValidationSummary(null)
      setValidationResult(null)
    } finally {
      setIsValidating(false)
    }
  }

  // Phase 1: Upload to S3 and save metadata in enrollment_file_metadata table
  const submitToS3 = async () => {
    if (!file || !validationPassed) return

    setIsSubmitting(true)
    setMessage('')

    try {
      const isGroupHr = resolvedRole === 'hr' && Array.isArray(corporates) && corporates.length > 1;
      const formData = new FormData()
      formData.append('file', file)
      formData.append('role', resolvedRole)
      formData.append('is_group', isGroupHr ? 'true' : 'false')
      formData.append('is_group_hr', isGroupHr ? 'true' : 'false')
      formData.append('provider_corp_id', defaultProviderCorpId)
      formData.append('corp_id', defaultCorpId)
      if (currentFileUuid) {
        formData.append('uuid', currentFileUuid)
        formData.append('file_uuid', currentFileUuid)
      }
      formData.append('sub_corporates', JSON.stringify(corporates))
      formData.append('template_type', resolvedRole === 'broker' ? 'broker' : 'hr')
      formData.append('no_of_rows', String(validationSummary?.totalRows || 0))
      formData.append('valid_rows', String(validationSummary?.acceptedRows || 0))
      formData.append('invalid_rows', '0')
      formData.append('status', resolvedRole === 'broker' ? 'approved' : 'pending')

      if (resolvedRole === 'broker') {
        setProgressState({ stage: 'uploading', message: 'Uploading file to S3...', percent: 10 })

        const response = await fetch(`${apiConfig.apiBaseUrl}/uploads3`, {
          method: 'POST',
          headers: { 
            'x-api-key': apiConfig.apiKey,
            'x-user-id': String(defaultBrokerId)
          },
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || errorData.error || `Submission failed (${response.status})`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let streamBuffer = ''
        let finalSuccessPayload = null

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            streamBuffer += decoder.decode(value, { stream: true })
            const blocks = streamBuffer.split('\n\n')
            streamBuffer = blocks.pop() || ''

            for (const block of blocks) {
              const trimmed = block.trim()
              if (!trimmed.startsWith('data:')) continue
              const jsonText = trimmed.replace(/^data:\s*/, '')
              try {
                const data = JSON.parse(jsonText)
                if (data.stage === 'uploading') {
                  setProgressState({ stage: 'uploading', message: data.message || 'Uploading to S3...', percent: 20 })
                } else if (data.stage === 'uploaded') {
                  setProgressState({ stage: 'uploaded', message: data.message || 'File saved to S3', percent: 35 })
                } else if (data.stage === 'parsing') {
                  setProgressState({ stage: 'parsing', message: data.message || 'Parsing Excel workbook...', percent: 50 })
                } else if (data.stage === 'transforming') {
                  setProgressState({ stage: 'transforming', message: data.message || 'Preparing records...', percent: 65 })
                } else if (data.stage === 'inserting' || data.stage === 'progress') {
                  const total = data.total || validationSummary?.acceptedRows || 1
                  const inserted = data.inserted || 0
                  const calculatedPercent = 65 + Math.round((inserted / total) * 32)
                  setProgressState({
                    stage: 'inserting',
                    message: data.message || `Inserting records into database (${inserted}/${total})...`,
                    percent: Math.min(calculatedPercent, 97),
                    inserted,
                    total,
                  })
                } else if (data.stage === 'complete') {
                  finalSuccessPayload = data
                  setProgressState({
                    stage: 'complete',
                    message: data.message || `Successfully processed and inserted ${data.records_inserted} member records!`,
                    percent: 100,
                    records_inserted: data.records_inserted,
                  })
                } else if (data.stage === 'error') {
                  throw new Error(data.message || 'Database ingestion failed on the server.')
                }
              } catch (err) {
                if (err.message && !err.message.includes('JSON')) {
                  throw err
                }
              }
            }
          }
        }

        const submissionUuid = finalSuccessPayload?.uuid || `SUB-${Date.now()}`
        const finalCount = finalSuccessPayload?.records_inserted ?? validationSummary?.acceptedRows ?? 0

        setSuccessModal({
          uuid: submissionUuid,
          fileName: file.name,
          rowCount: finalCount,
        })

        // Auto-refresh the submissions table in Container 2
        setHistoryRefreshKey((k) => k + 1)
      } else {
        // HR standard fast submission
        const response = await fetch(`${apiConfig.apiBaseUrl}/uploads3`, {
          method: 'POST',
          headers: { 
            'x-api-key': apiConfig.apiKey,
          },
          body: formData,
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.detail || data.error || `Submission failed (${response.status})`)
        }

        const submissionUuid = data.uuid || data.id || `SUB-${Date.now()}`

        setSuccessModal({
          uuid: submissionUuid,
          fileName: file.name,
          rowCount: validationSummary?.acceptedRows || 0,
        })

        setHistoryRefreshKey((k) => k + 1)
      }

      // Revert view to clean default stage
      setFile(null)
      setValidationSummary(null)
      setValidationResult(null)
      setValidationPassed(false)
      setSubmitSuccess(false)
      setSubmissionReceipt(null)
      setMessage('')
      setProgressState(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit file to S3. Please try again.')
      setMessageType('error')
      setProgressState(null)
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page-shell">
      <div className="content-stack">
        {/* Main Card */}
        <section className="upload-card" aria-label="Member upload">
          {/* Header */}
          <div className="upload-card-header">
            <div>
              <h2 className="upload-section-title">Member Data Upload</h2>
              <p className="upload-section-subtitle">
                {resolvedRole === 'broker' 
                  ? 'Upload a revised Excel workbook to submit corrections for the selected HR file.'
                  : 'Upload your completed Excel workbook to run instant validation checks before final submission to broker.'}
              </p>
            </div>
          </div>

          {/* Modern Navigation Tabs (HR Only) */}
          {resolvedRole !== 'broker' && (
            <div className="upload-tabs-container">
              <div className="upload-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'upload'}
                  className={`upload-tab-btn ${activeTab === 'upload' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('upload')}
                >
                  <UploadCloudIcon size={16} />
                  <span>Upload & Validate</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'history'}
                  className={`upload-tab-btn ${activeTab === 'history' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <ClockIcon size={16} />
                  <span>Past Uploads</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 1: Upload & Validate Workflow (Visible to HR in Upload Tab, and always visible to Brokers for fresh uploads) */}
          {(activeTab === 'upload' || resolvedRole === 'broker') && (
            <div className="tab-content-pane">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => selectFile(event.target.files?.[0])}
                className="visually-hidden"
              />

              {/* Dropzone & File Upload Container */}
              <div
                className={`drop-zone ${isDragging ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleDropZoneClick}
                role="region"
                aria-label="File upload area"
              >
                {!file ? (
                  <>
                    <div className="drop-icon-wrapper">
                      <UploadCloudIcon size={32} />
                    </div>
                    <p className="drop-title">
                      Drag and drop your <strong>.xlsx</strong> file here, or{' '}
                      <span className="browse-link">browse files</span>
                    </p>
                    <p className="drop-hint">
                      Supports Microsoft Excel (.xlsx) • Max file size: 5 MB
                    </p>
                  </>
                ) : (
                  <div className="selected-file-content" onClick={(e) => e.stopPropagation()}>
                    <div className="selected-file-main">
                      <ExcelFileIcon size={34} />
                      <div className="selected-file-text">
                        <h4 className="file-name" title={file.name}>{file.name}</h4>
                        <span className="file-meta">
                          {formatBytes(file.size)} • {submitSuccess ? 'Submitted' : validationPassed ? 'Validation Passed • Ready to Submit' : 'Ready for validation'}
                        </span>
                      </div>
                    </div>

                    <div className="selected-file-actions">
                      <button
                        type="button"
                        className="file-change-btn"
                        onClick={() => inputRef.current?.click()}
                        disabled={isValidating || isSubmitting}
                      >
                        Change File
                      </button>
                      <button
                        type="button"
                        className="file-clear-btn"
                        onClick={clearFile}
                        disabled={isValidating || isSubmitting}
                        title="Remove file"
                      >
                        <CloseIcon size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Real-time SSE Progress Bar for Ingestion */}
              {progressState && (
                <div className="sse-progress-card">
                  <div className="sse-progress-header">
                    <div className="sse-progress-title">
                      <span className={`sse-stage-indicator ${progressState.stage === 'complete' ? 'is-complete' : 'is-active'}`} />
                      <span className="sse-stage-text">{progressState.message}</span>
                    </div>
                    <span className="sse-progress-percent">{progressState.percent || 0}%</span>
                  </div>
                  <div className="sse-progress-track">
                    <div 
                      className={`sse-progress-fill ${progressState.stage === 'complete' ? 'is-complete' : ''}`}
                      style={{ width: `${progressState.percent || 0}%` }}
                    />
                  </div>
                  {progressState.total > 0 && (
                    <div className="sse-progress-footer">
                      <span>Inserted {progressState.inserted || 0} of {progressState.total} member records</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Bar */}
              <div className="mup-actions">
                <button
                  type="button"
                  className="template-button"
                  onClick={downloadTemplate}
                  disabled={isDownloading || isSubmitting}
                  title="Download clean template"
                >
                  <DownloadIcon size={15} />
                  <span>{isDownloading ? 'Preparing Template…' : 'Download Template'}</span>
                </button>

                <div className="mup-primary-actions">
                  {validationPassed && !submitSuccess ? (
                    <button
                      type="button"
                      className="submit-button"
                      onClick={submitToS3}
                      disabled={isSubmitting || !file}
                    >
                      <SendIcon size={14} />
                      <span>
                        {isSubmitting
                          ? (progressState?.message || 'Processing…')
                          : (resolvedRole === 'broker' ? 'Submit & Process Members' : 'Submit to Broker')}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="upload-button"
                      onClick={validateFile}
                      disabled={isValidating || isSubmitting || !file || submitSuccess}
                    >
                      {isValidating ? 'Validating…' : submitSuccess ? 'Submitted' : 'Validate File'}
                    </button>
                  )}
                </div>
              </div>

              {/* Status Message Banner */}
              {message && (
                <div
                  className={`message-banner ${messageType === 'success' ? 'is-success' : 'is-error'}`}
                  role="alert"
                >
                  <span className="message-icon">
                    {messageType === 'success' ? (
                      <CheckCircleIcon size={18} />
                    ) : (
                      <AlertTriangleIcon size={18} />
                    )}
                  </span>
                  <span className="message-text">{message}</span>
                </div>
              )}

              {/* Soothing & Snappy Success Modal Dialog */}
              {successModal && (
                <div
                  className="success-modal-overlay"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="success-modal-title"
                  onClick={() => setSuccessModal(null)}
                >
                  <div
                    className="success-modal-card"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="modal-close-icon-btn"
                      onClick={() => setSuccessModal(null)}
                      title="Close"
                    >
                      ×
                    </button>

                    <div className="success-modal-icon">
                      <CheckCircleIcon size={30} />
                    </div>

                    <h3 id="success-modal-title" className="success-modal-title">
                      File Submitted Successfully!
                    </h3>

                    <p className="success-modal-desc">
                      {resolvedRole === 'broker' 
                        ? 'Your fresh spreadsheet has been uploaded to S3 and approved.'
                        : 'Your spreadsheet has been uploaded to S3 and queued for broker review.'}
                    </p>

                    <div className="success-modal-ref-card">
                      <div className="ref-card-meta" style={{ justifyContent: 'center' }}>
                        <span className="meta-pill">📄 {successModal.fileName}</span>
                        <span className="meta-pill">
                          👥 {successModal.rowCount} member{successModal.rowCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    <div className="success-modal-actions">
                      <button
                        type="button"
                        className="modal-btn-secondary"
                        onClick={() => setSuccessModal(null)}
                      >
                        Upload Another File
                      </button>
                      <button
                        type="button"
                        className="modal-btn-primary"
                        onClick={() => {
                          setSuccessModal(null)
                          setActiveTab(resolvedRole === 'broker' ? 'dashboard' : 'history')
                          setBrokerTargetItem(null)
                        }}
                      >
                        <ClockIcon size={14} />
                        <span>{resolvedRole === 'broker' ? 'Back to Dashboard →' : 'View in Past Uploads →'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Past Uploads History (HR only) */}
          {activeTab === 'history' && resolvedRole !== 'broker' && (
            <div className="tab-content-pane">
              <UploadHistory
                corpId={defaultCorpId}
                corporates={corporates}
                role={resolvedRole}
                apiConfig={apiConfig}
                refreshTrigger={successModal?.uuid || submissionReceipt?.uuid}
                onNavigateToUpload={() => setActiveTab('upload')}
              />
            </div>
          )}
        </section>

        {/* CONTAINER 2: Assigned Client Companies (Separate Collapsible Card) */}
        {(activeTab === 'upload' || resolvedRole === 'broker') && corporates && corporates.length > 0 && (
          <CorporatePolicySelector
            role={resolvedRole}
            corporates={corporates}
            defaultCollapsed={true}
          />
        )}

        {/* CONTAINER 3: HR File Submissions (Separate Container) */}
        {resolvedRole === 'broker' && (
          <section className="upload-card submissions-container-card" aria-label="HR File Submissions">
            <BrokerDashboard
              brokerId={defaultBrokerId}
              corporates={corporates}
              apiConfig={apiConfig}
              refreshKey={historyRefreshKey}
              onOpenUploadModal={(item) => {
                setBrokerTargetItem(item)
              }}
              hasValidationErrors={!!validationSummary && validationSummary.rejectedCount > 0}
            />
          </section>
        )}

        {brokerTargetItem && resolvedRole === 'broker' && (
          <BrokerUploadModal
            item={brokerTargetItem}
            brokerId={defaultBrokerId}
            apiConfig={apiConfig}
            onClose={() => setBrokerTargetItem(null)}
            onSuccess={(result) => {
              setBrokerTargetItem(null)
              setSuccessModal({
                uuid: result.uuid,
                fileName: result.fileName,
                rowCount: result.rowCount,
              })
              setHistoryRefreshKey((k) => k + 1)
            }}
          />
        )}

        {/* CONTAINER 3: Interactive Worksheet & Integrated Status (Unified Console) */}
        {(activeTab === 'upload' || resolvedRole === 'broker') && validationResult && (
          <div className="validation-container-wrapper" aria-label="Validation worksheet and metrics">
            <ValidationPreviewBoundary previewKey={file?.name}>
              <ValidationWorksheet
                result={validationResult}
                validationSummary={validationSummary}
                errorsOnly={errorsOnly}
                onErrorsOnlyChange={setErrorsOnly}
                role={resolvedRole}
                isBroker={resolvedRole === 'broker'}
              />
            </ValidationPreviewBoundary>
          </div>
        )}

        {/* Upload Mode Confirmation Modal for Brokers */}
        {uploadModeModal && (
          <div className="success-modal-overlay" role="dialog" aria-modal="true">
            <div className="success-modal-card" style={{ maxWidth: '500px', textAlign: 'left', padding: '26px 28px' }}>
              <button
                type="button"
                className="modal-close-icon-btn"
                onClick={() => setUploadModeModal(null)}
                aria-label="Close dialog"
              >
                ×
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 0 0 4px #f0f7ff'
                }}>
                  <UploadCloudIcon size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                    Confirm Upload Mode
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
                    Are you uploading a new fresh file or revising an HR file?
                  </p>
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px', marginTop: '1px' }}>✨</span>
                  <div>
                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                      Fresh Upload
                    </strong>
                    <span style={{ color: '#64748b', lineHeight: 1.4 }}>
                      Creates a brand new corporate submission and directly enrolls member records.
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px', marginTop: '1px' }}>🔄</span>
                  <div>
                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                      Revise an Existing HR Submission?
                    </strong>
                    <span style={{ color: '#64748b', lineHeight: 1.4 }}>
                      If you are fixing errors for a file submitted by HR, use the <strong>Upload</strong> button on that file's row in the <strong>HR File Submissions</strong> table below to keep the audit history linked.
                    </span>
                  </div>
                </div>
              </div>

              <div className="success-modal-actions" style={{ gap: '10px' }}>
                <button
                  type="button"
                  className="modal-btn-secondary"
                  onClick={handleGoToSubmissions}
                >
                  View Submissions List
                </button>
                <button
                  type="button"
                  className="modal-btn-primary"
                  onClick={handleProceedFreshUpload}
                >
                  Continue with Fresh Upload
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
