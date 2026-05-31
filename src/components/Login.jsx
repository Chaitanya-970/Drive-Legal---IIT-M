import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

function Login() {
  const [email, setEmail] = useState('admin@drivelegal.in');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Failed to login. Check your credentials.');
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafaf8', padding: '1rem', boxSizing: 'border-box' }}>
      <div style={{ background: '#fafaf8', padding: 'clamp(1.5rem, 5vw, 2.5rem)', width: '100%', maxWidth: '400px', border: '1px solid #d4d4d2', boxSizing: 'border-box' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#737373', marginBottom: '0.75rem' }}>AUTHORIZED ACCESS</div>
          <h2 style={{ color: '#0a0a0a', margin: 0, fontSize: '2rem', fontWeight: '700', fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>DriveLegal</h2>
          <p style={{ color: '#737373', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Authorized Officer Login</p>
        </div>

        {error && (
          <div style={{ background: '#fafaf8', color: '#FF6B35', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.875rem', border: '1px solid #FF6B35' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', color: '#0a0a0a', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: '500', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.875rem', background: '#fafaf8', border: '1px solid #d4d4d2', color: '#0a0a0a', outline: 'none', fontSize: '1rem', fontFamily: 'inherit' }} 
              placeholder="officer@drivelegal.gov"
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#0a0a0a', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: '500', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.875rem', background: '#fafaf8', border: '1px solid #d4d4d2', color: '#0a0a0a', outline: 'none', fontSize: '1rem', fontFamily: 'inherit' }} 
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ marginTop: '0.5rem', padding: '0.875rem', background: '#FF6B35', color: '#ffffff', border: 'none', fontSize: '0.8rem', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, transition: 'opacity 0.2s', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#737373', borderTop: '1px solid #d4d4d2', paddingTop: '1rem', fontFamily: "'JetBrains Mono', monospace" }}>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#0a0a0a' }}>DEMO / OFFLINE ACCESS</div>
          <div style={{ fontSize: '0.75rem', color: '#737373' }}>
            Email: <code style={{ background: '#eaeaea', padding: '0.1rem 0.3rem', borderRadius: '2px', color: '#0a0a0a' }}>admin@drivelegal.in</code>
            <br />
            Password: <code style={{ background: '#eaeaea', padding: '0.1rem 0.3rem', borderRadius: '2px', color: '#0a0a0a' }}>admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
