import { useState, useEffect, useCallback, useRef, useContext } from 'react'
import ImageScanner from './ImageScanner'
import localforage from 'localforage'
import { AuthContext } from '../contexts/AuthContext'
import { resolveJurisdiction } from '../utils/geocoder'
import * as turf from '@turf/turf'
import './ChallanCalculator.css'

const API_URL = 'http://localhost:5000/api'
const STORAGE_KEY = 'pendingChallans'

const ZONE_MULTIPLIERS = {
  'Standard': 1.0,
  'Construction': 1.2,
  'Hospital': 1.5,
  'School': 2.0
}

const VEHICLE_MULTIPLIERS = {
  'Commercial Vehicle': 2.0,
  'Four-Wheeler': 1.5,
  'Auto-Rickshaw': 1.2,
  'Two-Wheeler': 1.0
}

const computeFinalPenalty = (baseFine, zoneType, driverPoints, vehicleType, aiDetected) => {
  const zoneMultiplier = ZONE_MULTIPLIERS[zoneType] || 1.0;
  const vehicleMultiplier = aiDetected ? (VEHICLE_MULTIPLIERS[vehicleType] || 1.0) : 1.0;
  const historyMultiplier = 1 + (driverPoints * 0.1);
  return Math.round(baseFine * zoneMultiplier * vehicleMultiplier * historyMultiplier);
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];






