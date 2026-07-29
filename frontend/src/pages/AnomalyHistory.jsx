import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/Layout/PageWrapper';
import client from '../api/client';
import { AlertTriangle, Filter, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import AnomalyReasons from '../components/AnomalyLog/AnomalyReasons';
import Recommendations from '../components/AnomalyLog/Recommendations';
import StatusBadge from '../components/UI/StatusBadge';
import EmptyState from '../components/UI/EmptyState';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';

export default function AnomalyHistory() {
  const [alerts, setAlerts] = useState([]);
  const [agentFilter, setAgentFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

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
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_acknowledged: true, status: 'acknowledged', acknowledged_at: new Date().toISOString() } : a));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = async (id) => {
    try {
      await client.put(`/anomalies/${id}/resolve`);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_acknowledged: true, status: 'resolved', resolved_at: new Date().toISOString() } : a));
    } catch (e) {
      console.error(e);
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

      {/* Alerts List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <LoadingSkeleton type="table" count={5} />
        ) : alerts.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No alerts found" description="No anomaly alerts matching your filter criteria." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '150px 80px 140px 100px 80px 1fr 140px',
              gap: '8px',
              padding: '10px 12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-dim)',
              borderBottom: '1px solid var(--border-color)',
            }}>
              <span>Timestamp</span>
              <span>Agent</span>
              <span>Type</span>
              <span>Severity</span>
              <span>IF Score</span>
              <span>Description</span>
              <span style={{ textAlign: 'right' }}>Status & Action</span>
            </div>

            {alerts.map(a => {
              const isExpanded = expandedId === a.id;
              const alertStatus = getAlertStatus(a);

              return (
                <div key={a.id}>
                  <div
                    onClick={() => toggleExpand(a.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '150px 80px 140px 100px 80px 1fr 140px',
                      gap: '8px',
                      padding: '12px',
                      borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.04)',
                      background: alertStatus === 'resolved' ? 'transparent' : 'rgba(255,255,255,0.02)',
                      opacity: alertStatus === 'resolved' ? 0.5 : 1,
                      cursor: 'pointer',
                      alignItems: 'center',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                    <span className="mono" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.78rem' }}>
                      {a.agent_id}
                    </span>
                    <span>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
                        fontSize: '0.72rem', fontWeight: 600, background: 'rgba(255,255,255,0.06)',
                        color: '#fff', fontFamily: 'var(--font-mono)'
                      }}>
                        {a.alert_type}
                      </span>
                    </span>
                    <span>
                      <span className={`badge badge-${a.severity.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                        {a.severity}
                      </span>
                    </span>
                    <span className="mono" style={{ fontWeight: 700, color: a.anomaly_score < -0.5 ? 'var(--danger)' : 'var(--text-main)', fontSize: '0.78rem' }}>
                      {a.anomaly_score ? a.anomaly_score.toFixed(2) : '-'}
                    </span>
                    <span style={{ color: 'var(--text-main)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.description}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      {alertStatus === 'resolved' ? (
                        <StatusBadge status="resolved" size="sm" />
                      ) : alertStatus === 'acknowledged' ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <StatusBadge status="acknowledged" size="sm" />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleResolve(a.id); }}
                            className="btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                          >
                            Resolve
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAcknowledge(a.id); }}
                          className="btn-secondary"
                          style={{ padding: '3px 10px', fontSize: '0.72rem' }}
                        >
                          Acknowledge
                        </button>
                      )}
                      {isExpanded ? <ChevronUp size={14} color="var(--text-dim)" /> : <ChevronDown size={14} color="var(--text-dim)" />}
                    </div>
                  </div>

                  {/* Expandable Reasons & Recommendations */}
                  {isExpanded && (
                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '0 0 8px 8px',
                      borderBottom: '1px solid var(--border-color)',
                    }}>
                      <AnomalyReasons alertId={a.id} expanded={isExpanded} />
                      <Recommendations alertId={a.id} expanded={isExpanded} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
