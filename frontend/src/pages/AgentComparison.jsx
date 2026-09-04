import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/Layout/PageWrapper';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import SectionHeader from '../components/UI/SectionHeader';
import StatusBadge from '../components/UI/StatusBadge';
import client from '../api/client';
import { GitCompare, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

const INITIAL_AGENT_OPTIONS = [
  { id: 'A001', name: 'Customer Support (A001)' },
  { id: 'A002', name: 'Research Agent (A002)' },
  { id: 'A003', name: 'Sales Agent (A003)' },
  { id: 'A004', name: 'Real LLM Agent (A004)' },
];

const AGENT_COLOR_MAP = {
  A001: '#3B82F6', // Blue
  A002: '#10B981', // Emerald
  A003: '#F59E0B', // Amber
  A004: '#8B5CF6', // Purple
};

const FALLBACK_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];
const getAgentColor = (agentId, index) => AGENT_COLOR_MAP[agentId] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

export default function AgentComparison() {
  const [agentOptions, setAgentOptions] = useState(INITIAL_AGENT_OPTIONS);
  const [selectedIds, setSelectedIds] = useState(['A001', 'A002', 'A003', 'A004']);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState('reliability');
  const [sortOrder, setSortOrder] = useState('desc');

  // Dynamically load available agents from API
  useEffect(() => {
    client.get('/agents')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const fetchedOpts = res.data.map(ag => ({
            id: ag.id,
            name: `${ag.name} (${ag.id})`
          }));
          setAgentOptions(fetchedOpts);
        }
      })
      .catch(() => {});
  }, []);

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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const agentsList = Array.isArray(data?.agents) ? data.agents : [];

  const sortedAgents = [...agentsList].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortOrder === 'asc' ? (aVal - bVal) : (bVal - aVal);
  });

  const metricBarData = agentsList.length > 0 ? [
    { metric: 'Reliability', ...Object.fromEntries(agentsList.map(a => [a.agent_id, a.reliability])) },
    { metric: 'Success Rate', ...Object.fromEntries(agentsList.map(a => [a.agent_id, a.tool_success_rate])) },
    { metric: 'Latency Score', ...Object.fromEntries(agentsList.map(a => [a.agent_id, Math.max(0, Math.min(100, Math.round(100 - a.avg_latency / 30)))])) },
    { metric: 'Token Eff.', ...Object.fromEntries(agentsList.map(a => [a.agent_id, Math.max(0, Math.min(100, Math.round(100 - a.avg_tokens / 10)))])) },
    { metric: 'Stability', ...Object.fromEntries(agentsList.map(a => [a.agent_id, Math.max(0, Math.min(100, Math.round(100 - a.failure_rate)))])) },
  ] : [];

  const renderSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} style={{ opacity: 0.4, marginLeft: '4px' }} />;
    return sortOrder === 'asc' ? (
      <ArrowUp size={12} style={{ color: 'var(--accent-primary)', marginLeft: '4px' }} />
    ) : (
      <ArrowDown size={12} style={{ color: 'var(--accent-primary)', marginLeft: '4px' }} />
    );
  };

  return (
    <PageWrapper title="Compare Agents" description="Multi-agent benchmarking across reliability, token efficiency, latency, and cost.">
      {/* Agent Selector Controls */}
      <div className="glass-panel" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
        <SectionHeader
          title="Select Agents for Comparison"
          description="Check multi-agent targets to analyze performance variations"
        />

        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
          {agentOptions.map(opt => {
            const isChecked = selectedIds.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleAgent(opt.id)}
                className={isChecked ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '6px 12px', fontSize: 'var(--font-size-base)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <SectionHeader title="Agent Performance Benchmarking Matrix" description="Click table headers or toggle dropdown to sort fleet by metric" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>Sort metric:</span>
                <select
                  value={sortField}
                  onChange={(e) => handleSort(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    fontSize: 'var(--font-size-xs)',
                    background: 'var(--surface-1)',
                    color: 'var(--text-primary)',
                    fontWeight: 600
                  }}
                >
                  <option value="reliability">Reliability Score</option>
                  <option value="avg_latency">Avg Latency</option>
                  <option value="avg_tokens">Avg Tokens</option>
                  <option value="tool_success_rate">Tool Success Rate</option>
                  <option value="failure_rate">Failure Rate</option>
                  <option value="total_cost">Total Cost</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto', marginTop: 'var(--space-2)' }}>
              <table className="obs-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('agent_name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Agent {renderSortIcon('agent_name')}
                    </th>
                    <th onClick={() => handleSort('agent_type')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Type {renderSortIcon('agent_type')}
                    </th>
                    <th onClick={() => handleSort('reliability')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Reliability {renderSortIcon('reliability')}
                    </th>
                    <th onClick={() => handleSort('avg_latency')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Avg Latency {renderSortIcon('avg_latency')}
                    </th>
                    <th onClick={() => handleSort('avg_tokens')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Avg Tokens {renderSortIcon('avg_tokens')}
                    </th>
                    <th onClick={() => handleSort('tool_success_rate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Tool Success {renderSortIcon('tool_success_rate')}
                    </th>
                    <th onClick={() => handleSort('failure_rate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Failure Rate {renderSortIcon('failure_rate')}
                    </th>
                    <th onClick={() => handleSort('total_cost')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Total Cost {renderSortIcon('total_cost')}
                    </th>
                    <th onClick={() => handleSort('risk_level')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Risk {renderSortIcon('risk_level')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAgents.map(a => (
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

          {/* Grouped Metric Bar Chart & Action Latency Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 'var(--space-5)' }}>
            {/* Replace RadarChart with Grouped Metric Bar Chart */}
            <div className="glass-panel" style={{ padding: 'var(--space-4)', background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
              <SectionHeader title="Comparative Metric Footprint" description="Grouped multi-agent normalized metric score comparison (0-100)" />
              <div style={{ height: '320px', width: '100%', marginTop: 'var(--space-2)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
                    <XAxis dataKey="metric" stroke="#6B7280" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#6B7280" fontSize={10} />
                    <Tooltip
                      contentStyle={{ background: '#FFFFFF', borderColor: '#E7E7EA', borderRadius: 'var(--radius-md)', color: '#111827', fontSize: '11px' }}
                      formatter={(val) => [`${val} / 100`, 'Score']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#374151' }} />
                    {agentsList.map((a, i) => (
                      <Bar
                        key={a.agent_id}
                        name={`${a.agent_name} (${a.agent_id})`}
                        dataKey={a.agent_id}
                        fill={getAgentColor(a.agent_id, i)}
                        radius={[3, 3, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Average Action Latency Comparison Bar Chart */}
            <div className="glass-panel" style={{ padding: 'var(--space-4)', background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
              <SectionHeader title="Average Action Latency Comparison" description="Mean execution latency in milliseconds" />
              <div style={{ height: '320px', width: '100%', marginTop: 'var(--space-2)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agentsList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
                    <XAxis dataKey="agent_id" stroke="#6B7280" fontSize={10} />
                    <YAxis stroke="#6B7280" fontSize={10} />
                    <Tooltip
                      contentStyle={{ background: '#FFFFFF', borderColor: '#E7E7EA', borderRadius: 'var(--radius-md)', color: '#111827', fontSize: '11px' }}
                      formatter={(val) => [`${val} ms`, 'Avg Latency']}
                    />
                    <Bar dataKey="avg_latency" radius={[3, 3, 0, 0]}>
                      {agentsList.map((a, i) => (
                        <Cell key={a.agent_id} fill={getAgentColor(a.agent_id, i)} />
                      ))}
                    </Bar>
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
