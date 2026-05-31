import { createContext, useState, useEffect } from 'react';
import localforage from 'localforage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = await localforage.getItem('authToken');
        const storedUser = await localforage.getItem('authUser');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (err) {
        console.error('Error loading auth from localforage', err);
      } finally {
        setLoading(false);
      }
    };
    loadAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        
        
        await localforage.setItem('authToken', data.token);
        await localforage.setItem('authUser', data.user);
        
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      
      if (email === 'admin@drivelegal.in' && password === 'admin123') {
        const dummyUser = { id: 'offline-officer-id', email, role: 'admin' };
        const dummyToken = 'offline-mock-jwt-token';
        
        setToken(dummyToken);
        setUser(dummyUser);
        
        await localforage.setItem('authToken', dummyToken);
        await localforage.setItem('authUser', dummyUser);
        
        return { success: true, isOfflineMode: true };
      }
      return { success: false, error: 'Network error or server unreachable. Use admin@drivelegal.in / admin123 for offline access.' };
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    
    
    await localforage.removeItem('authToken');
    await localforage.removeItem('authUser');
    
    try {
      await fetch('http://localhost:5000/api/auth/logout');
    } catch (err) {
      
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
