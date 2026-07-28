import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/Layout/PageWrapper';
import client from '../api/client';
import { AlertTriangle, Filter, CheckCircle } from 'lucide-react';

export default function AnomalyHistory() {
  const [alerts, setAlerts] = useState([]);
  const [agentFilter, setAgentFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = () => {
    let url = '/anomalies/?limit=100';
    if (agentFilter) url += `&agent_id=${agentFilter}`;
    if (severityFilter) url += `&severity=${severityFilter}`;
    if (typeFilter) url += `&alert_type=${typeFilter}`;

    client.get(url)
      .then(res => {
        setAlerts(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, [agentFilter, severityFilter, typeFilter]);

  const handleAcknowledge = async (id) => {
    try {
      await client.put(`/anomalies/${id}/acknowledge`);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_acknowledged: true } : a));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <PageWrapper title="Anomaly Alert History">
      {/* Filter Controls */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Filter size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>Filter Anomaly Logs</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Agent</label>
            <select className="input-field" value={agentFilter} onChange={e => setAgentFilter(e.target.value)}>
              <option value="">All Agents</option>
              <option value="A001">Customer Support (A001)</option>
              <option value="A002">Research Agent (A002)</option>
              <option value="A003">Sales Agent (A003)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Severity</label>
            <select className="input-field" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
              <option value="">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Anomaly Type</label>
            <select className="input-field" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="token_spike">Token Spike</option>
              <option value="infinite_loop">Infinite Loop</option>
              <option value="high_latency">High Latency</option>
              <option value="tool_failure_cascade">Tool Failure Cascade</option>
              <option value="behavioral_drift">Behavioral Drift</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Agent ID</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Severity</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>IF Score</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Description</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: a.is_acknowledged ? 0.6 : 1 }}>
                  <td className="mono" style={{ padding: '12px', color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleString()}</td>
                  <td className="mono" style={{ padding: '12px', color: 'var(--primary)', fontWeight: 600 }}>{a.agent_id}</td>
                  <td style={{ padding: '12px' }}><span className="mono" style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>{a.alert_type}</span></td>
                  <td style={{ padding: '12px' }}><span className={`badge badge-${a.severity.toLowerCase()}`}>{a.severity}</span></td>
                  <td className="mono" style={{ padding: '12px', fontWeight: 700, color: a.anomaly_score < -0.5 ? 'var(--danger)' : 'var(--text-main)' }}>{a.anomaly_score ? a.anomaly_score.toFixed(2) : '-'}</td>
                  <td style={{ padding: '12px', color: 'var(--text-main)' }}>{a.description}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {a.is_acknowledged ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={14} /> Ack'd
                      </span>
                    ) : (
                      <button onClick={() => handleAcknowledge(a.id)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}
