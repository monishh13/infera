import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import client from '../../api/client';

export default function TrendCards({ agentId }) {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agentId) return;
    client.get(`/enhanced/agents/${agentId}/trends`)
      .then(res => {
        const trendList = Array.isArray(res.data?.trends) ? res.data.trends : (Array.isArray(res.data) ? res.data : []);
        setTrends(trendList);
        setLoading(false);
      })
      .catch(() => {
        setTrends([]);
        setLoading(false);
      });
  }, [agentId]);

  const safeTrends = Array.isArray(trends) ? trends : [];

  if (loading || safeTrends.length === 0) return null;

  const getDirectionIcon = (direction) => {
    if (direction === 'increasing') return TrendingUp;
    if (direction === 'decreasing') return TrendingDown;
    return Minus;
  };

  const getColor = (trend) => {
    if (trend.direction === 'stable') return 'var(--text-dim)';
    const isGoodDirection = (trend.improving_direction === trend.direction);
    return isGoodDirection ? 'var(--success)' : 'var(--danger)';
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Activity size={18} color="var(--accent)" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Metric Trends</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        {safeTrends.map((trend, idx) => {
          const Icon = getDirectionIcon(trend.direction);
          const color = getColor(trend);

          return (
            <motion.div
              key={trend.metric}
              className="glass-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.3 }}
              style={{ padding: '16px', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: color, opacity: 0.6 }} />

              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 500, marginBottom: '8px' }}>
                {trend.metric}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                  {trend.current}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{trend.unit}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon size={14} color={color} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color, textTransform: 'capitalize' }}>
                  {trend.direction}
                </span>
                {trend.change_pct !== 0 && (
                  <span className="mono" style={{ fontSize: '0.7rem', color }}>
                    ({trend.change_pct > 0 ? '+' : ''}{trend.change_pct}%)
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
