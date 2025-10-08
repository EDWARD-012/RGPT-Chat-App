import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();

  if (!token) {
    // If no token, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  return children;
};