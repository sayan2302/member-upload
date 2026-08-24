import { useState, useMemo } from 'react'
import {
  BuildingIcon,
  CopyIcon,
  CheckIcon,
  SearchIcon,
} from './Icons.jsx'

export function CorporatePolicySelector({
  role = 'hr',
  corporates = [],
}) {
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

  return (
    <div className="corporate-section" aria-label="Associated Corporate Names">
      <div className="corporate-section-header">
        <div className="corporate-section-meta">
          <span className="corporate-section-label">
            {isSingle
              ? 'Associated Corporate'
              : isBroker
              ? `Assigned Client Companies (${corporates.length})`
              : `Associated Sub-Corporates (${corporates.length})`}
          </span>
          <span className="corporate-section-hint">
            (Click copy to use exact name in Column A)
          </span>
        </div>

        {corporates.length > 3 && (
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
  )
}
