import { useState, useEffect } from 'react'
import {
  BookOpenIcon,
  CheckIcon,
  XIcon,
  LightbulbIcon,
  ShieldAlertIcon,
  ChevronDownIcon,
  LockIcon,
  UnlockIcon,
  UploadCloudIcon,
  ExcelFileIcon,
  CheckCircleIcon,
  AlertTriangleIcon
} from './Icons.jsx'

export function GuidelinesSection({ currentRole = 'hr' }) {
  const isBroker = currentRole === 'broker'
  const activeTab = isBroker ? 'broker' : 'hr'
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('mayfair_accordion_guidelines_collapsed')
      if (saved !== null) return saved === 'true'
    } catch (_) {}
    return false
  })
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('mayfair_accordion_guidelines_collapsed', String(next))
      } catch (_) {}
      return next
    })
  }

  // Micro-animation auto-stepper for the live visual demonstration
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % 4)
    }, 3800)
    return () => clearInterval(timer)
  }, [activeTab])

  const hrSteps = [
    {
      step: '1',
      title: 'Download Template',
      subtitle: 'Use the official 33-column Mayfair HR template (.xlsx/.xls).',
      badge: 'Step 1',
      status: 'Ready',
      icon: <ExcelFileIcon size={20} />
    },
    {
      step: '2',
      title: 'Fill Members & Dependents',
      subtitle: 'Primary member is Self; dependents must share the same Employee ID.',
      badge: 'Step 2',
      status: 'Required',
      icon: <CheckCircleIcon size={20} />
    },
    {
      step: '3',
      title: 'Interactive Live Preview',
      subtitle: 'Click red cells to view instant tooltip guidance and correct errors.',
      badge: 'Step 3',
      status: 'Validation',
      icon: <AlertTriangleIcon size={20} />
    },
    {
      step: '4',
      title: 'Submit for Review',
      subtitle: 'Once 0 errors remain, submit file for LawtonAsia underwriting review.',
      badge: 'Step 4',
      status: 'Approved',
      icon: <UploadCloudIcon size={20} />
    }
  ]

  const brokerSteps = [
    {
      step: '1',
      title: 'Download & Lock File',
      subtitle: 'Click "Download & Lock" on an HR submission to gain exclusive review lock.',
      badge: 'Step 1',
      status: 'Locking',
      icon: <LockIcon size={20} />
    },
    {
      step: '2',
      title: '61-Column Auto-Expansion',
      subtitle: 'Downloaded template expands with all LawtonAsia underwriting fields pre-linked.',
      badge: 'Step 2',
      status: 'Expanded',
      icon: <ExcelFileIcon size={20} />
    },
    {
      step: '3',
      title: 'Upload Revised File',
      subtitle: 'Click "Upload" to validate your completed 61-column underwriting sheet.',
      badge: 'Step 3',
      status: 'Validation',
      icon: <UploadCloudIcon size={20} />
    },
    {
      step: '4',
      title: 'Review & Save to DB',
      subtitle: 'Verify the interactive preview and commit enrollment to live policy database.',
      badge: 'Step 4',
      status: 'Approved',
      icon: <CheckCircleIcon size={20} />
    }
  ]

  const currentSteps = activeTab === 'hr' ? hrSteps : brokerSteps

  return (
    <div className={`guidelines-card-container ${isCollapsed ? 'is-collapsed-guide' : ''}`}>
      {/* Top Header with Role Switcher and Collapse Toggle */}
      <div className="guidelines-header">
        <div className="guidelines-header-left">
          <div className="guidelines-title-badge">
            <BookOpenIcon size={16} />
            <span>Platform Guidelines & Best Practices</span>
          </div>
          <p className="guidelines-header-subtitle">
            Step-by-step instructions, essential Do's & Don'ts, and common pitfalls for error-free enrollment.
          </p>
        </div>

        <div className="guidelines-header-right">
          {/* Role badge */}
          <div className="guidelines-role-badge">
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
              {isBroker ? '💼 LawtonAsia Guide' : '🏢 HR Guide'}
            </span>
          </div>

          {/* Collapse Toggle */}
          <button
            type="button"
            className="guidelines-toggle-btn"
            onClick={toggleCollapsed}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? 'Expand Guidelines' : 'Collapse Guidelines'}
          >
            <span>{isCollapsed ? 'Show Guide' : 'Hide Guide'}</span>
            <ChevronDownIcon size={15} className={`guide-chevron ${isCollapsed ? 'is-collapsed' : ''}`} />
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      <div className={`history-collapsible-wrapper ${isCollapsed ? 'is-collapsed' : 'is-expanded'}`}>
        <div className="history-collapsible-inner">
          <div className="guidelines-body">
            
            {/* 1. Animated Interactive Workflow Demonstration */}
            <div className="guidelines-interactive-demo">
              <div className="demo-header">
                <div className="demo-header-title">
                  <span className="demo-live-dot" />
                  <strong>Live Workflow Simulation:</strong> {activeTab === 'hr' ? 'HR File Upload & Validation Cycle' : 'LawtonAsia Review, Underwriting & Database Lock Lifecycle'}
                </div>
                <div className="demo-step-tracker">
                  Active Step: <strong>{activeStepIndex + 1} / 4</strong>
                </div>
              </div>

              <div className="demo-stepper-grid">
                {currentSteps.map((s, idx) => {
                  const isActive = activeStepIndex === idx
                  const isDone = activeStepIndex > idx
                  return (
                    <div
                      key={s.step}
                      className={`demo-step-card ${isActive ? 'is-active' : ''} ${isDone ? 'is-done' : ''}`}
                      onClick={() => setActiveStepIndex(idx)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="step-card-top">
                        <div className="step-number-badge">{isDone ? '✓' : s.step}</div>
                        <div className="step-icon-bubble">{s.icon}</div>
                        <span className={`step-status-tag ${s.status.toLowerCase()}`}>{s.status}</span>
                      </div>
                      <h4 className="step-title">{s.title}</h4>
                      <p className="step-desc">{s.subtitle}</p>
                      {isActive && <div className="step-active-glow-bar" />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2. Side-by-Side Do's & Don'ts Cards */}
            <div className="dos-donts-grid">
              
              {/* Do's Column (Green) */}
              <div className="guideline-box is-dos">
                <div className="guideline-box-header">
                  <div className="box-icon-wrap is-do">
                    <CheckIcon size={16} />
                  </div>
                  <h3>DO'S — Best Practices</h3>
                </div>
                <ul className="guideline-list">
                  {activeTab === 'hr' ? (
                    <>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Official Template:</strong> Download and use the template provided in Member data upload section.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Primary Employee:</strong> Set primary employee relationship as "Insured". Every family must have exactly one Insured record.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Family Linking:</strong> Dependents (Spouse, Child, Parent) must share the exact same Employee ID as their Insured member.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Standard Dates:</strong> Enter dates in YYYY-MM-DD format (e.g. 1993-12-15).
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Validation Preview:</strong> Review highlighted cell errors in the interactive preview table before submitting.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Submission Tracking:</strong> Monitor processing status and download historical records from the "Past Uploads" tab.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Revoke File upload:</strong> Use the "Revoke" button to recall mistakenly uploaded files before LawtonAsia locks them.
                        </div>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Exclusive Lock:</strong> Click "Download &amp; Lock" on an HR submission to lock exclusive review and editing rights.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Column update:</strong> Fill all the required and mandatory fields, HR filled details will come pre-populated
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Prompt Unlock:</strong> Click "Unlock" if you are not proceeding, releasing the lock so team members can claim the file.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Rejection Feedback:</strong> When rejecting a file, select a categorized reason and provide clear comments for HR to fix.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Submit Data:</strong> Ensure all validation checks pass with 0 errors before final database save.
                        </div>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Don'ts Column (Red) */}
              <div className="guideline-box is-donts">
                <div className="guideline-box-header">
                  <div className="box-icon-wrap is-dont">
                    <XIcon size={16} />
                  </div>
                  <h3>DON'TS — Critical Prohibitions</h3>
                </div>
                <ul className="guideline-list">
                  {activeTab === 'hr' ? (
                    <>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Template Structure:</strong> Do NOT rename, reorder, delete, or add custom column headers in the template.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Dependents:</strong> Do NOT upload dependents without an accompanying Insured employee row sharing the same Employee ID.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Invalid Dates:</strong> Do NOT use text or impossible dates like "31/02/2024" or "12th Jan 90".
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Password Protection:</strong> Do NOT upload password-protected, encrypted, or corrupted Excel workbooks.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Trailing Spaces:</strong> Do NOT leave leading or trailing whitespace in Employee ID, Mobile Number, or Email fields.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Duplicate Batches:</strong> Do NOT re-upload identical files while a previous submission is still pending LawtonAsia review.
                        </div>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>No Unlocked Edits:</strong> Do NOT attempt to upload revised files without first claiming and locking the submission.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>System Columns:</strong> Do NOT modify or delete system-generated RowId, Unique ID, or employee linkage columns.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Lock Hoarding:</strong> Do NOT leave files locked indefinitely without active review or communication.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Other LawtonAsia Files:</strong> Do NOT attempt to reject or overwrite files currently claimed and locked by another LawtonAsia team member.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Unresolved Errors:</strong> Do NOT commit batches containing uncorrected validation errors into the live database.
                        </div>
                      </li>
                    </>
                  )}
                </ul>
              </div>

            </div>

            {/* 3. Common Pitfalls & Quick Solutions */}
            <div className="pitfalls-section">
              <div className="pitfalls-header">
                <div className="pitfalls-title">
                  <ShieldAlertIcon size={16} />
                  <span>Common Pitfalls &amp; Instant Solutions</span>
                </div>
              </div>

              <div className="pitfalls-grid">
                {activeTab === 'hr' ? (
                  <>
                    <div className="pitfall-card">
                      <div className="pitfall-badge">⚠️ Pitfall 1</div>
                      <h4>Date Format Rejection</h4>
                      <p>Entering dates as <code>MM/DD/YYYY</code> or text strings like <em>"12th Jan 90"</em> causes validation failure.</p>
                      <div className="pitfall-fix">
                        <strong>Fix:</strong> Format all Excel date cells as <code>DD/MM/YYYY</code> (e.g. <code>15/08/1990</code>).
                      </div>
                    </div>

                    <div className="pitfall-card">
                      <div className="pitfall-badge">⚠️ Pitfall 2</div>
                      <h4>Dependent ID Mismatch</h4>
                      <p>Typing a different Employee ID or having trailing spaces on a spouse/child row breaks the family group.</p>
                      <div className="pitfall-fix">
                        <strong>Fix:</strong> Copy and paste the exact primary employee ID into all dependent rows.
                      </div>
                    </div>

                    <div className="pitfall-card">
                      <div className="pitfall-badge">⚠️ Pitfall 3</div>
                      <h4>Missing Corporate Code</h4>
                      <p>Uploading without selecting the corporate in the header dropdown creates an orphan submission.</p>
                      <div className="pitfall-fix">
                        <strong>Fix:</strong> Select your Corporate / Group Corporate from the top dropdown before uploading.
                      </div>
                    </div>

                    <div className="pitfall-card">
                      <div className="pitfall-badge">⚠️ Pitfall 4</div>
                      <h4>Hidden Leading/Trailing Spaces</h4>
                      <p>Invisible spaces around Mobile Numbers or Email IDs cause formatting validation errors.</p>
                      <div className="pitfall-fix">
                        <strong>Fix:</strong> Use Excel <code>=TRIM()</code> or clear extra spaces before saving.
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="pitfall-card">
                      <div className="pitfall-badge">⚠️ Pitfall 1</div>
                      <h4>Concurrent Overwrite Conflict</h4>
                      <p>Two LawtonAsia team members editing the same submission simultaneously can lead to lost underwriting work.</p>
                      <div className="pitfall-fix">
                        <strong>Fix:</strong> Always use <code>Download &amp; Lock</code> to guarantee exclusive editing rights.
                      </div>
                    </div>

                    <div className="pitfall-card">
                      <div className="pitfall-badge">⚠️ Pitfall 2</div>
                      <h4>Corrupted Schema Mapping</h4>
                      <p>Deleting columns from the 61-column expanded LawtonAsia template will cause server ingestion failure.</p>
                      <div className="pitfall-fix">
                        <strong>Fix:</strong> Keep all 61 columns intact; fill the required underwriting columns and leave optional ones blank.
                      </div>
                    </div>

                    <div className="pitfall-card">
                      <div className="pitfall-badge">⚠️ Pitfall 3</div>
                      <h4>Lock Stagnation</h4>
                      <p>Holding locks on files for days prevents colleagues from processing urgent endorsements.</p>
                      <div className="pitfall-fix">
                        <strong>Fix:</strong> Click <code>Unlock</code> if you need to hand off the submission to another team member.
                      </div>
                    </div>

                    <div className="pitfall-card">
                      <div className="pitfall-badge">⚠️ Pitfall 4</div>
                      <h4>Unmapped Sum Insured Bands</h4>
                      <p>Entering Sum Insured amounts that do not match the corporate's policy schedule will trigger error flags.</p>
                      <div className="pitfall-fix">
                        <strong>Fix:</strong> Ensure Sum Insured values conform to the corporate's approved policy tiers.
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
