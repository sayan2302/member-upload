import { useState, useEffect } from 'react'
import {
  BookOpenIcon,
  CheckIcon,
  XIcon,
  BuildingIcon
} from './Icons.jsx'

export function PlatformGuidePage({ 
  initialRole = 'hr', 
  onBackToUpload 
}) {
  const isBroker = initialRole === 'broker'
  const activeRole = isBroker ? 'broker' : 'hr'

  const hrDos = [
    { cat: 'Official Template', text: 'Download and use the official 33-column Mayfair Excel template (.xlsx or .xls).' },
    { cat: 'Primary Employee', text: 'Set primary employee relationship as "Self". Every family must have exactly one Self record.' },
    { cat: 'Family Linking', text: 'Dependents (Spouse, Child, Parent) must share the exact same Employee ID as their primary employee.' },
    { cat: 'Standard Dates', text: 'Enter dates in DD/MM/YYYY or YYYY-MM-DD standard format (e.g. 15/08/1990).' },
    { cat: 'Sum Insured', text: 'Enter numeric Sum Insured matching approved corporate policy tiers (e.g. 500000 without commas or currency symbols).' },
    { cat: 'Validation Preview', text: 'Review highlighted cell errors in the interactive preview table before submitting.' },
    { cat: 'Submission Tracking', text: 'Monitor processing status and download historical records from the "Past Uploads" tab.' },
    { cat: 'Revoke Mistaken Uploads', text: 'Use the "Revoke" button to recall mistakenly uploaded files before LawtonAsia locks them.' }
  ]

  const hrDonts = [
    { cat: 'Template Structure', text: 'Do NOT rename, reorder, delete, or add custom column headers in the template.' },
    { cat: 'Orphan Dependents', text: 'Do NOT upload orphan dependents without an accompanying Self employee row sharing the same Employee ID.' },
    { cat: 'Invalid Dates', text: 'Do NOT use text or impossible dates like "31/02/2024" or "12th Jan 90".' },
    { cat: 'Password Protection', text: 'Do NOT upload password-protected, encrypted, or corrupted Excel workbooks.' },
    { cat: 'Trailing Spaces', text: 'Do NOT leave leading or trailing whitespace in Employee ID, Mobile Number, or Email fields.' },
    { cat: 'Duplicate Batches', text: 'Do NOT re-upload identical files while a previous submission is still pending LawtonAsia review.' }
  ]

  const brokerDos = [
    { cat: 'Exclusive Lock', text: 'Click "Download & Lock" on an HR submission to lock exclusive review and editing rights.' },
    { cat: '61-Column Schema', text: 'Use the expanded 61-column LawtonAsia template containing all 28 underwriting and TPA fields.' },
    { cat: 'Prompt Unlock', text: 'Click "Unlock" if you are not proceeding, releasing the lock so team members can claim the file.' },
    { cat: 'Rejection Feedback', text: 'When rejecting a file, select a categorized reason and provide clear comments for HR to fix.' },
    { cat: 'Policy Verification', text: 'Verify insurer policy numbers, TPA codes, and endorsement IDs before committing to the database.' },
    { cat: 'Clean Database Commit', text: 'Ensure all validation checks pass with 0 errors before final database save.' }
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
      {/* Top Navigation & Action Bar */}
      <div className="guide-page-topbar">
        <div className="guide-topbar-meta">
          <span className="guide-doc-badge">DOCUMENTATION</span>
          <span className="guide-doc-title">Platform Guidelines &amp; Operating Rules</span>
        </div>

        {onBackToUpload && (
          <button 
            type="button" 
            className="guide-back-btn" 
            onClick={onBackToUpload}
          >
            ← {activeRole === 'broker' ? 'Back to Dashboard' : 'Back to Upload Portal'}
          </button>
        )}
      </div>

      {/* Hero Header Section */}
      <div className="guide-hero-banner" style={{ padding: '24px 28px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div className="guide-hero-content">
          <h1 className="guide-hero-title" style={{ fontSize: '20px', color: '#0f172a', marginBottom: '6px' }}>
            Enrollment Rules &amp; Guidelines Documentation
          </h1>
          <p className="guide-hero-desc" style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
            Mandatory standards and prohibited actions to ensure error-free member data uploads and underwriting processing.
          </p>

          {/* Role Badge Indicator */}
          <div className="guide-role-selector" style={{ marginTop: '0' }}>
            <div className="guide-role-pill is-active" style={{ cursor: 'default' }}>
              {isBroker ? '💼 LawtonAsia Underwriter Guidelines' : '🏢 HR Administrator Guidelines'}
            </div>
          </div>
        </div>
      </div>

      {/* Do's & Don'ts Documentation Section */}
      <section className="guide-section" style={{ padding: '24px 0', border: 'none' }} aria-label="Mandatory Standards and Prohibitions">
        <div className="dos-donts-split-container">
          
          {/* DO'S CARD */}
          <div className="rule-card is-do-card">
            <div className="rule-card-header is-do">
              <div className="rule-badge-icon is-do"><CheckIcon size={16} /></div>
              <div>
                <h3 className="rule-header-title">DO'S — Recommended &amp; Mandatory Standards</h3>
                <span className="rule-header-subtitle">Essential requirements for clean, error-free processing</span>
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

          {/* DON'TS CARD */}
          <div className="rule-card is-dont-card">
            <div className="rule-card-header is-dont">
              <div className="rule-badge-icon is-dont"><XIcon size={16} /></div>
              <div>
                <h3 className="rule-header-title">DON'TS — Prohibitions &amp; Common Pitfalls</h3>
                <span className="rule-header-subtitle">Actions that cause validation failures or data rejections</span>
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
      </section>

      {/* Minimal Footer */}
      <div className="guide-page-footer" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          Need assistance with custom corporate plan mapping? Contact <strong>support@mayfair.com</strong>
        </span>
      </div>
    </div>
  )
}
