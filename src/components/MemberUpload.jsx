import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { getApiConfig } from './apiConfig.js'
import { CorporatePolicySelector } from './CorporatePolicySelector.jsx'
import { UploadHistory } from './UploadHistory.jsx'
import {
  DownloadIcon,
  ExcelFileIcon,
  UploadCloudIcon,
  CloseIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  SendIcon,
  ClockIcon,
} from './Icons.jsx'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const apiConfig = getApiConfig()

const asErrorText = (remark) => {
  if (typeof remark === 'string') return remark
  if (remark && typeof remark === 'object') return remark.message || remark.reason || remark.error || JSON.stringify(remark)
  return String(remark)
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

class ValidationPreviewBoundary extends Component {
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

function ValidationWorksheet({ result, errorsOnly, onErrorsOnlyChange }) {
  const [visibleRowCount, setVisibleRowCount] = useState(75)
  const { rows, errorRows, columns } = useMemo(() => {
    const acceptedRows = Array.isArray(result?.acceptedRows) ? result.acceptedRows : []
    const rejectedRows = Array.isArray(result?.rejectedRows) ? result.rejectedRows : []
    const allRows = [...acceptedRows, ...rejectedRows]
      .filter((row) => row && typeof row === 'object')
      .sort((first, second) => (first.sourceRow || first.row || 0) - (second.sourceRow || second.row || 0))
    const invalidRows = allRows.filter((row) => row.valid === false)
    const headers = [...new Set(allRows.flatMap((row) => Object.keys(row.values || {})))]

    return { rows: allRows, errorRows: invalidRows, columns: headers }
  }, [result])

  const filteredRows = errorsOnly ? errorRows : rows
  const displayedRows = filteredRows.slice(0, visibleRowCount)

  const getIssue = (row, column) => {
    const fields = Array.isArray(row.fields) ? row.fields : []
    const normalizedColumn = String(column).trim().toLowerCase()
    const field = fields.find((item) => String(item?.fieldName || '').trim().toLowerCase() === normalizedColumn)
    const remarks = Array.isArray(field?.remarks) ? field.remarks.map(asErrorText).filter(Boolean) : []
    return field && (field.valid === false || remarks.length > 0)
      ? remarks.join(' · ') || 'Invalid value'
      : ''
  }

  return (
    <section className="validation-panel" aria-label="Validation results">
      <div className="validation-panel-header">
        <div>
          <h2>Interactive Worksheet Preview</h2>
          <p>
            {rows.length} rows checked &nbsp;•&nbsp;{' '}
            <span style={{ color: errorRows.length > 0 ? '#e11d48' : '#059669', fontWeight: 600 }}>
              {errorRows.length} {errorRows.length === 1 ? 'row' : 'rows'} with errors
            </span>{' '}
            &nbsp;•&nbsp; Showing {displayedRows.length} rows
          </p>
        </div>
        <label className="error-filter">
          <input
            type="checkbox"
            checked={errorsOnly}
            onChange={(event) => onErrorsOnlyChange(event.target.checked)}
          />
          Show rows with errors only
        </label>
      </div>

      <div className="worksheet-scroll">
        <table className="worksheet">
          <thead>
            <tr>
              <th className="row-number-header">Row</th>
              {columns.map((column) => (
                <th key={column}>{column}</th>
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
                  const issue = getIssue(row, column)
                  return (
                    <td key={column} className={issue ? 'cell-error' : ''} title={issue || undefined}>
                      <span>{row.values?.[column] ?? ''}</span>
                      {issue && <small>{issue}</small>}
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
  const [activeTab, setActiveTab] = useState('upload')

  const inputRef = useRef(null)

  // Listen for Escape key to close success modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && successModal) {
        setSuccessModal(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [successModal])

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

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    const droppedFile = event.dataTransfer.files?.[0]
    selectFile(droppedFile)
  }

  const clearFile = () => {
    setFile(null)
    setValidationPassed(false)
    setValidationSummary(null)
    setValidationResult(null)
    setSubmitSuccess(false)
    setSubmissionReceipt(null)
    setMessage('')
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
          ? 'partner-template.xlsx'
          : 'corporate-template.xlsx'

      const filename = rawHeaderFilename || defaultRoleFilename

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      setMessage('Unable to download the template. Please try again.')
      setMessageType('error')
      console.error(error)
    } finally {
      setIsDownloading(false)
    }
  }

  const validateFile = async () => {
    if (!file) {
      setMessage('Please select a file to validate.')
      setMessageType('error')
      return
    }

    setIsValidating(true)
    setMessage('')
    setSubmitSuccess(false)
    setSubmissionReceipt(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('isRetailPolicy', 'false')
      formData.append('role', resolvedRole)
      formData.append('isBroker', resolvedRole === 'broker' ? 'true' : 'false')
      formData.append('provider_corp_id', defaultProviderCorpId)
      formData.append('corp_id', defaultCorpId)

      const subCorps = Array.isArray(corporates) ? corporates : []
      formData.append('sub_corporates', JSON.stringify(subCorps))
      formData.append('sub_corporate_names', JSON.stringify(subCorps.map((c) => c.name)))
      formData.append('sub_corporate_ids', JSON.stringify(subCorps.map((c) => c.id)))

      if (resolvedRole === 'broker') {
        formData.append('broker_id', defaultBrokerId)
      }

      const response = await fetch(`${apiConfig.apiBaseUrl}/validate/preview`, {
        method: 'POST',
        headers: { 'x-api-key': apiConfig.apiKey },
        body: formData,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.detail || data.error || `Validation failed (${response.status})`)
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
        setMessage('All records validated successfully. You can now submit this file to the broker.')
        setMessageType('success')
      } else {
        setMessage(`Found issues in ${rejectedCount} row${rejectedCount === 1 ? '' : 's'}. Review the preview below, correct your spreadsheet, and re-upload.`)
        setMessageType('error')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to validate the file. Please verify format and try again.')
      setMessageType('error')
      setValidationPassed(false)
      setValidationSummary(null)
      setValidationResult(null)
      console.error(error)
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
      const formData = new FormData()
      formData.append('file', file)
      formData.append('role', resolvedRole)
      formData.append('provider_corp_id', defaultProviderCorpId)
      formData.append('corp_id', defaultCorpId)
      formData.append('sub_corporates', JSON.stringify(corporates))
      formData.append('template_type', resolvedRole === 'broker' ? 'broker' : 'hr')
      formData.append('no_of_rows', String(validationSummary?.totalRows || 0))
      formData.append('valid_rows', String(validationSummary?.acceptedRows || 0))
      formData.append('invalid_rows', '0')
      formData.append('status', 'pending')

      const response = await fetch(`${apiConfig.apiBaseUrl}/uploads3`, {
        method: 'POST',
        headers: { 'x-api-key': apiConfig.apiKey },
        body: formData,
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.detail || data.error || `Submission failed (${response.status})`)
      }

      const submissionUuid = data.uuid || data.id || `SUB-${Date.now()}`

      // Trigger soothing success modal
      setSuccessModal({
        uuid: submissionUuid,
        fileName: file.name,
        rowCount: validationSummary?.acceptedRows || 0,
      })

      // Revert view to clean default stage
      setFile(null)
      setValidationSummary(null)
      setValidationResult(null)
      setValidationPassed(false)
      setSubmitSuccess(false)
      setSubmissionReceipt(null)
      setMessage('')
      if (inputRef.current) inputRef.current.value = ''
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit file to S3. Please try again.')
      setMessageType('error')
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
                Upload your completed Excel workbook to run instant validation checks before final submission to broker.
              </p>
            </div>
          </div>

          <CorporatePolicySelector
            role={resolvedRole}
            corporates={corporates}
          />

          {/* Modern Navigation Tabs */}
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

          {/* Tab 1: Upload & Validate Workflow */}
          {activeTab === 'upload' && (
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
                onClick={(e) => {
                  if (e.target.closest('button')) return
                  inputRef.current?.click()
                }}
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
                          {formatBytes(file.size)} • {submitSuccess ? 'Submitted to Broker' : validationPassed ? 'Validation Passed • Ready to Submit' : 'Ready for validation'}
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

              {/* Action Bar */}
              <div className="actions">
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

                <div className="primary-actions">
                  {validationPassed && !submitSuccess ? (
                    <button
                      type="button"
                      className="submit-button"
                      onClick={submitToS3}
                      disabled={isSubmitting || !file}
                    >
                      <SendIcon size={14} />
                      <span>{isSubmitting ? 'Submitting to S3…' : 'Submit to Broker'}</span>
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
                      Your spreadsheet has been uploaded to S3 and queued for broker review.
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
                          setActiveTab('history')
                        }}
                      >
                        <ClockIcon size={14} />
                        <span>View in Past Uploads →</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Past Uploads History */}
          {activeTab === 'history' && (
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

        {/* Validation Summary & Interactive Worksheet Preview (Only in upload tab) */}
        {activeTab === 'upload' && validationSummary && (
          <section className="summary-section" aria-label="Validation summary">
            {/* Modern Stats Bar */}
            <div className="stats-bar">
              <div className="stat-item">
                <span className="stat-label">TOTAL ROWS CHECKED</span>
                <span className="stat-value">{validationSummary.totalRows}</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-label">ACCEPTED ROWS</span>
                <span className="stat-value is-accepted">{validationSummary.acceptedRows}</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-label">ROWS WITH ERRORS</span>
                <span className={`stat-value ${validationSummary.rejectedCount > 0 ? 'is-rejected' : 'is-zero'}`}>
                  {validationSummary.rejectedCount}
                </span>
              </div>
            </div>

            {/* Validation Worksheet */}
            {validationResult && (
              <ValidationPreviewBoundary previewKey={file?.name}>
                <ValidationWorksheet
                  result={validationResult}
                  errorsOnly={errorsOnly}
                  onErrorsOnlyChange={setErrorsOnly}
                />
              </ValidationPreviewBoundary>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