function ChallanCalculator({ zones = [] }) {
  const { token } = useContext(AuthContext)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  
  const getPendingChallans = async () => {
    try {
      return (await localforage.getItem(STORAGE_KEY)) || []
    } catch {
      return []
    }
  }

  const savePendingChallans = async (arr) => {
    await localforage.setItem(STORAGE_KEY, arr)
  }

  const postChallan = async (challan) => {
    const res = await fetch(`${API_URL}/challans`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(challan),
    })
    if (!res.ok) throw new Error('Server error')
    return res.json()
  }

  const syncPendingChallans = useCallback(async () => {
    const pending = await getPendingChallans()
    if (pending.length === 0) return 0

    try {
      const res = await fetch(`${API_URL}/challans/batch`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ challans: pending }),
      })
      if (res.ok) {
        const synced = pending.length
        await savePendingChallans([])
        return synced
      }
    } catch {
      
    }

    let synced = 0
    const remaining = []
    for (const c of pending) {
      try {
        await postChallan(c)
        synced++
      } catch {
        remaining.push(c)
      }
    }
    await savePendingChallans(remaining)
    return synced
  }, [token])

  
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [selectedViolation, setSelectedViolation] = useState('')

  
  const [aiDetected, setAiDetected] = useState(false)
  const [isRepeatOffense, setIsRepeatOffense] = useState(false)

  
  const [zoneType, setZoneType] = useState('Standard')
  const [driverPoints, setDriverPoints] = useState(0)

  
  const [issuing, setIssuing] = useState(false)
  const [toasts, setToasts] = useState([])
  const toastIdRef = useRef(0)

  
  const showToast = useCallback((type, message, duration = 4000) => {
    const id = ++toastIdRef.current
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  
  useEffect(() => {
    fetch('/data/trafficRules.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load traffic rules data.')
        return res.json()
      })
      .then((json) => {
        setData(json)
        setLoading(false)
        
        
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const { latitude, longitude } = pos.coords;
              const jurisdiction = await resolveJurisdiction(latitude, longitude);
              
              if (jurisdiction) {
                setSelectedCountry(jurisdiction.country);
                setSelectedRegion(jurisdiction.region);
                showToast('success', `Location auto-detected: ${jurisdiction.region}, ${jurisdiction.country}`);
              }
              
              
              if (zones && zones.length > 0) {
                const pt = turf.point([longitude, latitude]);
                for (const zone of zones) {
                  if (turf.booleanPointInPolygon(pt, zone.geojson)) {
                    let newZoneType = 'Standard';
                    if (zone.category === 'School Zone') newZoneType = 'School';
                    else if (zone.category === 'Hospital Zone') newZoneType = 'Hospital';
                    else if (zone.category === 'High-Risk Corridor') newZoneType = 'Construction';
                    
                    setZoneType(newZoneType);
                    showToast('success', `Entered ${zone.category} — higher fines apply.`);
                    break;
                  }
                }
              }
            },
            (err) => {
              console.warn('Geolocation auto-detect failed:', err.message);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        }
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  
  useEffect(() => {
    const handleOnline = async () => {
      const pending = await getPendingChallans()
      if (pending.length === 0) return

      showToast('sync', `Syncing ${pending.length} offline challan${pending.length > 1 ? 's' : ''}…`)
      try {
        const synced = await syncPendingChallans()
        if (synced > 0) {
          showToast('success', `✓ Synced ${synced} challan${synced > 1 ? 's' : ''} to server.`)
        }
      } catch {
        showToast('error', 'Sync failed. Will retry when connection is stable.')
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [showToast, syncPendingChallans])

  
  const countryData = data.find((c) => c.country === selectedCountry)
  const regions = countryData?.regions || []
  
  let regionData = regions.find((r) => r.name === selectedRegion)
  if (selectedCountry === 'India' && selectedRegion && !regionData) {
    regionData = regions.find((r) => r.name === 'National/Default');
  }

  const dropdownRegions = selectedCountry === 'India' ? INDIAN_STATES.map(s => ({name: s})) : regions;
  const vehicleTypes = regionData?.vehicleTypes || []
  const vehicleData = vehicleTypes.find((v) => v.type === selectedVehicle)
  
  
  let violations = vehicleData?.violations || []
  if (aiDetected && selectedVehicle === 'Four-Wheeler') {
    violations = violations.filter(v => 
      !v.name.toLowerCase().includes('helmet') && 
      !v.name.toLowerCase().includes('triple riding')
    );
  }

  const violationData = violations.find((v) => v.name === selectedViolation)
  const currency = countryData?.currency || ''

  
  const handleCountryChange = (e) => {
    setSelectedCountry(e.target.value)
    setSelectedRegion('')
    setSelectedVehicle('')
    setSelectedViolation('')
    setAiDetected(false)
  }

  const handleRegionChange = (e) => {
    setSelectedRegion(e.target.value)
    setSelectedViolation('')
    
  }

  const handleVehicleChange = (e) => {
    setSelectedVehicle(e.target.value)
    setSelectedViolation('')
    setAiDetected(false)
  }

  const handleViolationChange = (e) => {
    setSelectedViolation(e.target.value)
  }

  
  const handleVehicleDetected = useCallback((vehicleType) => {
    if (selectedRegion) {
      const match = vehicleTypes.find((v) => v.type === vehicleType)
      if (match) {
        setSelectedVehicle(vehicleType)
        setSelectedViolation('')
        setAiDetected(true)
      }
    }
  }, [selectedRegion, vehicleTypes])

  
  const handleIssueChallan = async () => {
    if (!violationData || issuing) return

    setIssuing(true)

    let lat = null
    let lng = null
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => reject(new Error('Timeout')), 5000)
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeoutId)
              resolve(pos)
            },
            (err) => {
              clearTimeout(timeoutId)
              reject(err)
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          )
        })
        lat = position.coords.latitude
        lng = position.coords.longitude
      } catch (err) {
        console.warn('Geolocation capture failed or timed out:', err.message)
      }
    }

    const baseFineAmt = isRepeatOffense && violationData.repeatFine ? violationData.repeatFine : violationData.fine;
    const vehicleMultiplier = aiDetected ? (VEHICLE_MULTIPLIERS[selectedVehicle] || 1.0) : 1.0;

    const challanPayload = {
      country: selectedCountry,
      region: selectedRegion,
      vehicleType: selectedVehicle,
      violationCode: violationData.code,
      violationName: violationData.name,
      fineAmount: computeFinalPenalty(baseFineAmt, zoneType, driverPoints, selectedVehicle, aiDetected),
      baseFine: baseFineAmt,
      zoneType,
      driverPoints,
      vehicleMultiplier,
      currency,
      isAiDetected: aiDetected,
      isRepeatOffense,
      lat,
      lng,
      timestamp: new Date().toISOString(),
    }

    if (navigator.onLine) {
      try {
        await postChallan(challanPayload)
        showToast('success', '✓ Challan issued and saved to server.')
      } catch {
        
        const pending = await getPendingChallans()
        pending.push(challanPayload)
        await savePendingChallans(pending)
        showToast('offline', 'Server unreachable. Saved offline — will sync when connected.')
      }
    } else {
      const pending = await getPendingChallans()
      pending.push(challanPayload)
      await savePendingChallans(pending)
      showToast('offline', 'Saved offline. Will sync when connected.')
    }

    setIssuing(false)
  }

  
  const formatFine = (amount, curr) => {
    try {
      const locale = curr === 'INR' ? 'en-IN' : curr === 'EUR' ? 'de-DE' : 'en-US'
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: curr,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    } catch {
      return `${curr} ${amount}`
    }
  }

  

  if (loading) {
    return (
      <div className="challan-calculator">
        <div className="challan-loading">
          <div className="challan-spinner" />
          <p>Loading traffic rules…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="challan-calculator">
        <div className="challan-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="challan-calculator">
      
      {toasts.length > 0 && (
        <div className="toast-container" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast--${t.type}`}>
              <span className="toast-icon">
                {t.type === 'success' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {t.type === 'offline' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
                    <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
                    <path d="M10.71 5.05A16 16 0 0122.56 9" />
                    <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
                    <path d="M8.53 16.11a6 6 0 016.95 0" />
                    <line x1="12" y1="20" x2="12.01" y2="20" />
                  </svg>
                )}
                {t.type === 'sync' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                  </svg>
                )}
                {t.type === 'error' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                )}
              </span>
              <span className="toast-message">{t.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="challan-header">
        <div className="challan-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
        </div>
        <h2>Challan Calculator</h2>
        <p className="challan-desc">Select your location and violation to see the applicable fine.</p>
      </div>

      
      <ImageScanner onVehicleDetected={handleVehicleDetected} />

      <div className="challan-divider">
        <span className="divider-line" />
        <span className="divider-text">or select manually</span>
        <span className="divider-line" />
      </div>

      <div className="challan-form">
        
        <div className="challan-field">
          <label htmlFor="challan-country">Country</label>
          <div className="select-wrapper">
            <select
              id="challan-country"
              value={selectedCountry}
              onChange={handleCountryChange}
              aria-required="true"
              aria-label="Select country"
            >
              <option value="">Select Country</option>
              {data.map((c) => (
                <option key={c.country} value={c.country}>
                  {c.country}
                </option>
              ))}
            </select>
            <span className="select-chevron" />
          </div>
        </div>

        
        <div className="challan-field">
          <label htmlFor="challan-region">Region</label>
          <div className="select-wrapper">
            <select
              id="challan-region"
              value={selectedRegion}
              onChange={handleRegionChange}
              disabled={!selectedCountry}
              aria-required="true"
              aria-label="Select region or state"
            >
              <option value="">
                {selectedCountry ? 'Select Region' : '— Select Country first —'}
              </option>
              {(selectedCountry === 'India' ? INDIAN_STATES : regions.map(r => r.name)).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <span className="select-chevron" />
          </div>
        </div>

        
        <div className="challan-field">
          <label htmlFor="challan-vehicle">
            Vehicle Type
            {aiDetected && selectedVehicle && (
              <span className="ai-badge">AI</span>
            )}
          </label>
          <div className="select-wrapper">
            <select
              id="challan-vehicle"
              value={selectedVehicle}
              onChange={handleVehicleChange}
              disabled={!selectedRegion}
              aria-required="true"
              aria-label="Select vehicle type"
            >
              <option value="">
                {selectedRegion ? 'Select Vehicle Type' : '— Select Region first —'}
              </option>
              {vehicleTypes.map((v) => (
                <option key={v.type} value={v.type}>
                  {v.type}
                </option>
              ))}
            </select>
            <span className="select-chevron" />
          </div>
        </div>

        
        <div className="challan-field">
          <label htmlFor="challan-violation">Violation</label>
          <div className="select-wrapper">
            <select
              id="challan-violation"
              value={selectedViolation}
              onChange={handleViolationChange}
              disabled={!selectedVehicle}
              aria-required="true"
              aria-label="Select violation type"
            >
              <option value="">
                {selectedVehicle ? 'Select Violation' : '— Select Vehicle Type first —'}
              </option>
              {violations.map((v) => (
                <option key={v.code + v.name} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
            <span className="select-chevron" />
          </div>
        </div>
        
        
        <div className="challan-field">
          <label htmlFor="challan-zone">Violation Zone Context</label>
          <div className="select-wrapper">
            <select
              id="challan-zone"
              value={zoneType}
              onChange={(e) => setZoneType(e.target.value)}
              aria-label="Select zone context"
            >
              <option value="Standard">Standard Area (1.0x)</option>
              <option value="Construction">Construction Zone (1.2x)</option>
              <option value="Hospital">Hospital Zone (1.5x)</option>
              <option value="School">School Zone (2.0x)</option>
            </select>
            <span className="select-chevron" />
          </div>
        </div>

        
        <div className="challan-field">
          <label htmlFor="challan-points">Offender Penalty Points</label>
          <input
            type="number"
            id="challan-points"
            min="0"
            max="20"
            value={driverPoints}
            onChange={(e) => setDriverPoints(parseInt(e.target.value) || 0)}
            className="points-input"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--accent, #f97316)', backgroundColor: 'var(--accent, #f97316)', color: 'var(--accent-on, #ffffff)', fontSize: '1rem', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      
      {violationData && (
        <div className="result-card" key={violationData.code + violationData.name} role="region" aria-live="polite" aria-label="Violation details and fine calculation">
          <div className="result-header">
            <span className="result-badge">Violation Details</span>
          </div>

          <div className="result-body">
            <h3 className="result-name">{violationData.name}</h3>

            <div className="result-meta">
              <div className="result-meta-item" style={{ width: '100%', flex: '1 1 100%' }}>
                <span className="result-label">Official Legal Citation</span>
                <span className="result-value code-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                  {violationData.code}
                </span>
              </div>
              <div className="result-meta-item">
                <span className="result-label">Country</span>
                <span className="result-value">{selectedCountry}</span>
              </div>
            </div>

            <p className="result-description" style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '0.75rem' }}>{violationData.description}</p>

            <div className="result-fine">
              <span className="fine-label">Total Payable Amount</span>
              <span className="fine-amount">
                {formatFine(computeFinalPenalty(isRepeatOffense && violationData.repeatFine ? violationData.repeatFine : violationData.fine, zoneType, driverPoints, selectedVehicle, aiDetected), currency)}
              </span>
            </div>
            
            <div className="penalty-breakdown" style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px', textAlign: 'left', lineHeight: '1.5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Statutory Fine (MVA):</span>
                <strong>{formatFine(isRepeatOffense && violationData.repeatFine ? violationData.repeatFine : violationData.fine, currency)}</strong>
              </div>
              {zoneType !== 'Standard' && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Zone Surcharge ({zoneType}):</span>
                  <span>{ZONE_MULTIPLIERS[zoneType]?.toFixed(1)}x</span>
                </div>
              )}
              {aiDetected && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Vehicle Admin/Towing Surcharge:</span>
                  <span>{(VEHICLE_MULTIPLIERS[selectedVehicle] || 1.0).toFixed(1)}x</span>
                </div>
              )}
              {driverPoints > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Habitual Offender Risk Premium:</span>
                  <span>+{Math.round(driverPoints * 10)}%</span>
                </div>
              )}
            </div>

            
            <div className="repeat-offense-toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 0', marginTop: '0.25rem' }}>
              <label htmlFor="repeat-offense" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary, #94a3b8)' }}>
                <input
                  type="checkbox"
                  id="repeat-offense"
                  checked={isRepeatOffense}
                  onChange={(e) => setIsRepeatOffense(e.target.checked)}
                  aria-label="Mark as repeat offense for higher penalty"
                  style={{ width: '1.1rem', height: '1.1rem', accentColor: '#f59e0b', cursor: 'pointer' }}
                />
                Repeat Offense
              </label>
              {isRepeatOffense && (
                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontStyle: 'italic' }}>Higher penalty applied</span>
              )}
            </div>

            
            <button
              className="issue-challan-btn"
              onClick={handleIssueChallan}
              disabled={issuing}
              id="issue-challan-btn"
              aria-label={issuing ? 'Issuing challan, please wait' : 'Issue challan for selected violation'}
            >
              {issuing ? (
                <>
                  <div className="btn-spinner" />
                  Issuing…
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                    <path d="M9 14l2 2 4-4" />
                  </svg>
                  Issue Challan
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChallanCalculator
