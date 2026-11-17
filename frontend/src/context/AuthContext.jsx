import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { AuthContext } from './useAuth';

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [user, setUser] = useState(readStoredUser);

  const login = useCallback(({ token: newToken, user: newUser }) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('auth/logout/');
    } catch {
      // The token may already be invalid; signing out locally is enough.
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // Refresh the profile (name, picture) whenever the app opens with a token.
  useEffect(() => {
    if (!token) return;
    api
      .get('auth/user/')
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      })
      .catch((err) => console.error('Could not load profile:', err));
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
