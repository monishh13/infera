import React from 'react';
import { motion } from 'motion/react';
import AnimatedCounter from './AnimatedCounter';
import Sparkline from './Sparkline';

export default function MetricCard({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  subtitle,
  trend,
  trendColor = 'var(--text-tertiary)',
  sparkData,
  sparkColor = 'var(--accent-primary)',
  index = 0,
}) {
  return (
    <motion.div
      className="glass-panel kpi-card"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.18 }}
      style={{
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#FFFFFF',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Metric Label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="label-text" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'none' }}>
          {title}
        </span>
      </div>

      {/* Value Row + Optional Mini Sparkline */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
          marginTop: 'var(--space-2)',
          marginBottom: 'var(--space-1)',
        }}
      >
        <AnimatedCounter
          value={typeof value === 'number' ? value : parseFloat(value) || 0}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          style={{
            fontSize: 'var(--font-size-metric)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            fontFamily: 'var(--font-sans)',
          }}
        />
        {sparkData && sparkData.length >= 2 && (
          <Sparkline
            data={sparkData}
            color={sparkColor}
            width={60}
            height={22}
            fill={true}
          />
        )}
      </div>

      {/* Subtitle / Contextual Trend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-tertiary)',
        }}
      >
        {trend && (
          <span style={{ fontWeight: 500, color: trendColor }}>
            {trend}
          </span>
        )}
        {subtitle && (
          <span>
            {subtitle}
          </span>
        )}
      </div>
    </motion.div>
  );
}
