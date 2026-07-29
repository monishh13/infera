import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Settings, FileText, LogOut, Activity, GitCompare, Cpu, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navStyle = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 14px',
  borderRadius: '8px',
  color: isActive ? '#fff' : 'var(--text-muted)',
  background: isActive ? 'var(--primary-glow)' : 'transparent',
  border: isActive ? '1px solid var(--border-highlight)' : '1px solid transparent',
  fontWeight: isActive ? 600 : 500,
  textDecoration: 'none',
  transition: 'all 0.2s ease',
  fontSize: '0.9rem',
});

export default function Sidebar() {
  const { logout, user } = useAuth();

  return (
    <aside style={{
      width: '240px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: 'rgba(11, 15, 25, 0.95)',
      borderRight: '1px solid var(--border-color)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px 16px',
      zIndex: 100
    }}>
      <div>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px 24px 12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px var(--primary-glow)'
          }}>
            <Activity size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>INFERA</h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI Observability</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Section: Main */}
          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 14px 4px', fontWeight: 600 }}>Main</span>

          <NavLink to="/" end style={({ isActive }) => navStyle(isActive)}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/anomalies" style={({ isActive }) => navStyle(isActive)}>
            <AlertTriangle size={18} />
            <span>Anomaly History</span>
          </NavLink>

          <NavLink to="/compare" style={({ isActive }) => navStyle(isActive)}>
            <GitCompare size={18} />
            <span>Compare Agents</span>
          </NavLink>

          {/* Section: System */}
          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '16px 14px 4px', fontWeight: 600 }}>System</span>

          <NavLink to="/architecture" style={({ isActive }) => navStyle(isActive)}>
            <Layers size={18} />
            <span>Architecture</span>
          </NavLink>

          <NavLink to="/settings" style={({ isActive }) => navStyle(isActive)}>
            <Settings size={18} />
            <span>Settings & Injector</span>
          </NavLink>

          <a 
            href="http://localhost:8000/docs" 
            target="_blank" 
            rel="noreferrer" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              fontSize: '0.9rem',
            }}
          >
            <FileText size={18} />
            <span>API Docs</span>
          </a>
        </nav>
      </div>

      {/* User Footer & Logout */}
      <div style={{
        padding: '12px',
        borderRadius: '10px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{user?.username || 'Operator'}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Admin User</p>
        </div>
        <button 
          onClick={logout} 
          title="Logout"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
