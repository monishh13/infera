import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '../components/Layout/PageWrapper';
import ReliabilityGauge from '../components/ReliabilityGauge/ReliabilityGauge';
import ToolGraph from '../components/ToolGraph/ToolGraph';
import { useTelemetry } from '../hooks/useTelemetry';
import client from '../api/client';
import { ArrowLeft, Clock, Zap, CheckCircle, AlertTriangle, Layers } from 'lucide-react';

export default function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { telemetry, stats, reliability, loading } = useTelemetry(id, 3000);
  const [agent, setAgent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    client.get(`/agents/${id}`)
      .then(res => setAgent(res.data))
      .catch(() => {});

    client.get(`/agents/${id}/sessions`)
      .then(res => {
        setSessions(res.data);
        if (res.data.length > 0) {
          setSelectedSessionId(res.data[0].id);
        }
      })
      .catch(() => {});
  }, [id]);

  return (
    <PageWrapper title={`Agent Detail — ${id}`}>
      {/* Top Back Navigation & Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button 
          onClick={() => navigate('/')} 
          className="btn-secondary"
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> Back to Overview
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>{agent?.type || 'Agent'}</span>
          <span className={`badge badge-${reliability?.risk_level?.toLowerCase() || 'low'}`} style={{ fontSize: '0.85rem' }}>
            {reliability?.risk_level || 'LOW'} RISK
          </span>
        </div>
      </div>

      {/* Main Agent Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
          {agent?.name || id}
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {agent?.description || 'Monitored autonomous LLM agent execution flow and telemetry metrics.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Token Budget</span>
            <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{agent?.token_budget}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Latency Threshold</span>
            <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{agent?.latency_threshold_ms} ms</span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Loop Threshold</span>
            <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{agent?.loop_threshold} iters</span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Failure Threshold</span>
            <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{agent?.failure_threshold * 100}%</span>
          </div>
        </div>
      </div>

      {/* Grid Row: Reliability Gauge + Performance Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <ReliabilityGauge reliability={reliability} />

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
            Execution Metrics Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={18} color="var(--primary)" />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Average Tokens per Action</span>
              </div>
              <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                {stats?.avg_tokens || 0}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} color="var(--accent)" />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Average Action Latency</span>
              </div>
              <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                {stats?.avg_latency_ms || 0} ms
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={18} color="var(--success)" />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tool Success Rate</span>
              </div>
              <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)' }}>
                {Math.round((stats?.success_rate || 1) * 100)}%
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={18} color="var(--warning)" />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Emitted Events</span>
              </div>
              <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                {stats?.total_events || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Session Tool Invocation DAG Graph */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Select Execution Session</h3>
          {sessions.length > 0 && (
            <select
              className="input-field"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
              value={selectedSessionId || ''}
              onChange={e => setSelectedSessionId(e.target.value)}
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>Session {s.id} ({s.status})</option>
              ))}
            </select>
          )}
        </div>
        <ToolGraph sessionId={selectedSessionId} />
      </div>

      {/* Telemetry Event Stream Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Recent Telemetry Events</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Tool</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Tokens</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Latency</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Loop</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>IF Score</th>
              </tr>
            </thead>
            <tbody>
              {telemetry.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: e.is_anomaly ? 'rgba(239, 68, 68, 0.08)' : 'transparent' }}>
                  <td className="mono" style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{new Date(e.timestamp).toLocaleTimeString()}</td>
                  <td className="mono" style={{ padding: '10px 12px', color: 'var(--primary)', fontWeight: 600 }}>{e.tool_name || 'LLM Step'}</td>
                  <td className="mono" style={{ padding: '10px 12px' }}>{e.tokens_used}</td>
                  <td className="mono" style={{ padding: '10px 12px' }}>{Math.round(e.latency_ms)} ms</td>
                  <td className="mono" style={{ padding: '10px 12px' }}>{e.loop_count}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`badge ${e.status === 'SUCCESS' ? 'badge-low' : 'badge-critical'}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="mono" style={{ padding: '10px 12px', fontWeight: 700, color: e.is_anomaly ? 'var(--danger)' : 'var(--text-main)' }}>
                    {e.anomaly_score ? e.anomaly_score.toFixed(2) : '-'}
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
