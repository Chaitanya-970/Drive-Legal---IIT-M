import { useState, useCallback } from 'react'
import './FineChecker.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function FineChecker() {
  const [registration, setRegistration] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleCheck = async (e) => {
    e.preventDefault()
    if (!registration.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`${API_URL}/fines/check?registration=${encodeURIComponent(registration.trim())}`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to check fines')
      }

      
      

      setResult(data)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getSourceBadgeText = () => {
    return 'Simulated Traffic Database'
  }

  return (
    <div className="fine-checker">
      <div className="fc-header">
        <h2 className="fc-title">E-Challan Verification</h2>
        <p className="fc-subtitle">Instantly check pending traffic fines across India</p>
      </div>

      <form className="fc-form" onSubmit={handleCheck}>
        <div className="fc-input-group">
          <label htmlFor="reg-input" className="fc-label">Vehicle Registration Number</label>
          <div className="fc-input-wrapper">
            <input
              id="reg-input"
              className="fc-input"
              type="text"
              placeholder="e.g. KA01AB1234"
              value={registration}
              onChange={(e) => setRegistration(e.target.value.toUpperCase())}
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="fc-button" 
          disabled={loading || registration.trim().length < 4}
        >
          {loading ? (
            <>
              <div className="fc-spinner" />
              Searching...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Check Fines
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="fc-error">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="fc-results">
          <div className={`fc-source-badge ${result.live ? 'fc-source-live' : 'fc-source-mock'}`}>
            {getSourceBadgeText()}
          </div>

          {!result.data || !result.data.ChallanDetails || result.data.ChallanDetails.length === 0 ? (
            <div className="fc-status-message fc-status-success">
              <svg style={{margin: '0 auto 1rem', display: 'block'}} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              No pending fines found for {registration}. 
            </div>
          ) : (
            <div className="fc-challan-list">
              <h3 style={{marginBottom: '0.5rem', color: '#334155'}}>
                Pending Fines ({result.data.ChallanDetails.length})
              </h3>
              {result.data.ChallanDetails.map((challan, i) => (
                <div className="fc-challan-card" key={i}>
                  <div className="fc-challan-info">
                    <span className="fc-c-number">{challan.ChallanNumber}</span>
                    <span className="fc-c-offense">{challan.OffenseDetails || 'Traffic Violation'}</span>
                    <div className="fc-c-meta">
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {challan.OffenseDate} {challan.OffenseTime}
                      </span>
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {challan.Location || 'Check Notice'}
                      </span>
                    </div>
                  </div>
                  <div className="fc-challan-amount">
                    <span className="fc-amount-value">{formatCurrency(challan.FineAmount)}</span>
                    <span className="fc-amount-status">{challan.Status || 'Pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
