import React from 'react';
import { DollarSign, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

export default function CostBreakdown({ events = [], totalCost = 0 }) {
  const safeEvents = Array.isArray(events) ? events : [];
  // Aggregate cost by tool
  const toolCosts = {};
  safeEvents.forEach(e => {
    const tool = e.tool_name || 'LLM Step';
    const cost = e.cost_usd || ((e.tokens_used || 0) * 0.000002);
    toolCosts[tool] = (toolCosts[tool] || 0) + cost;
  });

  const chartData = Object.entries(toolCosts).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(5)),
  }));

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} color="var(--accent-green)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Session Cost Breakdown</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>API expense breakdown by tool invocation</p>
        </div>
        <span className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)' }}>
          ${totalCost.toFixed(5)}
        </span>
      </div>

      <div style={{ height: '220px', width: '100%' }}>
        {chartData.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            No cost data available for this session
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={75}
                innerRadius={45}
                paddingAngle={4}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#FFFFFF', borderColor: 'var(--border-default)', borderRadius: '8px', color: '#111827', fontSize: '12px', boxShadow: 'var(--shadow-md)' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
