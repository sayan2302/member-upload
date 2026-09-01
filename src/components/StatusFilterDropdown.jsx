import { useState, useRef, useEffect } from 'react'
import { FilterIcon, ChevronDownIcon } from './Icons.jsx'

export function StatusFilterDropdown({
  selectedStatus = 'all',
  onStatusChange,
  isBroker = false,
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

  const options = [
    { key: 'all', label: 'All Statuses' },
    { key: 'pending', label: 'Pending', dotClass: 'dot-pending' },
    ...(isBroker ? [{ key: 'locked', label: 'Locked', dotClass: 'dot-locked' }] : []),
    { key: 'approved', label: 'Approved', dotClass: 'dot-approved' },
    { key: 'failed', label: 'Failed', dotClass: 'dot-failed' },
    { key: 'rejected', label: 'Rejected', dotClass: 'dot-rejected' },
    { key: 'revoked', label: 'Revoked', dotClass: 'dot-revoked' },
  ]

  const currentOption = options.find((o) => o.key === selectedStatus) || options[0]

  return (
    <div className="history-filter-wrapper" ref={menuRef}>
      <button
        type="button"
        className={`history-sort-trigger-btn ${isOpen || selectedStatus !== 'all' ? 'is-active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        title="Filter submissions by status"
      >
        <FilterIcon size={13} className="sort-trigger-icon" />
        <span className="sort-trigger-text">
          Status: <strong>{currentOption.label}</strong>
        </span>
        <ChevronDownIcon size={12} className={`sort-chevron ${isOpen ? 'is-open' : ''}`} />
      </button>

      {isOpen && (
        <div className="history-sort-dropdown-menu status-filter-menu" role="menu">
          <div className="sort-menu-section">
            {options.map((opt) => {
              const isSelected = selectedStatus === opt.key
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={`sort-menu-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => {
                    onStatusChange(opt.key)
                    setIsOpen(false)
                  }}
                  role="menuitem"
                >
                  <span className="sort-bullet">{isSelected ? '•' : ''}</span>
                  {opt.dotClass && <span className={`status-dot-mini ${opt.dotClass}`} />}
                  <span className="sort-item-label">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
