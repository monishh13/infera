import React from 'react';
import { motion } from 'motion/react';
import TrendIndicator from './TrendIndicator';

export default function HealthMetricCard({ label, value, unit = '', trend, icon: Icon, color = 'var(--accent-primary)' }) {
  return (
    <motion.div
      className="glass-panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
        background: '#FFFFFF',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', fontWeight: 500 }}>
          {label}
        </span>
        {Icon && (
          <div style={{ padding: '4px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
            <Icon size={14} color={color} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
        <span className="metric-value" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{unit}</span>}
      </div>

      {trend && (
        <div style={{ marginTop: '2px' }}>
          <TrendIndicator direction={trend} />
        </div>
      )}
    </motion.div>
  );
}
