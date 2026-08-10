import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import client from '../../api/client';

export default function TokenChart() {
  const [windowTime, setWindowTime] = useState('1h');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = () => {
      client.get(`/dashboard/metrics/token-usage?window=${windowTime}`)
        .then(r => {
          if (isMounted) {
            setData(Array.isArray(r.data) ? r.data : []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setData([]);
            setLoading(false);
          }
        });
    };

    fetchMetrics();
    const timer = setInterval(fetchMetrics, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [windowTime]);

  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Real-time Token Consumption</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Tokens per execution step across monitored agents</p>
        </div>

        {/* Time window toggle buttons */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {['1h', '6h', '24h'].map(w => (
            <button
              key={w}
              onClick={() => setWindowTime(w)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: windowTime === w ? 'var(--primary)' : 'transparent',
                color: windowTime === w ? '#fff' : 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: '300px', width: '100%' }}>
        {chartData.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            {loading ? 'Loading token telemetry...' : 'No telemetry data recorded in this window'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="timestamp" stroke="#9ca3af" fontSize={12} tickLine={false} tick={{ fill: '#9ca3af' }} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} tick={{ fill: '#9ca3af' }} />
              <Tooltip 
                contentStyle={{ background: '#111827', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }}
              />
              <ReferenceLine y={500} label={{ value: 'Spike Threshold', fill: '#ef4444', fontSize: 10 }} stroke="#ef4444" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="A001" name="Support (A001)" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="A002" name="Research (A002)" stroke="#06b6d4" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="A003" name="Sales (A003)" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
