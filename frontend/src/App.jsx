// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import WelcomePage from './pages/WelcomePage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login Page Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Main Application Routes (Protected) */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Default page shown inside the layout */}
          <Route index element={<WelcomePage />} /> 
          
          {/* Page for a specific chat */}
          <Route path="chats/:chatId" element={<ChatPage />} />
        </Route>

        {/* Optional: A catch-all route to redirect unknown paths */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;