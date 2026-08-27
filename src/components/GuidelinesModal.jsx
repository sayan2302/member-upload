import { useState, useEffect, useRef } from 'react'
import {
  BookOpenIcon,
  CheckIcon,
  XIcon,
  CloseIcon,
  LightbulbIcon
} from './Icons.jsx'

export function GuidelinesModal({ isOpen, onClose, currentRole = 'hr' }) {
  const [activeTab, setActiveTab] = useState(currentRole === 'broker' ? 'broker' : 'hr')
  const modalContentRef = useRef(null)

  // Sync role tab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(currentRole === 'broker' ? 'broker' : 'hr')
    }
  }, [isOpen, currentRole])

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
    { cat: 'Official Template', text: 'Download and use the official 33-column Mayfair Excel template (.xlsx or .xls).' },
    { cat: 'Primary Employee', text: 'Set primary employee relationship as "Self". Every family must have exactly one Self record.' },
    { cat: 'Family Linking', text: 'Dependents (Spouse, Child, Parent) must share the exact same Employee ID as their primary employee.' },
    { cat: 'Standard Dates', text: 'Enter dates in DD/MM/YYYY or YYYY-MM-DD standard format (e.g. 15/08/1990).' },
    { cat: 'Sum Insured', text: 'Enter numeric Sum Insured matching approved corporate policy tiers (e.g. 500000 without commas or currency symbols).' },
    { cat: 'Validation Preview', text: 'Review highlighted cell errors in the interactive preview table before submitting.' },
    { cat: 'Submission Tracking', text: 'Monitor processing status and download historical records from the "Past Uploads" tab.' },
    { cat: 'Revoke Mistaken Uploads', text: 'Use the "Revoke" button to recall mistakenly uploaded files before a broker locks them.' }
  ]

  const hrDonts = [
    { cat: 'Template Structure', text: 'Do NOT rename, reorder, delete, or add custom column headers in the template.' },
    { cat: 'Orphan Dependents', text: 'Do NOT upload orphan dependents without an accompanying Self employee row sharing the same Employee ID.' },
    { cat: 'Invalid Dates', text: 'Do NOT use text or impossible dates like "31/02/2024" or "12th Jan 90".' },
    { cat: 'Password Protection', text: 'Do NOT upload password-protected, encrypted, or corrupted Excel workbooks.' },
    { cat: 'Trailing Spaces', text: 'Do NOT leave leading or trailing whitespace in Employee ID, Mobile Number, or Email fields.' },
    { cat: 'Duplicate Batches', text: 'Do NOT re-upload identical files while a previous submission is still pending broker review.' }
  ]

  const brokerDos = [
    { cat: 'Exclusive Lock', text: 'Click "Download & Lock" on an HR submission to lock exclusive review and editing rights.' },
    { cat: '61-Column Schema', text: 'Use the expanded 61-column broker template containing all 28 underwriting and TPA fields.' },
    { cat: 'Prompt Unlock', text: 'Click "Unlock" if you are not proceeding, releasing the lock so team members can claim the file.' },
    { cat: 'Rejection Feedback', text: 'When rejecting a file, select a categorized reason and provide clear comments for HR to fix.' },
    { cat: 'Policy Verification', text: 'Verify insurer policy numbers, TPA codes, and endorsement IDs before committing to the database.' },
    { cat: 'Clean Database Commit', text: 'Ensure all validation checks pass with 0 errors before final database save.' }
  ]

  const brokerDonts = [
    { cat: 'No Unlocked Edits', text: 'Do NOT attempt to upload revised files without first claiming and locking the submission.' },
    { cat: 'System Columns', text: 'Do NOT modify or delete system-generated RowId, Unique ID, or employee linkage columns.' },
    { cat: 'Lock Hoarding', text: 'Do NOT leave files locked indefinitely without active review or communication.' },
    { cat: 'Other Brokers Files', text: 'Do NOT attempt to reject or overwrite files currently claimed and locked by another broker.' },
    { cat: 'Unresolved Errors', text: 'Do NOT commit batches containing uncorrected validation errors into the live database.' }
  ]

  const currentDos = activeTab === 'hr' ? hrDos : brokerDos
  const currentDonts = activeTab === 'hr' ? hrDonts : brokerDonts

  return (
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
            {/* Role switch tabs */}
            <div className="modal-role-tabs">
              <button
                type="button"
                className={`modal-role-btn ${activeTab === 'hr' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('hr')}
              >
                <span>🏢 HR Administrator</span>
              </button>
              <button
                type="button"
                className={`modal-role-btn ${activeTab === 'broker' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('broker')}
              >
                <span>💼 Broker Underwriter</span>
              </button>
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
                <div className="rule-badge-icon is-do"><CheckIcon size={16} /></div>
                <div>
                  <h3 className="rule-header-title">DO'S — Recommended &amp; Mandatory</h3>
                  <span className="rule-header-subtitle">Essential requirements for error-free enrollment</span>
                </div>
              </div>
              <ul className="rule-list">
                {currentDos.map((item, idx) => (
                  <li key={idx}>
                    <span className="rule-bullet is-do"><CheckIcon size={11} /></span>
                    <div className="rule-text">
                      <span className="rule-tag">{item.cat}</span>
                      {item.text}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* DON'TS */}
            <div className="rule-card is-dont-card">
              <div className="rule-card-header is-dont">
                <div className="rule-badge-icon is-dont"><XIcon size={16} /></div>
                <div>
                  <h3 className="rule-header-title">DON'TS — Prohibitions</h3>
                  <span className="rule-header-subtitle">Critical actions that cause validation failures</span>
                </div>
              </div>
              <ul className="rule-list">
                {currentDonts.map((item, idx) => (
                  <li key={idx}>
                    <span className="rule-bullet is-dont"><XIcon size={11} /></span>
                    <div className="rule-text">
                      <span className="rule-tag">{item.cat}</span>
                      {item.text}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>

        {/* Modal Sticky Footer */}
        <div className="guidelines-modal-footer" style={{ padding: '12px 20px' }}>
          <div className="footer-left">
            <LightbulbIcon size={15} />
            <span style={{ fontSize: '12px' }}>Need assistance with data formatting? Contact <strong>support@mayfair.com</strong></span>
          </div>
          <button type="button" className="modal-primary-close-btn" onClick={onClose} style={{ padding: '6px 16px', fontSize: '13px' }}>
            Close Documentation
          </button>
        </div>

      </div>
    </div>
  )
}
