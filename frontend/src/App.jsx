import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AgentDetail from './pages/AgentDetail';
import AnomalyHistory from './pages/AnomalyHistory';
import Settings from './pages/Settings';
import SessionDetail from './pages/SessionDetail';
import Architecture from './pages/Architecture';
import AgentComparison from './pages/AgentComparison';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', color: 'var(--text-dim)' }}>
        Initializing Infera Platform...
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/agents/:id" element={<ProtectedRoute><AgentDetail /></ProtectedRoute>} />
          <Route path="/sessions/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
          <Route path="/anomalies" element={<ProtectedRoute><AnomalyHistory /></ProtectedRoute>} />
          <Route path="/architecture" element={<ProtectedRoute><Architecture /></ProtectedRoute>} />
          <Route path="/compare" element={<ProtectedRoute><AgentComparison /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
