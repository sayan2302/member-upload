import {
  CheckIcon,
  XIcon
} from './Icons.jsx'

export function PlatformGuidePage({ 
  initialRole = 'hr', 
  onBackToUpload 
}) {
  const isBroker = initialRole === 'broker'
  const activeRole = isBroker ? 'broker' : 'hr'

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

  const currentDos = activeRole === 'hr' ? hrDos : brokerDos
  const currentDonts = activeRole === 'hr' ? hrDonts : brokerDonts

  return (
    <div className="guide-page-container">
      {/* Sleek Minimalist Header */}
      <div className="guide-minimal-header">
        <div className="guide-header-left">
          <div className="guide-title-row">
            {onBackToUpload && (
              <button 
                type="button" 
                className="guide-minimal-back-btn" 
                onClick={onBackToUpload}
                aria-label="Back"
              >
                <svg 
                  width="13" 
                  height="13" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Back</span>
              </button>
            )}
            <h1 className="guide-minimal-title">
              Guidelines &amp; Operating Rules
            </h1>
            <span className={`guide-minimal-role-pill ${isBroker ? 'is-broker' : 'is-hr'}`}>
              {isBroker ? 'LawtonAsia' : 'HR'}
            </span>
          </div>
          <p className="guide-minimal-desc">
            Mandatory standards and prohibited actions to ensure error-free member enrollment.
          </p>
        </div>
      </div>

      {/* Do's & Don'ts Documentation Section */}
      <section className="guide-section" style={{ padding: '0', border: 'none', background: 'transparent' }} aria-label="Mandatory Standards and Prohibitions">
        <div className="dos-donts-split-container">
          
          {/* DO'S CARD */}
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

          {/* DON'TS CARD */}
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
      </section>
    </div>
  )
}
