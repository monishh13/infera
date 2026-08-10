import React from 'react';
import { motion } from 'motion/react';
import AnimatedCounter from './AnimatedCounter';
import Sparkline from './Sparkline';

/**
 * MetricCard — premium KPI card for the dashboard system status area.
 *
 * @param {string}            title       - Metric title (e.g. "Active AI Agents")
 * @param {number|string}     value       - Primary metric value
 * @param {string}            prefix      - Value prefix (e.g. "$")
 * @param {string}            suffix      - Value suffix (e.g. "%")
 * @param {number}            decimals    - Decimal places for AnimatedCounter
 * @param {React.ElementType} icon        - Lucide icon component
 * @param {string}            accentColor - Accent color for icon and top bar
 * @param {string}            subtitle    - Supporting context line
 * @param {string}            trend       - Trend text (e.g. "↑ 12%")
 * @param {string}            trendColor  - Trend text color
 * @param {number[]}          sparkData   - Data array for sparkline
 * @param {string}            sparkColor  - Sparkline color (defaults to accentColor)
 * @param {number}            index       - Stagger index for entrance animation
 */
export default function MetricCard({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon: Icon,
  accentColor = 'var(--primary)',
  subtitle,
  trend,
  trendColor = 'var(--text-tertiary)',
  sparkData,
  sparkColor,
  index = 0,
}) {
  return (
    <motion.div
      className="glass-panel kpi-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        padding: 'var(--space-5)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      {/* Accent top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: accentColor,
          opacity: 0.6,
        }}
      />

      {/* Header: title + icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}
        >
          {title}
        </span>
        {Icon && (
          <div
            style={{
              padding: '7px',
              borderRadius: 'var(--radius-md)',
              background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      {/* Value row: number + sparkline */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
        }}
      >
        <AnimatedCounter
          value={typeof value === 'number' ? value : parseFloat(value) || 0}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          style={{
            fontSize: 'var(--font-size-metric)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}
        />
        {sparkData && sparkData.length >= 2 && (
          <Sparkline
            data={sparkData}
            color={sparkColor || accentColor}
            width={72}
            height={24}
          />
        )}
      </div>

      {/* Footer: trend + subtitle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
          minHeight: '16px',
        }}
      >
        {trend && (
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: trendColor,
            }}
          >
            {trend}
          </span>
        )}
        {subtitle && (
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-tertiary)',
              textAlign: 'right',
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </motion.div>
  );
}
