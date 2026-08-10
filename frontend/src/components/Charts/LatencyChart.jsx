import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import client from '../../api/client';

export default function LatencyChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    client.get('/dashboard/metrics/latency')
      .then(r => setData(Array.isArray(r.data) ? r.data : []))
      .catch(() => setData([]));
  }, []);

  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Avg Latency by Tool</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '20px' }}>Tool execution latency in milliseconds</p>

      <div style={{ height: '220px', width: '100%' }}>
        {chartData.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No tool latency metrics recorded yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="tool_name" stroke="#9ca3af" fontSize={10} tickLine={false} tick={{ fill: '#9ca3af' }} />
              <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} tick={{ fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ background: '#111827', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="avg_latency_ms" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.avg_latency_ms > 2000 ? 'var(--warning)' : 'var(--primary)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
