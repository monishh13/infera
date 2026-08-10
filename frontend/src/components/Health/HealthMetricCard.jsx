import React from 'react';
import { motion } from 'motion/react';
import TrendIndicator from './TrendIndicator';

export default function HealthMetricCard({ label, value, unit = '', trend, icon: Icon, color = 'var(--primary)' }) {
  return (
    <motion.div
      className="glass-panel"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 500 }}>{label}</span>
        {Icon && (
          <div style={{ padding: '6px', borderRadius: '6px', background: `${color}15` }}>
            <Icon size={15} color={color} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{unit}</span>}
      </div>

      {trend && (
        <TrendIndicator direction={trend} />
      )}
    </motion.div>
  );
}
