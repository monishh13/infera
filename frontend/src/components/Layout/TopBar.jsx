import React, { useState, useEffect } from 'react';
import { Play, Square, Activity, Bell } from 'lucide-react';
import client from '../../api/client';

export default function TopBar({ title }) {
  const [simRunning, setSimRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkSimStatus = () => {
    client.get('/simulator/status')
      .then(res => setSimRunning(res.data.running))
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

  return (
    <header style={{
      height: '70px',
      marginLeft: '240px',
      padding: '0 32px',
      background: 'rgba(11, 15, 25, 0.8)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{title || 'Dashboard'}</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Simulator Toggle Button */}
        <button
          onClick={toggleSimulator}
          disabled={loading}
          className={simRunning ? "btn-danger" : "btn-primary"}
          style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          {simRunning ? <Square size={16} /> : <Play size={16} />}
          <span>{simRunning ? 'Stop Telemetry Stream' : 'Start Telemetry Stream'}</span>
        </button>

        {/* Live Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '9999px',
          background: simRunning ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
          border: simRunning ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(107, 114, 128, 0.3)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: simRunning ? 'var(--success)' : 'var(--text-dim)'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: simRunning ? 'var(--success)' : 'var(--text-dim)',
            boxShadow: simRunning ? '0 0 10px var(--success)' : 'none'
          }} />
          <span>{simRunning ? 'SIMULATOR LIVE' : 'SIMULATOR IDLE'}</span>
        </div>
      </div>
    </header>
  );
}
