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

      const response = await fetch(`${apiConfig.apiBaseUrl}/validate/preview`, {
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

      const acceptedRows = Array.isArray(data.acceptedRows) ? data.acceptedRows : []
      const rejectedRows = Array.isArray(data.rejectedRows) ? data.rejectedRows : []
      const totalRows = (data.totalRows != null ? data.totalRows : acceptedRows.length + rejectedRows.length) || 0
      const acceptedCount = (data.acceptedCount != null ? data.acceptedCount : acceptedRows.length) || 0
      const rejectedCount = (data.rejectedCount != null ? data.rejectedCount : rejectedRows.length) || 0

      setValidationSummary({ totalRows, acceptedRows: acceptedCount, rejectedCount })
      setValidationResult(data)

      const isClean = rejectedCount === 0 && acceptedCount > 0
      setValidationPassed(isClean)

      if (isClean) {
        setMessage('All records validated successfully. You can now submit this revised file.')
        setMessageType('success')
      } else {
        setMessage(`Found issues in ${rejectedCount} row(s). Please review and correct them.`)
        setMessageType('error')
      }
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

  const submitToS3 = async () => {
    if (!file || !validationPassed) return
    setIsSubmitting(true)
    setMessage('')
    setProgressState({ stage: 'uploading', message: 'Uploading revised file to S3...', percent: 10 })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('role', 'broker')
      formData.append('provider_corp_id', String(item.corpId))
      formData.append('corp_id', String(item.corpId))
      formData.append('template_type', 'broker')
      formData.append('no_of_rows', String(validationSummary?.totalRows || 0))
      formData.append('valid_rows', String(validationSummary?.acceptedRows || 0))
      formData.append('invalid_rows', '0')
      formData.append('status', 'approved')

      const response = await fetch(`${apiConfig.apiBaseUrl}/uploads3/broker-upload/${item.uuid}`, {
        method: 'POST',
        headers: { 
          'x-api-key': apiConfig.apiKey,
          'x-user-id': String(brokerId)
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

      const finalCount = finalSuccessPayload?.records_inserted ?? validationSummary?.acceptedRows ?? 0
      setMessage(`Successfully inserted ${finalCount} member records into database!`)
      setMessageType('success')

      setTimeout(() => {
        onSuccess({ uuid: item.uuid, fileName: file.name, rowCount: finalCount })
      }, 1000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit file.')
      setMessageType('error')
      setProgressState(null)
    } finally {
      setIsSubmitting(false)
    }
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
              onClick={onClose} 
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

          <div className="mup-actions" style={{ marginTop: 0, position: 'static', display: 'flex' }}>
            {validationPassed ? (
              <button 
                type="button" 
                className="submit-button" 
                onClick={submitToS3} 
                disabled={isSubmitting || !file} 
                style={{ marginLeft: 'auto', position: 'static' }}
              >
                <SendIcon size={14} />
                <span>{isSubmitting ? (progressState?.message || 'Processing...') : 'Submit Revision'}</span>
              </button>
            ) : (
              <button 
                type="button" 
                className="upload-button" 
                onClick={validateFile} 
                disabled={isValidating || isSubmitting || !file} 
                style={{ marginLeft: 'auto', position: 'static' }}
              >
                {isValidating ? 'Validating...' : 'Validate File'}
              </button>
            )}
          </div>

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
                />
              </ValidationPreviewBoundary>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
