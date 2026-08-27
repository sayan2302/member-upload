import { useState, useRef, useEffect } from 'react'
import { ArrowUpDownIcon, ChevronDownIcon } from './Icons.jsx'

export function SortDropdown({
  sortBy = 'date',
  sortOrder = 'desc',
  onSortChange,
  options = [
    { key: 'name', label: 'Name' },
    { key: 'date', label: 'Date modified' },
    { key: 'records', label: 'Records' }
  ]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const currentOption = options.find((o) => o.key === sortBy) || options[0]

  return (
    <div className="history-sort-wrapper" ref={menuRef}>
      <button
        type="button"
        className={`history-sort-trigger-btn ${isOpen ? 'is-active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        title="Sort options"
      >
        <ArrowUpDownIcon size={13} className="sort-trigger-icon" />
        <span className="sort-trigger-text">
          Sort: <strong>{currentOption.label}</strong> ({sortOrder === 'desc' ? 'Desc' : 'Asc'})
        </span>
        <ChevronDownIcon size={12} className={`sort-chevron ${isOpen ? 'is-open' : ''}`} />
      </button>

      {isOpen && (
        <div className="history-sort-dropdown-menu" role="menu">
          <div className="sort-menu-section">
            {options.map((opt) => {
              const isSelected = sortBy === opt.key
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={`sort-menu-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => {
                    onSortChange({ sortBy: opt.key, sortOrder })
                    setIsOpen(false)
                  }}
                  role="menuitem"
                >
                  <span className="sort-bullet">{isSelected ? '•' : ''}</span>
                  <span className="sort-item-label">{opt.label}</span>
                </button>
              )
            })}
          </div>

          <div className="sort-menu-divider" />

          <div className="sort-menu-section">
            <button
              type="button"
              className={`sort-menu-item ${sortOrder === 'asc' ? 'is-selected' : ''}`}
              onClick={() => {
                onSortChange({ sortBy, sortOrder: 'asc' })
                setIsOpen(false)
              }}
              role="menuitem"
            >
              <span className="sort-bullet">{sortOrder === 'asc' ? '•' : ''}</span>
              <span className="sort-item-label">Ascending</span>
            </button>

            <button
              type="button"
              className={`sort-menu-item ${sortOrder === 'desc' ? 'is-selected' : ''}`}
              onClick={() => {
                onSortChange({ sortBy, sortOrder: 'desc' })
                setIsOpen(false)
              }}
              role="menuitem"
            >
              <span className="sort-bullet">{sortOrder === 'desc' ? '•' : ''}</span>
              <span className="sort-item-label">Descending</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
