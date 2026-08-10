import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '../components/Layout/PageWrapper';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import client from '../api/client';
import { GitCompare, CheckSquare } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Cell,
} from 'recharts';

const AGENT_OPTIONS = [
  { id: 'A001', name: 'Customer Support (A001)' },
  { id: 'A002', name: 'Research Agent (A002)' },
  { id: 'A003', name: 'Sales Agent (A003)' },
];

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

export default function AgentComparison() {
  const [selectedIds, setSelectedIds] = useState(['A001', 'A002', 'A003']);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchComparison = () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    client.get(`/enhanced/agents/compare?agent_ids=${selectedIds.join(',')}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchComparison();
  }, [selectedIds]);

  const toggleAgent = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const agentsList = Array.isArray(data?.agents) ? data.agents : [];

  // Prepare radar chart data
  const radarData = agentsList.length > 0 ? [
    { metric: 'Reliability', ...Object.fromEntries(agentsList.map(a => [a.agent_id, a.reliability])) },
    { metric: 'Success Rate', ...Object.fromEntries(agentsList.map(a => [a.agent_id, a.tool_success_rate])) },
    { metric: 'Latency Score', ...Object.fromEntries(agentsList.map(a => [a.agent_id, Math.max(0, 100 - a.avg_latency / 30)])) },
    { metric: 'Token Eff.', ...Object.fromEntries(agentsList.map(a => [a.agent_id, Math.max(0, 100 - a.avg_tokens / 10)])) },
    { metric: 'Stability', ...Object.fromEntries(agentsList.map(a => [a.agent_id, 100 - a.failure_rate])) },
  ] : [];

  // Prepare bar chart data
  const barMetrics = agentsList.length > 0 ? [
    { metric: 'Avg Latency (ms)', key: 'avg_latency' },
    { metric: 'Avg Tokens', key: 'avg_tokens' },
    { metric: 'Reliability', key: 'reliability' },
    { metric: 'Success Rate (%)', key: 'tool_success_rate' },
    { metric: 'Failure Rate (%)', key: 'failure_rate' },
  ] : [];

  return (
    <PageWrapper title="Agent Comparison">
      {/* Agent Selector */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <GitCompare size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Select Agents to Compare</h3>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {AGENT_OPTIONS.map((opt, idx) => {
            const selected = selectedIds.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleAgent(opt.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: selected ? `1px solid ${COLORS[idx]}` : '1px solid var(--border-color)',
                  background: selected ? `${COLORS[idx]}15` : 'transparent',
                  color: selected ? COLORS[idx] : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                {selected && <CheckSquare size={14} />}
                {opt.name}
              </button>
            );
          })}
        </div>
      </div>

      {loading && <LoadingSkeleton type="card" count={2} height="300px" />}

      {agentsList.length > 0 && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${agentsList.length}, 1fr)`, gap: '16px', marginBottom: '32px' }}>
            {agentsList.map((agent, idx) => (
              <motion.div
                key={agent.agent_id}
                className="glass-panel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: COLORS[idx], opacity: 0.7 }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>{agent.agent_type}</div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>{agent.agent_name}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Reliability</span>
                    <span className="mono" style={{ fontWeight: 700, color: agent.reliability >= 85 ? 'var(--success)' : (agent.reliability >= 65 ? 'var(--warning)' : 'var(--danger)') }}>
                      {agent.reliability}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Avg Latency</span>
                    <span className="mono" style={{ fontWeight: 600, color: '#fff' }}>{agent.avg_latency}ms</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Success Rate</span>
                    <span className="mono" style={{ fontWeight: 600, color: 'var(--success)' }}>{agent.tool_success_rate}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Cost</span>
                    <span className="mono" style={{ fontWeight: 600, color: '#fff' }}>${agent.total_cost}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Risk Level</span>
                    <span className={`badge badge-${agent.risk_level.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{agent.risk_level}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {/* Radar Chart */}
            <motion.div
              className="glass-panel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ padding: '24px' }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>Multi-Dimensional Comparison</h3>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.12)" />
                    <PolarAngleAxis dataKey="metric" stroke="#cbd5e1" fontSize={11} tick={{ fill: '#cbd5e1' }} />
                    <PolarRadiusAxis stroke="#64748b" fontSize={9} />
                    {agentsList.map((agent, idx) => (
                      <Radar
                        key={agent.agent_id}
                        name={agent.agent_name}
                        dataKey={agent.agent_id}
                        stroke={COLORS[idx % COLORS.length]}
                        fill={COLORS[idx % COLORS.length]}
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1', paddingTop: '10px' }} />
                    <Tooltip contentStyle={{ background: '#111827', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Bar Charts */}
            {barMetrics.map((m, mIdx) => (
              <motion.div
                key={m.key}
                className="glass-panel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + mIdx * 0.05 }}
                style={{ padding: '24px' }}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>{m.metric}</h3>
                <div style={{ height: '200px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agentsList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="agent_name" stroke="#9ca3af" fontSize={10} tickLine={false} tick={{ fill: '#9ca3af' }} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} tick={{ fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ background: '#111827', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                      <Bar dataKey={m.key} radius={[4, 4, 0, 0]}>
                        {agentsList.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </PageWrapper>
  );
}

