import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import client from '../../api/client';

export default function CostChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    client.get('/dashboard/metrics/costs')
      .then(r => setData(r.data))
      .catch(() => {});
  }, []);

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Cumulative Agent Cost (USD)</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '20px' }}>Estimated USD API cost per agent</p>

      <div style={{ height: '220px', width: '100%' }}>
        {data.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No cost data recorded
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="agent_id" stroke="var(--text-dim)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111827', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="cost_usd" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
