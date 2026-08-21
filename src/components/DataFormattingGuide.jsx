import { useState } from 'react'

export function DataFormattingGuide() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="guide-card" aria-label="Excel formatting guidelines">
      <div className="guide-card-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="guide-header-left">
          <span className="guide-icon">💡</span>
          <div>
            <h4 className="guide-title">Excel Data Formatting Guidelines</h4>
            <p className="guide-subtitle">
              Follow standard column formats to ensure 100% acceptance during live validation.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="guide-toggle-btn"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Hide Rules ▴' : 'View Rules ▾'}
        </button>
      </div>

      {isOpen && (
        <div className="guide-content">
          <div className="guide-grid">
            <div className="guide-rule-item">
              <div className="guide-rule-header">
                <span className="rule-badge">📅 Date Format</span>
                <span className="rule-format">YYYY-MM-DD</span>
              </div>
              <p className="rule-desc">
                Dates of birth and effective dates must be formatted as <code>1990-05-24</code>. Avoid <code>DD/MM/YYYY</code> or text dates.
              </p>
            </div>

            <div className="guide-rule-item">
              <div className="guide-rule-header">
                <span className="rule-badge">🌍 Country & Nationality</span>
                <span className="rule-format">Full Name</span>
              </div>
              <p className="rule-desc">
                Always use full country names like <code>Thailand</code>, <code>United Kingdom</code>, <code>United States</code>, or <code>India</code>.
              </p>
            </div>

            <div className="guide-rule-item">
              <div className="guide-rule-header">
                <span className="rule-badge">⚙️ Operation</span>
                <span className="rule-format">Add | Modify | Delete</span>
              </div>
              <p className="rule-desc">
                Use <code>Add</code> for new enrollments, <code>Modify</code> to update details, or <code>Delete</code> to remove a member.
              </p>
            </div>

            <div className="guide-rule-item">
              <div className="guide-rule-header">
                <span className="rule-badge">👥 Relationship & Gender</span>
                <span className="rule-format">Standard Values</span>
              </div>
              <p className="rule-desc">
                Relation: <code>Employee</code>, <code>Spouse</code>, <code>Child</code>. Gender: <code>Male</code>, <code>Female</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
