import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  BuildingIcon,
  CopyIcon,
  CheckIcon,
  SearchIcon,
  ChevronDownIcon,
  ShieldIcon,
} from './Icons.jsx'

export function CorporatePolicySelector({
  role = 'hr',
  corporates = [],
  policies = [],
  defaultCollapsed = false,
}) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('mayfair_accordion_corporate_policies_collapsed')
      if (saved !== null) {
        return saved === 'true'
      }
    } catch (_) {}
    return defaultCollapsed
  })

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('mayfair_accordion_corporate_policies_collapsed', String(next))
      } catch (_) {}
      return next
    })
  }
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedKey, setCopiedKey] = useState(null)
  const [copyToastText, setCopyToastText] = useState(null)
  const [openDropdownCorpId, setOpenDropdownCorpId] = useState(null)
  const [selectedPolicies, setSelectedPolicies] = useState({})
  const [policySearchTerms, setPolicySearchTerms] = useState({})
  
  const containerRef = useRef(null)
  const toastTimeoutRef = useRef(null)

  const isBroker = role === 'broker'
  const isSingle = corporates.length === 1

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.policy-control-group')) {
        setOpenDropdownCorpId(null)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenDropdownCorpId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Helper to extract policies for a corporate
  const getCorpPolicies = (corp) => {
    if (Array.isArray(corp.policies) && corp.policies.length > 0) {
      return corp.policies
    }
    if (Array.isArray(policies) && policies.length > 0) {
      const matched = policies.filter(p => String(p.corp_id || p.crop_id) === String(corp.id))
      if (matched.length > 0) return matched
    }
    if (corp.policy_no) {
      return [{ policy_no: corp.policy_no, policy_name: corp.policy_name || 'Standard Plan' }]
    }
    return []
  }

  // Filter based on search input (checks corporate name, id, and policy numbers)
  const filteredCorporates = useMemo(() => {
    if (!searchTerm.trim()) return corporates
    const term = searchTerm.toLowerCase().trim()
    return corporates.filter((corp) => {
      const name = String(corp?.name || '').toLowerCase()
      const id = String(corp?.id || '').toLowerCase()
      const corpPolicies = getCorpPolicies(corp)
      
      const matchesCorp = name.includes(term) || id.includes(term)
      const matchesPolicy = corpPolicies.some(p => 
        String(p.policy_no || p.pol_id || p.id || '').toLowerCase().includes(term) ||
        String(p.policy_name || p.plan_name || '').toLowerCase().includes(term)
      )
      return matchesCorp || matchesPolicy
    })
  }, [corporates, policies, searchTerm])

  const handleCopy = (text, key, customLabel) => {
    if (!text) return
    const toastVal = customLabel || text
    
    // Instantly set toast and copied key
    setCopiedKey(key)
    setCopyToastText(toastVal)
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = setTimeout(() => {
      setCopiedKey(null)
      setCopyToastText(null)
    }, 2500)

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
    } else {
      fallbackCopy(text)
    }
  }

  const fallbackCopy = (text) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
    } catch (e) {
      console.error('Failed to copy', e)
    }
    document.body.removeChild(textArea)
  }

  if (!corporates || corporates.length === 0) {
    return null
  }

  const titleText = isSingle
    ? 'Associated Corporate & Policies'
    : 'Associated Corporates & Policies'

  return (
    <section 
      ref={containerRef}
      className={`upload-card corporate-container-card ${isCollapsed ? 'is-card-collapsed' : ''} ${openDropdownCorpId ? 'is-dropdown-active' : ''}`}
      aria-label={titleText}
    >
      {/* Section Header */}
      <div 
        className={`corporate-section-header ${isCollapsed ? 'is-header-collapsed' : ''}`} 
        style={{ 
          marginBottom: isCollapsed ? 0 : '14px',
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
            onClick={toggleCollapsed}
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

        {!isCollapsed && corporates.length > 2 && (
          <div className="corporate-search-inline">
            <SearchIcon size={14} className="search-icon-svg" />
            <input
              type="text"
              className="corporate-search-mini"
              placeholder="Search company or policy no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-mini"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      <div className={`history-collapsible-wrapper ${isCollapsed ? 'is-collapsed' : 'is-expanded'}`}>
        <div className="history-collapsible-inner">
          <p className="corporate-section-hint" style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#64748b' }}>
            {isBroker
              ? 'Copy exact company names and insurer policy numbers into your Excel template to ensure validation passes.'
              : 'Copy company names (Column B) and insurer policy numbers (Column C) directly into your Excel template to prevent errors.'}
          </p>

          {/* Modern Premium Cards Grid */}
          <div className="corporate-policy-cards-grid">
            {filteredCorporates.map((corp) => {
              const corpPolicies = getCorpPolicies(corp)
              const isCorpCopied = copiedKey === `corp-${corp.id}`
              
              // Active policy resolution
              const defaultPolicyNo = corpPolicies.length > 0
                ? (corpPolicies[0].policy_no || corpPolicies[0].id || corpPolicies[0].pol_id || '')
                : ''
              const activePolicyNo = selectedPolicies[corp.id] || defaultPolicyNo
              const activePolicy = corpPolicies.find(p => (p.policy_no || p.id || p.pol_id) === activePolicyNo) || corpPolicies[0] || null
              
              const isPolCopied = copiedKey === `pol-${corp.id}-${activePolicyNo}`
              const isDropdownOpen = openDropdownCorpId === corp.id
              
              // Dropdown search filter
              const pSearch = (policySearchTerms[corp.id] || '').toLowerCase().trim()
              const dropdownFilteredPolicies = corpPolicies.filter(p => {
                if (!pSearch) return true
                const no = String(p.policy_no || p.id || p.pol_id || '').toLowerCase()
                const name = String(p.policy_name || p.plan_name || '').toLowerCase()
                return no.includes(pSearch) || name.includes(pSearch)
              })

              return (
                <div key={corp.id} className={`corporate-policy-card ${isDropdownOpen ? 'is-dropdown-active' : ''}`}>
                  {/* Top: Corporate Company Info & Copy Name */}
                  <div className="corp-card-top">
                    <div className="corp-identity">
                      <div className="corp-avatar">
                        <BuildingIcon size={15} />
                      </div>
                      <div className="corp-info">
                        <span className="corp-title" title={corp.name}>
                          {corp.name}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`corp-action-btn ${isCorpCopied ? 'is-copied' : ''}`}
                      onClick={() => handleCopy(corp.name, `corp-${corp.id}`, corp.name)}
                      title={`Copy "${corp.name}"`}
                    >
                      {isCorpCopied ? (
                        <>
                          <CheckIcon size={12} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon size={12} />
                          <span>Copy Name</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Bottom: Policy Selector Control */}
                  <div className="corp-card-bottom">
                    {corpPolicies.length > 1 ? (
                      <div className={`policy-control-group ${isDropdownOpen ? 'is-dropdown-active' : ''}`}>
                        {/* Interactive Full-Width Dropdown Button */}
                        <button
                          type="button"
                          className={`policy-picker-btn ${isDropdownOpen ? 'is-active' : ''}`}
                          onClick={() => setOpenDropdownCorpId(isDropdownOpen ? null : corp.id)}
                          aria-haspopup="listbox"
                          aria-expanded={isDropdownOpen}
                          title={`Click to view & select from ${corpPolicies.length} policies`}
                        >
                          <div className="picker-left">
                            <ShieldIcon size={13} className="shield-icon" />
                            <div className="picker-text">
                              <span className="picker-policy-no">{activePolicyNo}</span>
                              {activePolicy?.policy_name && (
                                <span className="picker-policy-plan" title={activePolicy.policy_name}>
                                  {activePolicy.policy_name}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="picker-right">
                            <span className="picker-count-pill">{corpPolicies.length}</span>
                            <ChevronDownIcon size={13} className={`picker-chevron ${isDropdownOpen ? 'is-rotated' : ''}`} />
                          </div>
                        </button>

                        {/* Floating Popover Menu */}
                        {isDropdownOpen && (
                          <div className="policy-dropdown-popover-menu" role="listbox">
                            <div className="popover-top-bar">
                              <span className="popover-title">Select &amp; Copy Policy ({corpPolicies.length})</span>
                              <span className="popover-subtitle">Click to select, Copy to copy number</span>
                            </div>

                            {corpPolicies.length > 4 && (
                              <div className="popover-search-box">
                                <SearchIcon size={12} className="popover-search-icon" />
                                <input
                                  type="text"
                                  className="popover-search-input"
                                  placeholder="Filter by number or plan name..."
                                  value={pSearch}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setPolicySearchTerms(prev => ({ ...prev, [corp.id]: val }))
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                />
                              </div>
                            )}

                            <div className="popover-list-body">
                              {dropdownFilteredPolicies.map((pol) => {
                                const pNo = pol.policy_no || pol.id || pol.pol_id || ''
                                const pName = pol.policy_name || pol.plan_name || ''
                                const isSelected = pNo === activePolicyNo
                                const isRowCopied = copiedKey === `pop-${corp.id}-${pNo}`

                                return (
                                  <div
                                    key={pNo}
                                    className={`popover-policy-row ${isSelected ? 'is-selected' : ''}`}
                                    onClick={() => {
                                      setSelectedPolicies(prev => ({ ...prev, [corp.id]: pNo }))
                                    }}
                                    role="option"
                                    aria-selected={isSelected}
                                    style={{ cursor: 'pointer' }}
                                    title={`Click to select "${pNo}"`}
                                  >
                                    <div className="row-info">
                                      <span className="row-policy-no">{pNo}</span>
                                      {pName && <span className="row-policy-plan">{pName}</span>}
                                    </div>

                                    <div className="row-action">
                                      <button
                                        type="button"
                                        className={`row-copy-btn ${isRowCopied ? 'is-copied' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedPolicies(prev => ({ ...prev, [corp.id]: pNo }))
                                          handleCopy(pNo, `pop-${corp.id}-${pNo}`, pNo)
                                          setOpenDropdownCorpId(null)
                                        }}
                                        title={`Copy "${pNo}"`}
                                      >
                                        {isRowCopied ? (
                                          <>
                                            <CheckIcon size={11} />
                                            <span>Copied!</span>
                                          </>
                                        ) : (
                                          <>
                                            <CopyIcon size={11} />
                                            <span>Copy</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}

                              {dropdownFilteredPolicies.length === 0 && (
                                <div className="popover-no-results">
                                  No policies match "{pSearch}"
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : corpPolicies.length === 1 ? (
                      /* Single Policy Display - Click to Copy */
                      <div className="policy-control-group is-single">
                        <button
                          type="button"
                          className={`policy-single-btn ${isPolCopied ? 'is-copied' : ''}`}
                          onClick={() => handleCopy(activePolicyNo, `pol-${corp.id}-${activePolicyNo}`, activePolicyNo)}
                          title={`Click to copy policy "${activePolicyNo}"`}
                        >
                          <div className="picker-left">
                            <ShieldIcon size={13} className="shield-icon" />
                            <div className="picker-text">
                              <span className="picker-policy-no">{activePolicyNo}</span>
                              {activePolicy?.policy_name && (
                                <span className="picker-policy-plan" title={activePolicy.policy_name}>
                                  {activePolicy.policy_name}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="picker-right">
                            {isPolCopied ? (
                              <span className="single-copied-pill">
                                <CheckIcon size={11} /> Copied!
                              </span>
                            ) : (
                              <span className="single-copy-pill">
                                <CopyIcon size={11} /> Copy
                              </span>
                            )}
                          </div>
                        </button>
                      </div>
                    ) : (
                      /* Fallback when no policy is configured */
                      <div className="policy-empty-fallback">
                        <span>Use policy number specified in your corporate schedule</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {filteredCorporates.length === 0 && (
              <div className="chips-empty-state">
                <p>No company or policy matches "<strong>{searchTerm}</strong>"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Small Copied Toast Modal rendered directly into document.body */}
      {copyToastText && createPortal(
        <div className="copy-toast-modal" role="status" aria-live="polite">
          <div className="copy-toast-badge">
            <CheckIcon size={13} />
          </div>
          <div className="copy-toast-content">
            <span>Copied <strong>"{copyToastText}"</strong> to clipboard</span>
          </div>
        </div>,
        document.body
      )}
    </section>
  )
}
