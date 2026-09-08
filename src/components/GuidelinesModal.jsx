import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  BookOpenIcon,
  CheckIcon,
  XIcon,
  CloseIcon
} from './Icons.jsx'

export function GuidelinesModal({ isOpen, onClose, currentRole = 'hr' }) {
  const isBroker = currentRole === 'broker'
  const activeTab = isBroker ? 'broker' : 'hr'
  const modalContentRef = useRef(null)

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const hrDos = [
    { cat: 'Official Template', text: 'Download and use the template provided in Member data upload section.' },
    { cat: 'Primary Employee', text: 'Set primary employee relationship as "Insured". Every family must have exactly one Insured record.' },
    { cat: 'Family Linking', text: 'Dependents (Spouse, Child, Parent) must share the exact same Employee ID as their Insured member.' },
    { cat: 'Standard Dates', text: 'Enter dates in YYYY-MM-DD format (e.g. 1993-12-15).' },
    { cat: 'Validation Preview', text: 'Review highlighted cell errors in the interactive preview table before submitting.' },
    { cat: 'Submission Tracking', text: 'Monitor processing status and download historical records from the "Past Uploads" tab.' },
    { cat: 'Revoke File upload', text: 'Use the "Revoke" button to recall mistakenly uploaded files before LawtonAsia locks them.' }
  ]

  const hrDonts = [
    { cat: 'Template Structure', text: 'Do NOT rename, reorder, delete, or add custom column headers in the template.' },
    { cat: 'Dependents', text: 'Do NOT upload dependents without an accompanying Insured employee row sharing the same Employee ID.' },
    { cat: 'Invalid Dates', text: 'Do NOT use text or impossible dates like "31/02/2024" or "12th Jan 90".' },
    { cat: 'Password Protection', text: 'Do NOT upload password-protected, encrypted, or corrupted Excel workbooks.' },
    { cat: 'Trailing Spaces', text: 'Do NOT leave leading or trailing whitespace in Employee ID, Mobile Number, or Email fields.' },
    { cat: 'Duplicate Batches', text: 'Do NOT re-upload identical files while a previous submission is still pending LawtonAsia review.' }
  ]

  const brokerDos = [
    { cat: 'Exclusive Lock', text: 'Click "Download & Lock" on an HR submission to lock exclusive review and editing rights.' },
    { cat: 'Column update', text: 'Fill all the required and mandatory fields, HR filled details will come pre-populated' },
    { cat: 'Prompt Unlock', text: 'Click "Unlock" if you are not proceeding, releasing the lock so team members can claim the file.' },
    { cat: 'Rejection Feedback', text: 'When rejecting a file, select a categorized reason and provide clear comments for HR to fix.' },
    { cat: 'Submit Data', text: 'Ensure all validation checks pass with 0 errors before final database save.' }
  ]

  const brokerDonts = [
    { cat: 'No Unlocked Edits', text: 'Do NOT attempt to upload revised files without first claiming and locking the submission.' },
    { cat: 'System Columns', text: 'Do NOT modify or delete system-generated RowId, Unique ID, or employee linkage columns.' },
    { cat: 'Lock Hoarding', text: 'Do NOT leave files locked indefinitely without active review or communication.' },
    { cat: 'Other LawtonAsia Files', text: 'Do NOT attempt to reject or overwrite files currently claimed and locked by another LawtonAsia team member.' },
    { cat: 'Unresolved Errors', text: 'Do NOT commit batches containing uncorrected validation errors into the live database.' }
  ]

  const currentDos = activeTab === 'hr' ? hrDos : brokerDos
  const currentDonts = activeTab === 'hr' ? hrDonts : brokerDonts

  const modalContent = (
    <div className="guidelines-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="guidelines-modal-window" 
        onClick={(e) => e.stopPropagation()}
        ref={modalContentRef}
        style={{ maxWidth: '900px' }}
      >
        {/* Top Sticky Header */}
        <div className="guidelines-modal-header" style={{ padding: '16px 20px' }}>
          <div className="modal-header-left">
            <div className="modal-title-wrap">
              <div className="modal-title-icon">
                <BookOpenIcon size={18} />
              </div>
              <div>
                <h2 className="modal-title" style={{ fontSize: '16px' }}>Enrollment Guidelines &amp; Rules Documentation</h2>
                <p className="modal-subtitle">
                  Mandatory standards and prohibited actions for bulk enrollment
                </p>
              </div>
            </div>
          </div>

          <div className="modal-header-right">
            {/* Role indicator badge */}
            <div className="modal-role-badge">
              <span className="guide-active-role-pill" style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '6px',
                background: isBroker ? '#e0f2fe' : '#f1f5f9',
                color: isBroker ? '#0369a1' : '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                {isBroker ? '💼 LawtonAsia' : '🏢 HR'}
              </span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              className="modal-close-round-btn"
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close Guide"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="guidelines-modal-body" style={{ padding: '20px' }}>
          
          {/* Do's & Don'ts Minimalist Split Container */}
          <div className="dos-donts-split-container">
            
            {/* DO'S */}
            <div className="rule-card is-do-card">
              <div className="rule-card-header is-do">
                <div className="rule-header-left-wrap">
                  <div className="rule-badge-icon is-do"><CheckIcon size={16} /></div>
                  <div>
                    <h3 className="rule-header-title">DO'S — Recommended &amp; Mandatory Standards</h3>
                    <span className="rule-header-subtitle">Essential requirements for clean, error-free processing</span>
                  </div>
                </div>
              </div>
              <div className="rule-items-grid">
                {currentDos.map((item, idx) => (
                  <div className="rule-row-card is-do" key={idx}>
                    <div className="rule-item-status-icon is-do">
                      <CheckIcon size={13} />
                    </div>
                    <div className="rule-item-body">
                      <div className="rule-item-title">{item.cat}</div>
                      <p className="rule-item-desc">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DON'TS */}
            <div className="rule-card is-dont-card">
              <div className="rule-card-header is-dont">
                <div className="rule-header-left-wrap">
                  <div className="rule-badge-icon is-dont"><XIcon size={16} /></div>
                  <div>
                    <h3 className="rule-header-title">DON'TS — Prohibitions &amp; Common Pitfalls</h3>
                    <span className="rule-header-subtitle">Actions that cause validation failures or data rejections</span>
                  </div>
                </div>
              </div>
              <div className="rule-items-grid">
                {currentDonts.map((item, idx) => (
                  <div className="rule-row-card is-dont" key={idx}>
                    <div className="rule-item-status-icon is-dont">
                      <XIcon size={13} />
                    </div>
                    <div className="rule-item-body">
                      <div className="rule-item-title">{item.cat}</div>
                      <p className="rule-item-desc">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Sticky Footer */}
        <div className="guidelines-modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="modal-primary-close-btn" onClick={onClose} style={{ padding: '6px 16px', fontSize: '13px' }}>
            Close Documentation
          </button>
        </div>

      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return modalContent
}
