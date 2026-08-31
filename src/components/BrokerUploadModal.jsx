import { useRef, useState } from 'react'
import {
  CloseIcon,
  UploadCloudIcon,
  ExcelFileIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  SendIcon,
} from './Icons.jsx'
import { ValidationPreviewBoundary, ValidationWorksheet } from './MemberUpload.jsx'

const MAX_FILE_SIZE = 5 * 1024 * 1024

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function BrokerUploadModal({
  item,
  brokerId,
  apiConfig,
  userEmail = '',
  userName = '',
  onClose,
  onSuccess
}) {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const [validationSummary, setValidationSummary] = useState(null)
  const [validationResult, setValidationResult] = useState(null)
  const [validationPassed, setValidationPassed] = useState(false)
  const [allowBrokerForceIngest, setAllowBrokerForceIngest] = useState(false)
  const [showForceConfirmModal, setShowForceConfirmModal] = useState(false)
  const [errorsOnly, setErrorsOnly] = useState(true)

  const [progressState, setProgressState] = useState(null) // { stage, message, percent, inserted, total }

  const [isFullscreen, setIsFullscreen] = useState(false)

  const inputRef = useRef(null)

  const selectFile = (selectedFile) => {
    if (!selectedFile) return
    if (selectedFile.size > MAX_FILE_SIZE) {
      setMessage('File is too large. Maximum allowed size is 5 MB.')
      setMessageType('error')
      return
    }
    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    if (!isExcel) {
      setMessage('Invalid file type. Please upload a valid .xlsx spreadsheet.')
      setMessageType('error')
      return
    }
    setFile(selectedFile)
    setValidationPassed(false)
    setValidationSummary(null)
    setValidationResult(null)
    setMessage('')
    setProgressState(null)
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
    setMessage('')
    setProgressState(null)
    if (inputRef.current) inputRef.current.value = ''
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
      formData.append('role', 'broker')
      formData.append('isBroker', 'true')
      formData.append('corp_id', String(item.corpId))
      formData.append('broker_id', String(brokerId))
      formData.append('file_uuid', String(item.uuid))
      formData.append('uuid', String(item.uuid))
      formData.append('sub_corporates', JSON.stringify([]))
      formData.append('sub_corporate_names', JSON.stringify([]))
      formData.append('sub_corporate_ids', JSON.stringify([]))

      const response = await fetch(`${apiConfig.apiBaseUrl}/broker/upload/validate`, {
        method: 'POST',
        headers: { 
          'x-api-key': apiConfig.apiKey,
          'x-user-id': String(brokerId),
        },
        body: formData,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.detail || data.error || `Validation failed (${response.status})`)
      }

      const forceAllowed = data.allowBrokerForceIngest !== false && data.allow_broker_force_ingest !== false
      setAllowBrokerForceIngest(forceAllowed)

      const acceptedRows = Array.isArray(data.acceptedRows) ? data.acceptedRows : []
      const rejectedRows = Array.isArray(data.rejectedRows) ? data.rejectedRows : []
      const totalRows = (data.summary?.totalRows ?? data.totalRows ?? (acceptedRows.length + rejectedRows.length)) || 0
      const acceptedCount = (data.summary?.acceptedRows ?? data.acceptedCount ?? acceptedRows.length) || 0
      const rejectedCount = (data.summary?.rejectedRows ?? data.rejectedCount ?? rejectedRows.length) || 0

      setValidationSummary({ totalRows, acceptedRows: acceptedCount, rejectedCount })
      setValidationResult(data)

      const isClean = rejectedCount === 0 && acceptedCount > 0
      setValidationPassed(isClean)

      // If no errors are found on validation then by default show the correct rows, and toggle the error rows switch off
      if (rejectedCount === 0) {
        setErrorsOnly(false)
      } else {
        setErrorsOnly(true)
      }

      if (isClean) {
        setMessage('All records validated successfully. You can now submit this revised file.')
        setMessageType('success')
      } else {
        setMessage(`Found issues in ${rejectedCount} row(s). Please review and correct them.`)
        setMessageType('error')
      }

      // Log validation preview subtransaction
      try {
        fetch(`${apiConfig.apiBaseUrl}/uploads3/audit/log-subtransaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiConfig.apiKey,
          },
          body: JSON.stringify({
            file_uuid: item.uuid,
            action_code: isClean ? 'VALIDATION_PASSED' : 'VALIDATION_FAILED',
            action_title: isClean ? 'Validation Preview Passed (Clean)' : `Validation Preview (${rejectedCount} errors)`,
            user_id: brokerId,
            role: 'broker',
            is_cancelled: false,
            bypassed_errors_count: rejectedCount,
            worksheet_snapshot: {
              totalRows,
              acceptedRows: acceptedCount,
              rejectedRows: rejectedCount,
              headers: (acceptedRows[0]?.values || rejectedRows[0]?.values) ? Object.keys(acceptedRows[0]?.values || rejectedRows[0]?.values) : [],
              rows: [
                ...acceptedRows.map((r) => ({
                  row: r.row,
                  sourceRow: r.sourceRow,
                  valid: true,
                  values: r.values,
                  errors: [],
                })),
                ...rejectedRows.map((r) => ({
                  row: r.row,
                  sourceRow: r.sourceRow,
                  valid: false,
                  values: r.values,
                  errors: (r.fields || [])
                    .filter((f) => !f.valid)
                    .map((f) => ({
                      field: f.fieldName || f.colMapping,
                      message: (f.remarks || []).join('; '),
                    })),
                })),
              ].sort((a, b) => (a.sourceRow || a.row) - (b.sourceRow || b.row)),
            }
          })
        }).catch(() => {})
      } catch (_) {}
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to validate the file.')
      setMessageType('error')
      setValidationPassed(false)
      setValidationSummary(null)
      setValidationResult(null)
    } finally {
      setIsValidating(false)
    }
  }

  const submitToS3 = async (isForce = false) => {
    if (!file) return
    if (!validationPassed && !isForce) return
    setIsSubmitting(true)
    setMessage('')
    setShowForceConfirmModal(false)
    setProgressState({ stage: 'uploading', message: 'Uploading revised file...', percent: 10 })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('role', 'broker')
      formData.append('provider_corp_id', String(item.corpId))
      formData.append('corp_id', String(item.corpId))
      formData.append('template_type', 'broker')
      formData.append('no_of_rows', String(validationSummary?.totalRows || 0))
      formData.append('valid_rows', String(validationSummary?.acceptedRows || 0))
      formData.append('invalid_rows', String(isForce ? (validationSummary?.rejectedCount || 0) : 0))
      formData.append('status', 'approved')
      if (isForce) {
        formData.append('force_ingest', 'true')
      }

      // Package and forward complete row-by-row snapshot with error remarks
      if (validationResult) {
        const allRows = [
          ...(validationResult?.acceptedRows || []).map((r) => ({
            row: r.row,
            sourceRow: r.sourceRow,
            valid: true,
            values: r.values,
            errors: [],
          })),
          ...(validationResult?.rejectedRows || []).map((r) => ({
            row: r.row,
            sourceRow: r.sourceRow,
            valid: false,
            values: r.values,
            errors: (r.fields || [])
              .filter((f) => !f.valid)
              .map((f) => ({
                field: f.fieldName || f.colMapping,
                message: (f.remarks || []).join('; '),
              })),
          })),
        ].sort((a, b) => (a.sourceRow || a.row) - (b.sourceRow || b.row))

        const worksheetSnapshot = {
          totalRows: validationSummary?.totalRows || allRows.length,
          acceptedRows: validationSummary?.acceptedRows || 0,
          rejectedRows: isForce ? (validationSummary?.rejectedCount || 0) : (validationSummary?.rejectedCount || 0),
          headers: allRows[0]?.values && typeof allRows[0].values === 'object' ? Object.keys(allRows[0].values) : [],
          rows: allRows,
        }
        formData.append('worksheet_snapshot', JSON.stringify(worksheetSnapshot))
      }

      if (userName) {
        formData.append('uploaded_by_name', userName)
      }
      if (userEmail) {
        formData.append('uploaded_by_email', userEmail)
        formData.append('uploaded_by', userEmail)
      }

      const response = await fetch(`${apiConfig.apiBaseUrl}/uploads3/broker-upload/${item.uuid}`, {
        method: 'POST',
        headers: { 
          'x-api-key': apiConfig.apiKey,
          'x-user-id': String(brokerId),
          ...(userName ? { 'x-user-name': userName } : {}),
          ...(userEmail ? { 'x-user-email': userEmail } : {}),
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || errorData.error || `Submission failed (${response.status})`)
      }

      // Read SSE stream
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
                setProgressState({ stage: 'uploading', message: 'Uploading file...', percent: 20 })
              } else if (data.stage === 'uploaded') {
                setProgressState({ stage: 'uploaded', message: 'File uploaded successfully', percent: 35 })
              } else if (data.stage === 'parsing') {
                setProgressState({ stage: 'parsing', message: 'Parsing Excel workbook...', percent: 50 })
              } else if (data.stage === 'transforming') {
                setProgressState({ stage: 'transforming', message: 'Preparing records...', percent: 65 })
              } else if (data.stage === 'inserting' || data.stage === 'progress') {
                const total = data.total || validationSummary?.totalRows || 1
                const inserted = data.inserted || 0
                const calculatedPercent = 65 + Math.round((inserted / total) * 32)
                setProgressState({
                  stage: 'inserting',
                  message: `Processing member records (${inserted}/${total})...`,
                  percent: Math.min(calculatedPercent, 97),
                  inserted,
                  total,
                })
              } else if (data.stage === 'complete') {
                finalSuccessPayload = data
                setProgressState({
                  stage: 'complete',
                  message: `Successfully processed ${data.records_inserted} member records!`,
                  percent: 100,
                  records_inserted: data.records_inserted,
                })
              } else if (data.stage === 'error') {
                throw new Error(data.message || 'File processing failed on the server.')
              }
            } catch (err) {
              if (err.message && !err.message.includes('JSON')) {
                throw err
              }
            }
          }
        }
      }

      const finalCount = finalSuccessPayload?.records_inserted ?? validationSummary?.totalRows ?? 0
      setMessage(`Successfully inserted ${finalCount} member records into database!`)
      setMessageType('success')

      setTimeout(() => {
        onSuccess({
          uuid: item.uuid,
          fileName: file.name,
          rowCount: finalCount,
          wasForceIngested: isForce,
          bypassedErrors: isForce ? (validationSummary?.rejectedCount || 0) : 0,
        })
      }, 1000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit file.')
      setMessageType('error')
      setProgressState(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModalClose = () => {
    if (validationResult && !isSubmitting) {
      try {
        const acceptedRows = Array.isArray(validationResult.acceptedRows) ? validationResult.acceptedRows : []
        const rejectedRows = Array.isArray(validationResult.rejectedRows) ? validationResult.rejectedRows : []
        const allRows = [
          ...acceptedRows.map((r) => ({
            row: r.row,
            sourceRow: r.sourceRow,
            valid: true,
            values: r.values,
            errors: [],
          })),
          ...rejectedRows.map((r) => ({
            row: r.row,
            sourceRow: r.sourceRow,
            valid: false,
            values: r.values,
            errors: (r.fields || [])
              .filter((f) => !f.valid)
              .map((f) => ({
                field: f.fieldName || f.colMapping,
                message: (f.remarks || []).join('; '),
              })),
          })),
        ].sort((a, b) => (a.sourceRow || a.row) - (b.sourceRow || b.row))

        fetch(`${apiConfig.apiBaseUrl}/uploads3/audit/log-subtransaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiConfig.apiKey,
          },
          body: JSON.stringify({
            file_uuid: item.uuid,
            action_code: 'SESSION_CANCELLED',
            action_title: 'Broker Cancelled Revision Session',
            user_id: brokerId,
            role: 'broker',
            is_cancelled: true,
            cancellation_reason: 'User closed revision modal after validation preview',
            worksheet_snapshot: {
              totalRows: validationSummary?.totalRows || allRows.length,
              acceptedRows: validationSummary?.acceptedRows || 0,
              rejectedRows: validationSummary?.rejectedCount || 0,
              headers: (acceptedRows[0]?.values || rejectedRows[0]?.values) ? Object.keys(acceptedRows[0]?.values || rejectedRows[0]?.values) : [],
              rows: allRows,
            },
          }),
        }).catch(() => {})
      } catch (_) {}
    }
    onClose()
  }

  return (
    <div className="success-modal-overlay" role="dialog" aria-modal="true" style={{ alignItems: isFullscreen ? 'stretch' : 'center', padding: isFullscreen ? '20px' : '20px' }}>
      <div 
        className="success-modal-card" 
        style={{ 
          maxWidth: isFullscreen ? '100%' : '800px', 
          width: '100%', 
          height: isFullscreen ? '100%' : 'auto',
          maxHeight: isFullscreen ? '100%' : '90vh',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'left', 
          padding: '24px' 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#0f172a' }}>Upload Revised File</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              For: <span style={{ fontWeight: 500, color: '#334155' }}>{item.fileName}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              onClick={() => setIsFullscreen(!isFullscreen)} 
              className="modal-btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
            <button 
              type="button" 
              className="modal-close-icon-btn" 
              onClick={handleModalClose} 
              style={{ position: 'relative', top: 'auto', right: 'auto' }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => selectFile(event.target.files?.[0])}
            className="visually-hidden"
          />

          <div
            className={`drop-zone ${isDragging ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={(e) => { if (e.target.closest('button')) return; inputRef.current?.click() }}
          >
            {!file ? (
              <>
                <div className="drop-icon-wrapper"><UploadCloudIcon size={32} /></div>
                <p className="drop-title">Drag and drop your revised <strong>.xlsx</strong> file here, or <span className="browse-link">browse files</span></p>
              </>
            ) : (
              <div className="selected-file-content" onClick={(e) => e.stopPropagation()}>
                <div className="selected-file-main">
                  <ExcelFileIcon size={34} />
                  <div className="selected-file-text">
                    <h4 className="file-name" title={file.name}>{file.name}</h4>
                    <span className="file-meta">
                      {formatBytes(file.size)} • {validationPassed ? 'Validation Passed' : 'Ready for validation'}
                    </span>
                  </div>
                </div>
                <div className="selected-file-actions">
                  <button type="button" className="file-change-btn" onClick={() => inputRef.current?.click()} disabled={isValidating || isSubmitting}>Change File</button>
                  <button type="button" className="file-clear-btn" onClick={clearFile} disabled={isValidating || isSubmitting}><CloseIcon size={14} /></button>
                </div>
              </div>
            )}
          </div>

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

          <div className="mup-actions" style={{ marginTop: 0, position: 'static', display: 'flex', gap: '10px' }}>
            {validationPassed ? (
              <button 
                type="button" 
                className="submit-button" 
                onClick={() => submitToS3(false)} 
                disabled={isSubmitting || !file} 
                style={{ marginLeft: 'auto', position: 'static' }}
              >
                <SendIcon size={14} />
                <span>{isSubmitting ? (progressState?.message || 'Processing...') : 'Submit Revision'}</span>
              </button>
            ) : (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                {validationResult && !validationPassed && allowBrokerForceIngest && (
                  <button
                    type="button"
                    className="force-upload-btn"
                    onClick={() => setShowForceConfirmModal(true)}
                    disabled={isValidating || isSubmitting || !file}
                    title="Force upload and ingest member records into database despite validation errors"
                  >
                    <AlertTriangleIcon size={14} />
                    <span>Upload Anyway (Contains Errors)</span>
                  </button>
                )}
                <button 
                  type="button" 
                  className="upload-button" 
                  onClick={validateFile} 
                  disabled={isValidating || isSubmitting || !file} 
                  style={{ position: 'static' }}
                >
                  {isValidating ? 'Validating...' : 'Validate File'}
                </button>
              </div>
            )}
          </div>

          {/* Force Ingestion Confirmation Dialog within Broker Modal */}
          {showForceConfirmModal && (
            <div
              className="success-modal-overlay"
              role="dialog"
              aria-modal="true"
              style={{ zIndex: 100000 }}
              onClick={() => setShowForceConfirmModal(false)}
            >
              <div
                className="success-modal-card force-modal-card"
                style={{ maxWidth: '520px', textAlign: 'left', padding: '26px 28px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="modal-close-icon-btn"
                  onClick={() => setShowForceConfirmModal(false)}
                  title="Close"
                >
                  ×
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: '#fef3c7',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 0 0 4px #fffbeb'
                  }}>
                    <AlertTriangleIcon size={26} />
                  </div>
                  <div>
                    <h3 className="success-modal-title" style={{ margin: 0, fontSize: '18px', color: '#92400e' }}>
                      Upload Revision With Validation Errors?
                    </h3>
                    <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#78350f' }}>
                      Bypass validation and force-ingest revised rows directly into the database.
                    </p>
                  </div>
                </div>

                <div className="force-modal-stats-grid">
                  <div className="force-stat-box">
                    <span className="force-stat-label">Total Rows</span>
                    <span className="force-stat-value">{validationSummary?.totalRows || 0}</span>
                  </div>
                  <div className="force-stat-box is-valid">
                    <span className="force-stat-label">Clean Rows</span>
                    <span className="force-stat-value">{validationSummary?.acceptedRows || 0}</span>
                  </div>
                  <div className="force-stat-box is-faulty">
                    <span className="force-stat-label">Faulty Rows</span>
                    <span className="force-stat-value">{validationSummary?.rejectedCount || 0}</span>
                  </div>
                </div>

                <div className="force-modal-notice-box">
                  <AlertTriangleIcon size={16} />
                  <span>
                    <strong>Important:</strong> 100% of revised rows will be processed and enrolled. Unparseable dates and malformed values will be converted to safe fallbacks and tagged in the audit trail.
                  </span>
                </div>

                <div className="success-modal-actions" style={{ marginTop: '22px' }}>
                  <button
                    type="button"
                    className="modal-btn-secondary"
                    onClick={() => setShowForceConfirmModal(false)}
                  >
                    Cancel & Fix Sheet
                  </button>
                  <button
                    type="button"
                    className="modal-btn-primary force-confirm-btn"
                    onClick={() => submitToS3(true)}
                    disabled={isSubmitting}
                  >
                    <SendIcon size={14} />
                    <span>{isSubmitting ? 'Force Ingesting…' : 'Confirm & Upload Anyway'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className={`message-banner ${messageType === 'success' ? 'is-success' : 'is-error'}`}>
              <span className="message-icon">{messageType === 'success' ? <CheckCircleIcon size={18} /> : <AlertTriangleIcon size={18} />}</span>
              <span className="message-text">{message}</span>
            </div>
          )}

          {validationSummary && validationResult && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
               <ValidationPreviewBoundary previewKey={file?.name}>
                <ValidationWorksheet
                  result={validationResult}
                  errorsOnly={errorsOnly}
                  onErrorsOnlyChange={setErrorsOnly}
                  validationSummary={validationSummary}
                  role="broker"
                  isBroker={true}
                />
              </ValidationPreviewBoundary>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
