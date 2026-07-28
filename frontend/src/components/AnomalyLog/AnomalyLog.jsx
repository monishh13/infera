import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Bell, RefreshCw } from 'lucide-react';
import client from '../../api/client';

// Web Audio API beep generator for CRITICAL alerts
function playCriticalBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Ignore audio context errors if browser blocks auto-play
  }
}

export default function AnomalyLog({ limit = 20 }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevCriticalCount = useRef(0);

  const fetchAlerts = () => {
    client.get(`/anomalies/?limit=${limit}`)
      .then(res => {
        const data = res.data;
        const criticals = data.filter(a => a.severity === 'CRITICAL' && !a.is_acknowledged);
        if (criticals.length > prevCriticalCount.current) {
          playCriticalBeep();
        }
        prevCriticalCount.current = criticals.length;
        setAlerts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
    const timer = setInterval(fetchAlerts, 3000);
    return () => clearInterval(timer);
  }, [limit]);

  const handleAcknowledge = async (id) => {
    try {
      await client.put(`/anomalies/${id}/acknowledge`);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_acknowledged: true } : a));
    } catch (e) {
      console.error('Failed to acknowledge alert', e);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="var(--warning)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Live Anomaly Detection Log</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            Unsupervised Isolation Forest + threshold alert triggers
          </p>
        </div>

        <button 
          onClick={fetchAlerts}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        {alerts.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            {loading ? 'Checking anomaly alerts...' : 'No anomaly alerts recorded. All systems operating normally.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Time</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Agent ID</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Severity</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>IF Score</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Description</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(alert => {
                const isCritical = alert.severity === 'CRITICAL';
                const isWarning = alert.severity === 'WARNING';
                
                return (
                  <tr 
                    key={alert.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: alert.is_acknowledged 
                        ? 'transparent' 
                        : (isCritical ? 'rgba(239, 68, 68, 0.08)' : (isWarning ? 'rgba(245, 158, 11, 0.05)' : 'rgba(59, 130, 246, 0.04)')),
                      borderLeft: isCritical ? '4px solid var(--danger)' : (isWarning ? '4px solid var(--warning)' : '4px solid transparent'),
                      opacity: alert.is_acknowledged ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <td className="mono" style={{ padding: '12px', color: 'var(--text-muted)' }}>
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </td>
                    <td className="mono" style={{ padding: '12px', fontWeight: 600, color: 'var(--primary)' }}>
                      {alert.agent_id}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'rgba(255,255,255,0.06)',
                        color: '#fff',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {alert.alert_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge badge-${alert.severity.toLowerCase()}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="mono" style={{ padding: '12px', fontWeight: 700, color: alert.anomaly_score < -0.5 ? 'var(--danger)' : 'var(--text-main)' }}>
                      {alert.anomaly_score ? alert.anomaly_score.toFixed(2) : '-'}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-main)', maxWidth: '300px' }}>
                      {alert.description}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {alert.is_acknowledged ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> Ack'd
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Acknowledge
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
