// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from '../services/api'; // Use our axios instance

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Login -> save user + token
  const login = (data) => {
    const { user, token } = data;
    setUser(user);
    setToken(token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("authToken", token); // Use 'authToken' to be consistent
    window.location.href = '/'; // Redirect to main page
  };

  // Logout -> clear everything
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    window.location.href = '/login';
  };

  // Auto-fetch latest user details when the app loads with a token
  useEffect(() => {
    if (!token) return;

    const fetchUser = async () => {
      try {
        // Use our api instance which has the correct URL and headers
        const res = await api.get("/auth/user/");
        const data = res.data;

        const stored = localStorage.getItem("user");
        const storedUser = stored ? JSON.parse(stored) : null;
        
        // Only update state if the fetched data is different
        if (JSON.stringify(storedUser) !== JSON.stringify(data)) {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        // If token is invalid, log the user out
        if (err.response && err.response.status === 401) {
            logout();
        }
      }
    };

    fetchUser();
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);