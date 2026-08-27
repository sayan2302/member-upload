import { useState, useRef, useEffect } from 'react'
import { CalendarIcon, ChevronDownIcon, CloseIcon } from './Icons.jsx'

export function DateRangeFilterDropdown({
  startDate = '',
  endDate = '',
  onDateRangeChange,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempStart, setTempStart] = useState(startDate)
  const [tempEnd, setTempEnd] = useState(endDate)
  const dropdownRef = useRef(null)

  // Sync temp dates when props change
  useEffect(() => {
    setTempStart(startDate)
    setTempEnd(endDate)
  }, [startDate, endDate])

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const formatDateShort = (isoDateStr) => {
    if (!isoDateStr) return ''
    try {
      const parts = isoDateStr.split('-')
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      }
      return isoDateStr
    } catch {
      return isoDateStr
    }
  }

  const getPresetDates = (presetKey) => {
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    const todayStr = toYMD(now)

    if (presetKey === 'today') {
      return { start: todayStr, end: todayStr }
    }
    if (presetKey === 'yesterday') {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      const yStr = toYMD(y)
      return { start: yStr, end: yStr }
    }
    if (presetKey === 'last7') {
      const past7 = new Date(now)
      past7.setDate(past7.getDate() - 6)
      return { start: toYMD(past7), end: todayStr }
    }
    if (presetKey === 'last30') {
      const past30 = new Date(now)
      past30.setDate(past30.getDate() - 29)
      return { start: toYMD(past30), end: todayStr }
    }
    if (presetKey === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: toYMD(firstDay), end: todayStr }
    }
    return { start: '', end: '' }
  }

  const handleApplyPreset = (presetKey) => {
    const { start, end } = getPresetDates(presetKey)
    setTempStart(start)
    setTempEnd(end)
    onDateRangeChange({ startDate: start, endDate: end })
    setIsOpen(false)
  }

  const handleApplyCustom = () => {
    let finalStart = tempStart
    let finalEnd = tempEnd

    // If start is after end, swap them gracefully
    if (finalStart && finalEnd && finalStart > finalEnd) {
      const t = finalStart
      finalStart = finalEnd
      finalEnd = t
      setTempStart(finalStart)
      setTempEnd(finalEnd)
    }

    onDateRangeChange({ startDate: finalStart, endDate: finalEnd })
    setIsOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setTempStart('')
    setTempEnd('')
    onDateRangeChange({ startDate: '', endDate: '' })
    setIsOpen(false)
  }

  const hasActiveFilter = Boolean(startDate || endDate)

  const getDisplayValueOnly = () => {
    if (!startDate && !endDate) return 'All Time'
    if (startDate && endDate) {
      if (startDate === endDate) return formatDateShort(startDate)
      return `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`
    }
    if (startDate) return `From ${formatDateShort(startDate)}`
    if (endDate) return `Until ${formatDateShort(endDate)}`
    return 'Custom'
  }

  return (
    <div className="history-filter-wrapper date-range-filter-wrapper" ref={dropdownRef}>
      {/* Dropdown Trigger Button matching Status and Sort triggers */}
      <button
        type="button"
        className={`history-sort-trigger-btn ${isOpen || hasActiveFilter ? 'is-active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        title="Filter submissions by date range"
      >
        <CalendarIcon size={13} className="sort-trigger-icon" />
        <span className="sort-trigger-text">
          Date: <strong>{getDisplayValueOnly()}</strong>
        </span>

        {hasActiveFilter && (
          <span
            className="date-trigger-clear-btn"
            onClick={handleClear}
            title="Clear date filter"
            aria-label="Clear date filter"
          >
            ×
          </span>
        )}

        <ChevronDownIcon size={12} className={`sort-chevron ${isOpen ? 'is-open' : ''}`} />
      </button>

      {/* Popover Filter Panel */}
      {isOpen && (
        <div className="date-range-popover-menu" role="dialog" aria-label="Date range filter">
          <div className="date-filter-presets-strip">
            <span className="preset-strip-title">Quick Presets:</span>
            <div className="preset-buttons-grid">
              <button
                type="button"
                className={`preset-btn ${!startDate && !endDate ? 'is-selected' : ''}`}
                onClick={() => handleApplyPreset('all')}
              >
                All Time
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => handleApplyPreset('today')}
              >
                Today
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => handleApplyPreset('last7')}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => handleApplyPreset('last30')}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => handleApplyPreset('thisMonth')}
              >
                This Month
              </button>
            </div>
          </div>

          <div className="date-custom-range-divider">
            <span>or select custom range</span>
          </div>

          <div className="date-custom-inputs-group">
            <div className="date-input-field-wrap">
              <label htmlFor="custom-from-date">From Date</label>
              <input
                id="custom-from-date"
                type="date"
                className="date-picker-input"
                value={tempStart}
                max={tempEnd || undefined}
                onChange={(e) => setTempStart(e.target.value)}
              />
            </div>

            <div className="date-input-field-wrap">
              <label htmlFor="custom-to-date">To Date</label>
              <input
                id="custom-to-date"
                type="date"
                className="date-picker-input"
                value={tempEnd}
                min={tempStart || undefined}
                onChange={(e) => setTempEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="date-filter-actions">
            <button
              type="button"
              className="date-filter-clear-btn"
              onClick={handleClear}
              disabled={!tempStart && !tempEnd && !startDate && !endDate}
            >
              Clear
            </button>
            <button
              type="button"
              className="date-filter-apply-btn"
              onClick={handleApplyCustom}
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
