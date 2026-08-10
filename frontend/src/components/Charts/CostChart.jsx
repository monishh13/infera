import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import client from '../../api/client';
import SectionHeader from '../UI/SectionHeader';

export default function CostChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    client.get('/dashboard/metrics/costs')
      .then(r => setData(Array.isArray(r.data) ? r.data : []))
      .catch(() => setData([]));
  }, []);

  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="glass-panel" style={{ padding: 'var(--space-4)' }}>
      <SectionHeader
        title="Cost by Agent"
        description="Cumulative API cost (USD) by agent"
      />

      <div style={{ height: '160px', width: '100%', marginTop: 'var(--space-2)' }}>
        {chartData.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
            No cost data recorded
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
              <XAxis dataKey="agent_id" stroke="#6B7280" fontSize={10} tickLine={false} tick={{ fill: '#6B7280' }} />
              <YAxis stroke="#6B7280" fontSize={10} tickLine={false} tick={{ fill: '#6B7280' }} />
              <Tooltip contentStyle={{ background: '#FFFFFF', borderColor: '#E7E7EA', borderRadius: 'var(--radius-md)', color: '#111827', fontSize: '11px', boxShadow: 'var(--shadow-md)' }} />
              <Bar dataKey="cost_usd" fill="var(--accent-blue)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
