import { useState, useMemo } from 'react'
import {
  BuildingIcon,
  CopyIcon,
  CheckIcon,
  SearchIcon,
  ChevronDownIcon
} from './Icons.jsx'

export function CorporatePolicySelector({
  role = 'hr',
  corporates = [],
  defaultCollapsed = false,
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const isBroker = role === 'broker'
  const isSingle = corporates.length === 1

  // Filter based on search input
  const filteredCorporates = useMemo(() => {
    if (!searchTerm.trim()) return corporates
    const term = searchTerm.toLowerCase().trim()
    return corporates.filter((corp) => {
      const name = String(corp?.name || '').toLowerCase()
      const id = String(corp?.id || '').toLowerCase()
      return name.includes(term) || id.includes(term)
    })
  }, [corporates, searchTerm])

  const handleCopy = (text, key) => {
    if (!text) return
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(key)
        setTimeout(() => setCopiedId(null), 2000)
      }).catch(() => fallbackCopy(text, key))
    } else {
      fallbackCopy(text, key)
    }
  }

  const fallbackCopy = (text, key) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      setCopiedId(key)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (e) {
      console.error('Failed to copy', e)
    }
    document.body.removeChild(textArea)
  }

  if (!corporates || corporates.length === 0) {
    return null
  }

  const titleText = isSingle
    ? 'Associated Corporate'
    : 'Associated Corporates'

  return (
    <section 
      className={`upload-card corporate-container-card ${isCollapsed ? 'is-card-collapsed' : ''}`}
      aria-label={titleText}
    >
      <div 
        className={`corporate-section-header ${isCollapsed ? 'is-header-collapsed' : ''}`} 
        style={{ 
          marginBottom: isCollapsed ? 0 : '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <button
            type="button"
            className="history-title-toggle"
            onClick={() => setIsCollapsed(prev => !prev)}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? `Click to expand ${titleText.toLowerCase()}` : `Click to collapse ${titleText.toLowerCase()}`}
          >
            <span className="history-title-text">{titleText}</span>
            <span className="history-count-badge">{corporates.length}</span>
            <span className={`history-chevron-indicator ${isCollapsed ? 'is-collapsed' : 'is-expanded'}`}>
              <ChevronDownIcon size={16} />
            </span>
          </button>
        </div>

        {!isCollapsed && corporates.length > 3 && (
          <div className="corporate-search-inline">
            <SearchIcon size={14} className="search-icon-svg" />
            <input
              type="text"
              className="corporate-search-mini"
              placeholder="Filter company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className={`history-collapsible-wrapper ${isCollapsed ? 'is-collapsed' : 'is-expanded'}`}>
        <div className="history-collapsible-inner">
          <p className="corporate-section-hint" style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#64748b' }}>
            {isBroker
              ? 'Click "Copy" to use the exact company name in Column C of the template.'
              : 'Click "Copy" to use the exact company name in Column B of the template.'}
          </p>

          {/* Modern Minimalist Chips Grid */}
          <div className="corporate-chips-grid">
            {filteredCorporates.map((corp) => {
              const isCopied = copiedId === `corp-${corp.id}`

              return (
                <div
                  key={corp.id}
                  className={`corporate-chip ${isCopied ? 'is-copied' : ''}`}
                  onClick={() => handleCopy(corp.name, `corp-${corp.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleCopy(corp.name, `corp-${corp.id}`)
                    }
                  }}
                  title={`Click to copy "${corp.name}"`}
                >
                  <div className="chip-icon">
                    <BuildingIcon size={15} />
                  </div>

                  <div className="chip-body">
                    <span className="chip-name">{corp.name}</span>
                  </div>

                  <div className="chip-action">
                    {isCopied ? (
                      <span className="chip-badge-copied">
                        <CheckIcon size={12} /> Copied
                      </span>
                    ) : (
                      <span className="chip-badge-copy">
                        <CopyIcon size={12} /> Copy
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {filteredCorporates.length === 0 && (
              <span className="chips-empty-text">No company matches "{searchTerm}"</span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
