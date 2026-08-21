const LOCAL_API_KEY = '82a10bc21e8699fc96dd9fe6f83d810127b9aa363a6a8adc4a0b330c24d0244f'
const UAT_API_KEY = 'KAtWQBHV1096TuH8JTzLxdQvNqFxrUAOWJ3ElF9w1sIEqoyj8rCTeFtIRGflIQ6oi6eGIAWzPa5JE4nOwQElgZMUfQ4AtsxsZvBciHGKc5GWBmEMZ1ybZcigfZwvDf3C'
const PRODUCTION_API_KEY = 'QHD5MX9F5aRmcNvF09HGOvQsoyCu9izGxZXxTtKEeG58GuvB1dUCtiRttaIdFq4eYKHJgCgJ99Wrg7zTUcA1r8bgksMJDYvFW0E2GiTyrIdLRTjU3WBgh4sRJ8JiipmX'

export function getApiConfig(hostname = window.location.hostname) {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return { apiBaseUrl: 'http://localhost:8181/api', apiKey: LOCAL_API_KEY }
  if (host.includes('uat-')) return { apiBaseUrl: 'https://uat-lawton-dx.lawtonasia.com/api', apiKey: UAT_API_KEY }
  if (host.includes('corporate') || host.includes('partner')) return { apiBaseUrl: 'https://prod-lawton-dx.lawtonasia.com/api', apiKey: PRODUCTION_API_KEY }
  return { apiBaseUrl: 'https://uat-lawton-dx.lawtonasia.com/api', apiKey: UAT_API_KEY }
}
