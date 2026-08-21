import { useMemo, useState } from 'react'
import { getApiConfig } from './apiConfig.js'

const apiConfig = getApiConfig()
const beneficiaryColumns = [['BenefUserID', 'Member ID'], ['BenefName', 'Name'], ['BenefDOB', 'Date of birth'], ['BenefAge', 'Age'], ['BenefSex', 'Gender'], ['BenefRelToPriID', 'Relationship'], ['BenefActive', 'Active']]

const getCorporateLabel = (membership) => membership.corp_name || membership.corporate_name || membership.corpName || `Corporate ${membership.corp_id}`
const getPolicyLabel = (membership) => membership.pol_no || membership.policy_no || membership.policyNumber || `Policy ${membership.pol_id}`

function MetricIcon({ name }) {
  const paths = {
    enrolments: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M16 4.5a3 3 0 0 1 0 5.8M18.5 20v-2a5.5 5.5 0 0 0-3-4.9" /></>,
    insured: <><path d="M12 3 5.5 6v5c0 4.2 2.8 7.8 6.5 9.5 3.7-1.7 6.5-5.3 6.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
    dependents: <><circle cx="8" cy="8" r="2.5" /><circle cx="16" cy="9" r="2" /><path d="M3.5 20v-1.5a4.5 4.5 0 0 1 9 0V20M14 16.5a4 4 0 0 1 6.5 3.1v.4" /></>,
    policies: <><path d="M6 3.5h9l3 3V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" /><path d="M14 3.5v4h4M8 12h8M8 16h6" /></>,
  }
  return <svg className="metric-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

async function requestMemberships(params) {
  const response = await fetch(`${apiConfig.apiBaseUrl}/memberships?${params}`, { headers: { 'x-api-key': apiConfig.apiKey } })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message || data?.error || `Unable to load memberships (${response.status})`)
  return Array.isArray(data?.memberships) ? data.memberships : []
}

