import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Bell, RefreshCw, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import client from '../../api/client';
import AnomalyReasons from './AnomalyReasons';
import Recommendations from './Recommendations';
import StatusBadge from '../UI/StatusBadge';

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
  const [expandedId, setExpandedId] = useState(null);
  const prevCriticalCount = useRef(0);

  const fetchAlerts = () => {
    client.get(`/anomalies/?limit=${limit}`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        const criticals = data.filter(a => a.severity === 'CRITICAL' && !a.is_acknowledged);
        if (criticals.length > prevCriticalCount.current) {
          playCriticalBeep();
        }
        prevCriticalCount.current = criticals.length;
        setAlerts(data);
        setLoading(false);
      })
      .catch(() => {
        setAlerts([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlerts();
    const timer = setInterval(fetchAlerts, 3000);
    return () => clearInterval(timer);
  }, [limit]);

  const handleAcknowledge = async (id) => {
    try {
      await client.put(`/anomalies/${id}/acknowledge`);
      setAlerts(prev => (Array.isArray(prev) ? prev : []).map(a => a.id === id ? { ...a, is_acknowledged: true, status: 'acknowledged', acknowledged_at: new Date().toISOString() } : a));
    } catch (e) {
      console.error('Failed to acknowledge alert', e);
    }
  };

  const handleResolve = async (id) => {
    try {
      await client.put(`/anomalies/${id}/resolve`);
      setAlerts(prev => (Array.isArray(prev) ? prev : []).map(a => a.id === id ? { ...a, is_acknowledged: true, status: 'resolved', resolved_at: new Date().toISOString() } : a));
    } catch (e) {
      console.error('Failed to resolve alert', e);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getAlertStatus = (alert) => {
    if (alert.status === 'resolved') return 'resolved';
    if (alert.status === 'acknowledged' || alert.is_acknowledged) return 'acknowledged';
    return 'created';
  };

  const getTimeSince = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const safeAlerts = Array.isArray(alerts) ? alerts : [];

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
        {safeAlerts.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            {loading ? 'Checking anomaly alerts...' : 'No anomaly alerts recorded. All systems operating normally.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '80px 80px 130px 100px 80px 1fr 130px',
              gap: '8px',
              padding: '10px 12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-dim)',
              borderBottom: '1px solid var(--border-color)',
            }}>
              <span>Time</span>
              <span>Agent</span>
              <span>Type</span>
              <span>Severity</span>
              <span>IF Score</span>
              <span>Description</span>
              <span style={{ textAlign: 'right' }}>Status</span>
            </div>

            {safeAlerts.map(alert => {
              const isCritical = alert.severity === 'CRITICAL';
              const isWarning = alert.severity === 'WARNING';
              const isExpanded = expandedId === alert.id;
              const alertStatus = getAlertStatus(alert);
              
              return (
                <div key={alert.id}>
                  <div
                    onClick={() => toggleExpand(alert.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 80px 130px 100px 80px 1fr 130px',
                      gap: '8px',
                      padding: '12px',
                      borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.04)',
                      background: alertStatus === 'resolved'
                        ? 'transparent'
                        : (isCritical ? 'rgba(239, 68, 68, 0.08)' : (isWarning ? 'rgba(245, 158, 11, 0.05)' : 'rgba(59, 130, 246, 0.04)')),
                      borderLeft: isCritical ? '4px solid var(--danger)' : (isWarning ? '4px solid var(--warning)' : '4px solid transparent'),
                      opacity: alertStatus === 'resolved' ? 0.5 : 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderRadius: isExpanded ? '8px 8px 0 0' : '0',
                      alignItems: 'center',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {getTimeSince(alert.created_at)}
                    </span>
                    <span className="mono" style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.78rem' }}>
                      {alert.agent_id}
                    </span>
                    <span>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
                        fontSize: '0.72rem', fontWeight: 600, background: 'rgba(255,255,255,0.06)',
                        color: '#fff', fontFamily: 'var(--font-mono)'
                      }}>
                        {alert.alert_type}
                      </span>
                    </span>
                    <span>
                      <span className={`badge badge-${alert.severity.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                        {alert.severity}
                      </span>
                    </span>
                    <span className="mono" style={{ fontWeight: 700, color: alert.anomaly_score < -0.5 ? 'var(--danger)' : 'var(--text-main)', fontSize: '0.78rem' }}>
                      {alert.anomaly_score ? alert.anomaly_score.toFixed(2) : '-'}
                    </span>
                    <span style={{ color: 'var(--text-main)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {alert.description}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      {alertStatus === 'resolved' ? (
                        <StatusBadge status="resolved" size="sm" />
                      ) : alertStatus === 'acknowledged' ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <StatusBadge status="acknowledged" size="sm" />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleResolve(alert.id); }}
                            className="btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                          >
                            Resolve
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAcknowledge(alert.id); }}
                          className="btn-secondary"
                          style={{ padding: '3px 10px', fontSize: '0.72rem' }}
                        >
                          Acknowledge
                        </button>
                      )}
                      {isExpanded ? <ChevronUp size={14} color="var(--text-dim)" /> : <ChevronDown size={14} color="var(--text-dim)" />}
                    </div>
                  </div>

                  {/* Expandable reasons + recommendations */}
                  {isExpanded && (
                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '0 0 8px 8px',
                      borderLeft: isCritical ? '4px solid var(--danger)' : (isWarning ? '4px solid var(--warning)' : '4px solid transparent'),
                      borderBottom: '1px solid var(--border-color)',
                    }}>
                      <AnomalyReasons alertId={alert.id} expanded={isExpanded} />
                      <Recommendations alertId={alert.id} expanded={isExpanded} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
