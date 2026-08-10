import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import client from '../../api/client';
import AnomalyReasons from './AnomalyReasons';
import Recommendations from './Recommendations';
import StatusBadge from '../UI/StatusBadge';
import SectionHeader from '../UI/SectionHeader';

function playCriticalBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    // Ignore audio context errors if blocked by browser
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
    <div className="glass-panel" style={{ padding: 'var(--space-4)' }}>
      <SectionHeader
        title="Anomaly Events"
        description="Isolation Forest anomaly triggers and threshold events"
        action={
          <button
            onClick={fetchAlerts}
            className="btn-secondary"
            style={{ padding: '3px 8px', fontSize: '11px' }}
          >
            <RefreshCw size={11} /> Refresh
          </button>
        }
      />

      <div style={{ overflowX: 'auto', marginTop: 'var(--space-2)' }}>
        {safeAlerts.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748B', fontSize: 'var(--font-size-base)', fontWeight: 500 }}>
            {loading ? 'Scanning telemetry events...' : 'No anomaly events recorded. Systems operating normally.'}
          </div>
        ) : (
          <table className="obs-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Detected</th>
                <th style={{ width: '80px' }}>Agent</th>
                <th>Event Type</th>
                <th>Severity</th>
                <th>IF Score</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Status / Action</th>
              </tr>
            </thead>
            <tbody>
              {safeAlerts.map(alert => {
                const isCritical = alert.severity === 'CRITICAL';
                const isWarning = alert.severity === 'WARNING';
                const isExpanded = expandedId === alert.id;
                const alertStatus = getAlertStatus(alert);

                return (
                  <React.Fragment key={alert.id}>
                    <tr
                      onClick={() => toggleExpand(alert.id)}
                      style={{
                        cursor: 'pointer',
                        background: alertStatus === 'resolved'
                          ? 'transparent'
                          : (isCritical ? 'rgba(220, 38, 38, 0.04)' : (isWarning ? 'rgba(217, 119, 6, 0.03)' : 'transparent')),
                        borderLeft: isCritical ? '3px solid var(--accent-red)' : (isWarning ? '3px solid var(--accent-amber)' : '3px solid transparent'),
                        opacity: alertStatus === 'resolved' ? 0.6 : 1,
                      }}
                    >
                      <td className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {getTimeSince(alert.created_at)}
                      </td>
                      <td className="mono" style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '11px' }}>
                        {alert.agent_id}
                      </td>
                      <td>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                          {alert.alert_type}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={alert.severity} size="sm" />
                      </td>
                      <td className="mono" style={{ fontWeight: 600, color: alert.anomaly_score < -0.5 ? 'var(--accent-red)' : 'var(--text-primary)', fontSize: '11px' }}>
                        {alert.anomaly_score ? alert.anomaly_score.toFixed(2) : '-'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {alert.description}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          {alertStatus === 'resolved' ? (
                            <StatusBadge status="resolved" size="sm" />
                          ) : alertStatus === 'acknowledged' ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <StatusBadge status="acknowledged" size="sm" />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleResolve(alert.id); }}
                                className="btn-secondary"
                                style={{ padding: '2px 6px', fontSize: '10px' }}
                              >
                                Resolve
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAcknowledge(alert.id); }}
                              className="btn-secondary"
                              style={{ padding: '2px 6px', fontSize: '10px' }}
                            >
                              Acknowledge
                            </button>
                          )}
                          {isExpanded ? <ChevronUp size={12} color="var(--text-tertiary)" /> : <ChevronDown size={12} color="var(--text-tertiary)" />}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Root Cause & Recommendations */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ padding: 0, borderBottom: '1px solid var(--border-default)', background: 'var(--surface-2)' }}>
                          <AnomalyReasons alertId={alert.id} expanded={isExpanded} />
                          <Recommendations alertId={alert.id} expanded={isExpanded} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
