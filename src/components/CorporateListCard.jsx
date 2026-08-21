import { useState } from 'react'

export function CorporateListCard({ corporates = [], role = 'hr' }) {
  const [copiedId, setCopiedId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!corporates || corporates.length === 0) {
    return null
  }

  const handleCopy = (corp) => {
    const textToCopy = corp.name || String(corp.id || '')
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedId(corp.id)
        setTimeout(() => setCopiedId(null), 2000)
      }).catch(() => fallbackCopy(textToCopy, corp.id))
    } else {
      fallbackCopy(textToCopy, corp.id)
    }
  }

  const fallbackCopy = (text, id) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (e) {
      console.error('Failed to copy', e)
    }
    document.body.removeChild(textArea)
  }

  const filteredCorporates = corporates.filter((c) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    const name = String(c.name || '').toLowerCase()
    const id = String(c.id || '').toLowerCase()
    return name.includes(term) || id.includes(term)
  })

  const isBroker = role === 'broker'

  return (
    <div className="corporate-card" aria-label="Associated Corporate Names">
      <div className="corporate-card-header">
        <div className="corporate-header-left">
          <span className="corporate-icon">🏢</span>
          <div>
            <h3 className="corporate-title">
              {isBroker
                ? `Assigned Client Companies (${corporates.length})`
                : 'Associated Corporate Name'}
            </h3>
            <p className="corporate-subtitle">
              Copy and paste the exact company name into your Excel spreadsheet (Column A) to prevent validation errors.
            </p>
          </div>
        </div>
        {corporates.length > 3 && (
          <button
            type="button"
            className="corporate-collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? 'Show All ▾' : 'Collapse ▴'}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <>
          {corporates.length > 4 && (
            <div className="corporate-search-wrapper">
              <input
                type="text"
                className="corporate-search-input"
                placeholder="Search company by name or ID…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          <div className="corporate-list">
            {filteredCorporates.map((corp) => {
              const isCopied = copiedId === corp.id
              return (
                <div key={corp.id} className="corporate-item">
                  <div className="corporate-info">
                    <span className="corporate-name">{corp.name}</span>
                    <span className="corporate-id-badge">ID: {corp.id}</span>
                  </div>
                  <button
                    type="button"
                    className={`corporate-copy-btn ${isCopied ? 'is-copied' : ''}`}
                    onClick={() => handleCopy(corp)}
                    title={`Copy "${corp.name}" to clipboard`}
                  >
                    {isCopied ? (
                      <>
                        <span className="copy-icon">✓</span> Copied!
                      </>
                    ) : (
                      <>
                        <span className="copy-icon">📋</span> Copy Name
                      </>
                    )}
                  </button>
                </div>
              )
            })}
            {filteredCorporates.length === 0 && (
              <p className="corporate-empty-search">No matching companies found.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
