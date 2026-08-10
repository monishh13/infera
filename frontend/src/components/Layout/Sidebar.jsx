import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  AlertTriangle,
  Settings,
  FileText,
  LogOut,
  Activity,
  GitCompare,
  Layers,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { section: 'MAIN' },
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/anomalies', label: 'Anomaly History', icon: AlertTriangle },
  { path: '/compare', label: 'Compare Agents', icon: GitCompare },
  { section: 'SYSTEM' },
  { path: '/architecture', label: 'Architecture', icon: Layers },
  { path: '/settings', label: 'Settings & Injector', icon: Settings },
  { path: 'http://localhost:8000/docs', label: 'API Docs', icon: FileText, external: true },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'var(--space-4) var(--space-3)',
        zIndex: 100,
        userSelect: 'none',
      }}
    >
      <div>
        {/* Brand Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-2) var(--space-5) var(--space-2)',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-primary-soft)',
              border: '1px solid var(--accent-primary-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Activity size={14} color="var(--accent-primary)" />
          </div>
          <div>
            <h1
              style={{
                fontSize: 'var(--font-size-md)',
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: 'var(--text-primary)',
                lineHeight: 1.1,
              }}
            >
              INFERA
            </h1>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                display: 'block',
              }}
            >
              AI Agent Observability
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map((item) => {
            if (item.section) {
              return (
                <div
                  key={`section-${item.section}`}
                  style={{
                    padding: 'var(--space-3) var(--space-2) 2px var(--space-2)',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {item.section}
                </div>
              );
            }

            const Icon = item.icon;

            if (item.external) {
              return (
                <a
                  key={item.path}
                  href={item.path}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    fontSize: 'var(--font-size-base)',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'var(--surface-2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Icon size={15} color="var(--text-tertiary)" />
                  <span>{item.label}</span>
                </a>
              );
            }

            const isActive = item.end
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path) && item.path !== '/';

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 'var(--font-size-base)',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--accent-primary-soft)',
                      border: '1px solid var(--accent-primary-border)',
                      zIndex: 0,
                    }}
                  />
                )}

                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
                  <Icon
                    size={15}
                    color={isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)'}
                  />
                </span>

                <span style={{ position: 'relative', zIndex: 1 }}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Operator User Footer */}
      <div
        style={{
          padding: 'var(--space-2) var(--space-3)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-2)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <User size={13} color="var(--text-secondary)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2,
              }}
            >
              {user?.username || 'Operator'}
            </p>
            <p style={{ fontSize: '9px', color: 'var(--text-tertiary)', lineHeight: 1.2 }}>
              Admin
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign Out"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            padding: '3px',
            borderRadius: 'var(--radius-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-red)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
