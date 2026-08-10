import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import client from '../../api/client';
import SectionHeader from '../UI/SectionHeader';

const AGENT_COLORS = {
  A001: '#3B82F6', // Primary Blue
  A002: '#60A5FA', // Light Blue
  A003: '#16A34A', // Green
};

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
    <div className="glass-panel" style={{ padding: 'var(--space-4)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <SectionHeader
        title="Token Throughput"
        description="Token velocity per execution step across active fleet"
        action={
          <div
            style={{
              display: 'flex',
              gap: '2px',
              background: 'var(--surface-2)',
              padding: '2px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
            }}
          >
            {['1h', '6h', '24h'].map(w => (
              <button
                key={w}
                onClick={() => setWindowTime(w)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: windowTime === w ? '#FFFFFF' : 'transparent',
                  color: windowTime === w ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: windowTime === w ? 'var(--shadow-sm)' : 'none',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {w}
              </button>
            ))}
          </div>
        }
      />

      <div style={{ height: '260px', width: '100%', marginTop: 'var(--space-2)' }}>
        {chartData.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: 'var(--font-size-base)', fontWeight: 500 }}>
            {loading ? 'Loading token throughput data...' : 'No telemetry data recorded'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {Object.entries(AGENT_COLORS).map(([id, color]) => (
                  <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
              <XAxis dataKey="timestamp" stroke="#6B7280" fontSize={10} tickLine={false} tick={{ fill: '#6B7280' }} />
              <YAxis stroke="#6B7280" fontSize={10} tickLine={false} tick={{ fill: '#6B7280' }} />
              <Tooltip
                contentStyle={{
                  background: '#FFFFFF',
                  borderColor: '#E7E7EA',
                  borderRadius: 'var(--radius-md)',
                  color: '#111827',
                  fontSize: '11px',
                  boxShadow: 'var(--shadow-md)',
                }}
              />
              <ReferenceLine y={500} label={{ value: 'Threshold', fill: 'var(--accent-red)', fontSize: 9 }} stroke="var(--accent-red)" strokeDasharray="3 3" opacity={0.5} />
              <Area type="monotone" dataKey="A001" name="Support (A001)" stroke={AGENT_COLORS.A001} fill="url(#grad-A001)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="A002" name="Research (A002)" stroke={AGENT_COLORS.A002} fill="url(#grad-A002)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="A003" name="Sales (A003)" stroke={AGENT_COLORS.A003} fill="url(#grad-A003)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
