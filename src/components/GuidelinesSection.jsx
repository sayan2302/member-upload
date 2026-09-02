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
                          <strong>Use the Official Template:</strong> Always download and start from the standard Mayfair 33-column Excel template.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Primary Member Relationship:</strong> Always set the main employee's relationship as <code>Self</code>.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Link Dependents Correctly:</strong> Dependents (Spouse, Child, Parent) must share the <strong>exact same Employee ID</strong> as their primary employee.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Standard Date Formats:</strong> Enter dates as <code>DD/MM/YYYY</code> or <code>YYYY-MM-DD</code> (e.g. <code>15/08/1990</code>).
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Review Worksheet Errors:</strong> Click red error cells in the interactive preview table to view instant tooltips detailing the exact fix.
                        </div>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Lock Before Working:</strong> Always click <code>Download &amp; Lock</code> to claim exclusive review lock before making underwriting updates.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Use 61-Column Schema:</strong> Fill LawtonAsia underwriting fields (Policy Numbers, TPA details, Endorsement numbers, Premium amounts) in the expanded template.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Unlock If Not Proceeding:</strong> Click <code>Unlock</code> if you need to release the submission so other LawtonAsia team members can access it.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-do"><CheckIcon size={12} /></span>
                        <div>
                          <strong>Verify Underwriting Preview:</strong> Review all 61 columns in the interactive preview before final approval and database commit.
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
                          <strong>Do NOT Alter Header Names:</strong> Never rename, reorder, delete, or add extra column headers in the template.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Do NOT Upload Orphan Dependents:</strong> Never upload a Spouse or Child row without a preceding or accompanying <code>Self</code> employee row.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Do NOT Use Password Protection:</strong> Ensure the Excel spreadsheet is unprotected and not encrypted before upload.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Do NOT Leave Mandatory Fields Blank:</strong> Employee ID, Member Name, Relationship, Gender, and DOB must never be empty.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Do NOT Use Invalid Calendar Dates:</strong> Avoid non-existent dates like <code>31/02/2024</code> or plain text in date columns.
                        </div>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Do NOT Upload Without Locking:</strong> You cannot upload revised files until the submission is locked to your user account.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Do NOT Modify RowId Identifiers:</strong> Do not change or remove the system-generated <code>RowId</code> or primary <code>Employee ID</code> keys.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Do NOT Leave Submissions Locked Indefinitely:</strong> Release the lock promptly if you are not actively reviewing or uploading revisions.
                        </div>
                      </li>
                      <li>
                        <span className="bullet-pill is-dont"><XIcon size={12} /></span>
                        <div>
                          <strong>Do NOT Submit Unresolved Errors:</strong> Always rectify red cell validation warnings before committing records to the live database.
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
