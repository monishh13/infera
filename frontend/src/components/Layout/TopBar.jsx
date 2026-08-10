import React, { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import client from '../../api/client';
import LiveIndicator from '../UI/LiveIndicator';

export default function TopBar({ title, description }) {
  const [simRunning, setSimRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkSimStatus = () => {
    client
      .get('/simulator/status')
      .then((res) => setSimRunning(res.data.running))
      .catch(() => {});
  };

  useEffect(() => {
    checkSimStatus();
    const interval = setInterval(checkSimStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const toggleSimulator = async () => {
    setLoading(true);
    try {
      if (simRunning) {
        await client.post('/simulator/stop');
        setSimRunning(false);
      } else {
        await client.post('/simulator/start');
        setSimRunning(true);
      }
    } catch (err) {
      console.error('Simulator toggle error:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayTitle = (title === 'Observability Command Center' || title === 'Observability Console') ? 'Overview' : (title || 'Overview');
  const displaySubtitle = description || 'Monitor AI agent execution, reliability, cost, and anomalies.';

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        marginLeft: 'var(--sidebar-width)',
        padding: '0 var(--space-6)',
        background: 'var(--bg-base)',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        userSelect: 'none',
      }}
    >
      {/* SaaS Page Title & Context */}
      <div>
        <h2
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          {displayTitle}
        </h2>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-tertiary)',
            marginTop: '2px',
          }}
        >
          {displaySubtitle}
        </p>
      </div>

      {/* Operational Telemetry Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-sm)',
            background: simRunning ? 'var(--accent-green-soft)' : 'var(--surface-2)',
            border: simRunning ? '1px solid rgba(22, 163, 74, 0.2)' : '1px solid var(--border-default)',
          }}
        >
          <LiveIndicator active={simRunning} color="var(--accent-green)" size={5} />
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: simRunning ? 'var(--accent-green)' : 'var(--text-secondary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {simRunning ? 'Telemetry Live' : 'Stream Idle'}
          </span>
        </div>

        {/* Start / Stop Button */}
        <button
          onClick={toggleSimulator}
          disabled={loading}
          className={simRunning ? 'btn-danger' : 'btn-primary'}
          style={{
            padding: '5px 12px',
            fontSize: 'var(--font-size-base)',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {simRunning ? <Square size={12} /> : <Play size={12} />}
          <span>{loading ? 'Updating...' : simRunning ? 'Stop Stream' : 'Start Stream'}</span>
        </button>
      </div>
    </header>
  );
}
