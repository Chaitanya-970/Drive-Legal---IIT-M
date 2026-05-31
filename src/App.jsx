import { useState, useEffect, useContext } from 'react'
import './App.css'
import ChallanCalculator from './components/ChallanCalculator'
import FineChecker from './components/FineChecker'
import LegalBot from './components/LegalBot'
import Login from './components/Login'
import GeofenceMap from './components/GeofenceMap'
import MapDashboard from './components/MapDashboard'
import { AuthContext } from './contexts/AuthContext'

function App() {
  const { user, loading, logout } = useContext(AuthContext)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [currentView, setCurrentView] = useState('calculator')
  const [zones, setZones] = useState([])

  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])
  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafaf8', color: '#0a0a0a', fontFamily: 'Georgia, serif', fontSize: '1.25rem', letterSpacing: '-0.01em' }}>Loading DriveLegal...</div>
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="app">
      <header className="app-header">
        {isOffline && (
          <div className="status-badge" role="status" aria-live="polite">
            <span className="status-dot"></span>
            Offline Mode Active
          </div>
        )}
        <div className="app-header-top">
          <div>
            <h1 className="app-title">DriveLegal</h1>
            <p className="app-subtitle">Traffic Laws &amp; Challan Calculator</p>
          </div>
          <button onClick={logout} className="logout-btn" style={{ background: 'transparent', color: '#FF6B35', border: '1px solid #FF6B35', padding: '0.35rem 0.75rem', borderRadius: '0', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'var(--mono)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: '500' }}>Log Out</button>
        </div>
        
        <div className="app-header-tabs">
           <button onClick={() => setCurrentView('calculator')} style={{ background: 'none', border: 'none', color: currentView === 'calculator' ? '#FF6B35' : '#737373', fontWeight: currentView === 'calculator' ? '600' : '400', cursor: 'pointer', borderBottom: currentView === 'calculator' ? '2px solid #FF6B35' : '2px solid transparent', padding: '0.5rem 1rem', fontFamily: 'var(--mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Calculator</button>
           <button onClick={() => setCurrentView('finechecker')} style={{ background: 'none', border: 'none', color: currentView === 'finechecker' ? '#FF6B35' : '#737373', fontWeight: currentView === 'finechecker' ? '600' : '400', cursor: 'pointer', borderBottom: currentView === 'finechecker' ? '2px solid #FF6B35' : '2px solid transparent', padding: '0.5rem 1rem', fontFamily: 'var(--mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Check Fines</button>
           <button onClick={() => setCurrentView('map')} style={{ background: 'none', border: 'none', color: currentView === 'map' ? '#FF6B35' : '#737373', fontWeight: currentView === 'map' ? '600' : '400', cursor: 'pointer', borderBottom: currentView === 'map' ? '2px solid #FF6B35' : '2px solid transparent', padding: '0.5rem 1rem', fontFamily: 'var(--mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Geo-Zones</button>
           <button onClick={() => setCurrentView('dashboard')} style={{ background: 'none', border: 'none', color: currentView === 'dashboard' ? '#FF6B35' : '#737373', fontWeight: currentView === 'dashboard' ? '600' : '400', cursor: 'pointer', borderBottom: currentView === 'dashboard' ? '2px solid #FF6B35' : '2px solid transparent', padding: '0.5rem 1rem', fontFamily: 'var(--mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Admin Dashboard</button>
        </div>
      </header>

      <main className="app-main">
        {currentView === 'calculator' && (
          <>
            <ChallanCalculator zones={zones} />

        <div className="hero-card">
          <div className="hero-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 14l2 2 4-4" />
            </svg>
          </div>
          <p className="hero-text">
            Look up location-specific traffic laws, calculate challans, and understand violations — all without an internet connection.
          </p>
        </div>

        <div className="features-grid">
          <div 
            className="feature-card" 
            onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} 
            style={{cursor: 'pointer'}}
            role="button"
            tabIndex={0}
          >
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="10" r="3" />
                <path d="M12 2a8 8 0 00-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 00-8-8z" />
              </svg>
            </div>
            <h3>Geo-Fenced Lookup</h3>
            <p>State &amp; city-specific traffic rules and compounding fees</p>
          </div>

          <div 
            className="feature-card" 
            onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} 
            style={{cursor: 'pointer'}}
            role="button"
            tabIndex={0}
          >
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <h3>Challan Calculator</h3>
            <p>Instant fine calculation by violation &amp; vehicle type</p>
          </div>

          <div 
            className="feature-card" 
            onClick={() => window.dispatchEvent(new CustomEvent('open-legalbot'))} 
            style={{cursor: 'pointer'}}
            role="button"
            tabIndex={0}
          >
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h3>AI Chatbot</h3>
            <p>Ask traffic law questions in plain language</p>
          </div>

          <div 
            className="feature-card" 
            onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} 
            style={{cursor: 'pointer'}}
            role="button"
            tabIndex={0}
          >
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3>Multi-Country</h3>
            <p>Extensible across national &amp; regional jurisdictions</p>
          </div>
        </div>
          </>
        )}
        
        {currentView === 'finechecker' && <FineChecker />}
        {currentView === 'map' && <GeofenceMap center={[28.6139, 77.2090]} validChallans={[]} zones={zones} setZones={setZones} />}
        {currentView === 'dashboard' && <MapDashboard />}
      </main>

      <footer className="app-footer">
        <p>Drive Legal by Git Gud . iit madras . road safety hackathon 2026</p>
      </footer>

      <LegalBot />
    </div>
  )
}

export default App