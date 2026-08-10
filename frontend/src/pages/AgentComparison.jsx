import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/Layout/PageWrapper';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import SectionHeader from '../components/UI/SectionHeader';
import StatusBadge from '../components/UI/StatusBadge';
import client from '../api/client';
import { GitCompare } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts';

const AGENT_OPTIONS = [
  { id: 'A001', name: 'Customer Support (A001)' },
  { id: 'A002', name: 'Research Agent (A002)' },
  { id: 'A003', name: 'Sales Agent (A003)' },
];

const COLORS = ['#3B82F6', '#60A5FA', '#16A34A', '#F59E0B', '#8B5CF6'];

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

  const radarData = agentsList.length > 0 ? [
    { metric: 'Reliability', ...Object.fromEntries(agentsList.map(a => [a.agent_id, a.reliability])) },
    { metric: 'Success Rate', ...Object.fromEntries(agentsList.map(a => [a.agent_id, a.tool_success_rate])) },
    { metric: 'Latency Score', ...Object.fromEntries(agentsList.map(a => [a.agent_id, Math.max(0, 100 - a.avg_latency / 30)])) },
    { metric: 'Token Eff.', ...Object.fromEntries(agentsList.map(a => [a.agent_id, Math.max(0, 100 - a.avg_tokens / 10)])) },
    { metric: 'Stability', ...Object.fromEntries(agentsList.map(a => [a.agent_id, 100 - a.failure_rate])) },
  ] : [];

  return (
    <PageWrapper title="Compare Agents" description="Multi-agent benchmarking across reliability, token efficiency, latency, and cost.">
      {/* Agent Selector Controls */}
      <div className="glass-panel" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
        <SectionHeader
          title="Select Agents for Comparison"
          description="Check multi-agent targets to analyze performance variations"
        />

        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
          {AGENT_OPTIONS.map(opt => {
            const isChecked = selectedIds.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleAgent(opt.id)}
                className={isChecked ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '6px 12px', fontSize: 'var(--font-size-base)' }}
              >
                <GitCompare size={13} />
                <span>{opt.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="chart" count={2} height="280px" />
      ) : agentsList.length === 0 ? (
        <div className="glass-panel" style={{ padding: 'var(--space-6)', textAlign: 'center', color: '#64748B' }}>
          Select at least one agent to view comparison matrix.
        </div>
      ) : (
        <>
          {/* Comparison Table */}
          <div className="glass-panel" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
            <SectionHeader title="Agent Performance Benchmarking Matrix" />
            <div style={{ overflowX: 'auto', marginTop: 'var(--space-2)' }}>
              <table className="obs-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Type</th>
                    <th>Reliability</th>
                    <th>Avg Latency</th>
                    <th>Avg Tokens</th>
                    <th>Tool Success</th>
                    <th>Failure Rate</th>
                    <th>Total Cost</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {agentsList.map(a => (
                    <tr key={a.agent_id}>
                      <td className="mono" style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '11px' }}>
                        {a.agent_name} ({a.agent_id})
                      </td>
                      <td>
                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                          {a.agent_type}
                        </span>
                      </td>
                      <td className="mono" style={{ fontWeight: 700, color: a.reliability >= 85 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                        {a.reliability} / 100
                      </td>
                      <td className="mono" style={{ fontSize: '11px' }}>{a.avg_latency} ms</td>
                      <td className="mono" style={{ fontSize: '11px' }}>{a.avg_tokens} tk</td>
                      <td className="mono" style={{ fontSize: '11px', color: 'var(--accent-green)' }}>{a.tool_success_rate}%</td>
                      <td className="mono" style={{ fontSize: '11px', color: a.failure_rate > 5 ? 'var(--accent-red)' : 'var(--text-primary)' }}>{a.failure_rate}%</td>
                      <td className="mono" style={{ fontSize: '11px' }}>${a.total_cost.toFixed(4)}</td>
                      <td>
                        <StatusBadge status={a.risk_level.toLowerCase()} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Radar & Multi-Agent Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--space-5)' }}>
            <div className="glass-panel" style={{ padding: 'var(--space-4)', background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
              <SectionHeader title="Comparative Radar Benchmark" description="5-axis normalized performance footprint" />
              <div style={{ height: '300px', width: '100%', marginTop: 'var(--space-2)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#EEF0F3" />
                    <PolarAngleAxis dataKey="metric" stroke="#6B7280" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#9CA3AF" fontSize={10} />
                    {agentsList.map((a, i) => (
                      <Radar
                        key={a.agent_id}
                        name={a.agent_name}
                        dataKey={a.agent_id}
                        stroke={COLORS[i % COLORS.length]}
                        fill={COLORS[i % COLORS.length]}
                        fillOpacity={0.12}
                      />
                    ))}
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#374151' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: 'var(--space-4)', background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
              <SectionHeader title="Average Action Latency Comparison" description="Mean latency across execution steps" />
              <div style={{ height: '300px', width: '100%', marginTop: 'var(--space-2)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agentsList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
                    <XAxis dataKey="agent_id" stroke="#6B7280" fontSize={10} />
                    <YAxis stroke="#6B7280" fontSize={10} />
                    <Tooltip contentStyle={{ background: '#FFFFFF', borderColor: '#E7E7EA', borderRadius: 'var(--radius-md)', color: '#111827', fontSize: '11px' }} />
                    <Bar dataKey="avg_latency" fill="var(--accent-blue)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