function Memberships() {
  const [contextType, setContextType] = useState('broker')
  const [contextId, setContextId] = useState('')
  const [corporateId, setCorporateId] = useState('')
  const [policyId, setPolicyId] = useState('')
  const [filterMemberships, setFilterMemberships] = useState([])
  const [memberships, setMemberships] = useState([])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const corporateOptions = useMemo(() => {
    const options = new Map()
    filterMemberships.forEach((membership) => {
      if (membership.corp_id != null) options.set(String(membership.corp_id), getCorporateLabel(membership))
    })
    return [...options.entries()].map(([id, label]) => ({ id, label }))
  }, [filterMemberships])

  const policyOptions = useMemo(() => filterMemberships
    .filter((membership) => corporateId && String(membership.corp_id) === corporateId)
    .map((membership) => ({ id: String(membership.pol_id), label: getPolicyLabel(membership) })), [filterMemberships, corporateId])

  const selectedCorporateMemberships = useMemo(() => filterMemberships
    .filter((membership) => !corporateId || String(membership.corp_id) === corporateId), [filterMemberships, corporateId])
  const enrolmentTotals = useMemo(() => selectedCorporateMemberships.reduce((totals, membership) => {
    const beneficiaries = Array.isArray(membership.beneficiaries) ? membership.beneficiaries : []
    beneficiaries.forEach((beneficiary) => {
      totals.enrolments += 1
      if (String(beneficiary.BenefRelToPriID) === '1') totals.insured += 1
      else totals.dependents += 1
    })
    return totals
  }, { enrolments: 0, insured: 0, dependents: 0 }), [selectedCorporateMemberships])
  const totalPolicies = useMemo(() => new Set(selectedCorporateMemberships.map((membership) => membership.pol_id)).size, [selectedCorporateMemberships])

  const loadMemberships = async (event) => {
    event.preventDefault()
    if (!contextId.trim()) {
      setMemberships([])
      setFilterMemberships([])
      setMessage(`Enter a ${contextType === 'corporate' ? 'Corporate' : 'Broker'} ID to simulate the lookup.`)
      return
    }

    const contextQueryKey = contextType === 'corporate' ? 'corp_id' : 'broker_id'
    const params = new URLSearchParams({ [contextQueryKey]: contextId.trim() })
    if (corporateId) params.set('corp_id', corporateId)
    if (policyId) params.set('pol_id', policyId)

    setIsLoading(true)
    setMessage('')
    try {
      const results = await requestMemberships(params)
      setMemberships(results)
      if (!corporateId && !policyId) setFilterMemberships(results)
      setMessage(results.length ? '' : 'No memberships found for the selected filters.')
    } catch (error) {
      setMemberships([])
      setMessage(error instanceof Error ? error.message : 'Unable to load memberships.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="memberships-page">
      <section className="memberships-card">
        <header><h1>Memberships</h1><p>Use the temporary controls below to simulate the calling-page context.</p></header>
        <form className="membership-filters" onSubmit={loadMemberships}>
          <div className="simulation-block">
            <strong>Simulation context</strong>
            <label>Lookup type
              <select value={contextType} onChange={(event) => { setContextType(event.target.value); setContextId(''); setCorporateId(''); setPolicyId(''); setFilterMemberships([]); setMemberships([]); setMessage('') }}>
                <option value="broker">Broker</option>
                <option value="corporate">Corporate</option>
              </select>
            </label>
            <label>{contextType === 'corporate' ? 'Corporate ID' : 'Broker ID'}
              <input value={contextId} onChange={(event) => { setContextId(event.target.value); setCorporateId(''); setPolicyId(''); setFilterMemberships([]); setMemberships([]); setMessage('') }} inputMode="numeric" placeholder={contextType === 'corporate' ? 'e.g. 1422130' : 'e.g. 3518'} />
            </label>
          </div>
          <label>Corporate
            <select value={corporateId} disabled={isLoading || filterMemberships.length === 0} onChange={(event) => { setCorporateId(event.target.value); setPolicyId('') }}>
              <option value="">Select a corporate</option>
              {corporateOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>
          <label>Policy
            <select value={policyId} disabled={isLoading || !corporateId || filterMemberships.length === 0} onChange={(event) => setPolicyId(event.target.value)}>
              <option value="">{corporateId ? 'All policies' : 'Select a corporate first'}</option>
              {policyOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>
          <button type="submit" disabled={isLoading}>{isLoading ? 'Loading…' : 'Search'}</button>
        </form>
        {filterMemberships.length > 0 && <div className="membership-summary-cards">
          <article><MetricIcon name="enrolments" /><span>Total members</span><strong>{enrolmentTotals.enrolments}</strong></article>
          <article><MetricIcon name="insured" /><span>Total insured</span><strong>{enrolmentTotals.insured}</strong></article>
          <article><MetricIcon name="dependents" /><span>Total dependents</span><strong>{enrolmentTotals.dependents}</strong></article>
          <article><MetricIcon name="policies" /><span>Policies</span><strong>{totalPolicies}</strong></article>
        </div>}
        {message && <p className="memberships-message" role="status">{message}</p>}
      </section>

      {memberships.length > 0 && <section className="membership-results" aria-live="polite">
        <p className="result-count">{memberships.length} memberships found</p>
        {memberships.map((membership) => {
          const beneficiaries = Array.isArray(membership.beneficiaries) ? membership.beneficiaries : []
          return <article className="membership-group" key={`${membership.corp_id}-${membership.pol_id}`}>
            <header><h2>{getCorporateLabel(membership)} · {getPolicyLabel(membership)}</h2><span>{beneficiaries.length} beneficiaries</span></header>
            {beneficiaries.length > 0 ? <div className="beneficiary-scroll"><table className="beneficiary-table"><thead><tr>{beneficiaryColumns.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>{beneficiaries.map((beneficiary, index) => <tr key={beneficiary.BenefUserID || index}>{beneficiaryColumns.map(([field]) => <td key={field}>{beneficiary[field] ?? '—'}</td>)}</tr>)}</tbody></table></div> : <p className="no-beneficiaries">No beneficiaries in this membership.</p>}
          </article>
        })}
      </section>}
    </main>
  )
}

export default Memberships
