import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock, Circle } from 'lucide-react';

const STATUS_CONFIG = {
  success:      { icon: CheckCircle,   color: 'var(--success)', bg: 'var(--success-muted)', border: 'rgba(16, 185, 129, 0.2)', label: 'Success' },
  healthy:      { icon: CheckCircle,   color: 'var(--success)', bg: 'var(--success-muted)', border: 'rgba(16, 185, 129, 0.2)', label: 'Healthy' },
  warning:      { icon: AlertTriangle, color: 'var(--warning)', bg: 'var(--warning-muted)', border: 'rgba(245, 158, 11, 0.2)', label: 'Warning' },
  degraded:     { icon: AlertTriangle, color: 'var(--warning)', bg: 'var(--warning-muted)', border: 'rgba(245, 158, 11, 0.2)', label: 'Degraded' },
  failure:      { icon: XCircle,       color: 'var(--danger)',  bg: 'var(--danger-muted)',  border: 'rgba(239, 68, 68, 0.2)',  label: 'Failure' },
  critical:     { icon: XCircle,       color: 'var(--danger)',  bg: 'var(--danger-muted)',  border: 'rgba(239, 68, 68, 0.2)',  label: 'Critical' },
  at_risk:      { icon: XCircle,       color: 'var(--danger)',  bg: 'var(--danger-muted)',  border: 'rgba(239, 68, 68, 0.2)',  label: 'At Risk' },
  timeout:      { icon: Clock,         color: 'var(--warning)', bg: 'var(--warning-muted)', border: 'rgba(245, 158, 11, 0.2)', label: 'Timeout' },
  active:       { icon: Circle,        color: 'var(--primary)', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)', label: 'Active' },
  idle:         { icon: Circle,        color: 'var(--text-tertiary)', bg: 'rgba(100, 116, 139, 0.08)', border: 'rgba(100, 116, 139, 0.15)', label: 'Idle' },
  created:      { icon: Circle,        color: 'var(--primary)', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)', label: 'Created' },
  acknowledged: { icon: AlertTriangle, color: 'var(--warning)', bg: 'var(--warning-muted)', border: 'rgba(245, 158, 11, 0.2)', label: 'Acknowledged' },
  resolved:     { icon: CheckCircle,   color: 'var(--success)', bg: 'var(--success-muted)', border: 'rgba(16, 185, 129, 0.2)', label: 'Resolved' },
};

/**
 * StatusBadge — displays operational status as a colored pill badge.
 *
 * @param {string}  status - Status key (healthy, warning, critical, etc.)
 * @param {string}  label  - Override label text
 * @param {string}  size   - "sm" | "md" | "lg"
 * @param {boolean} pulse  - Show pulse animation for critical states
 * @param {boolean} dot    - Show only a colored dot (no icon)
 */
export default function StatusBadge({ status, label, size = 'sm', pulse = false, dot = false }) {
  const key = (status || 'idle').toLowerCase();
  const config = STATUS_CONFIG[key] || STATUS_CONFIG.idle;
  const Icon = config.icon;
  const displayLabel = label || config.label;

  const sizes = {
    sm: { padding: '3px 10px', fontSize: 'var(--font-size-sm)', iconSize: 12, dotSize: 6 },
    md: { padding: '4px 12px', fontSize: 'var(--font-size-base)', iconSize: 14, dotSize: 7 },
    lg: { padding: '6px 16px', fontSize: 'var(--font-size-md)', iconSize: 16, dotSize: 8 },
  };

  const s = sizes[size] || sizes.sm;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: s.padding,
        borderRadius: 'var(--radius-full)',
        fontSize: s.fontSize,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        animation: pulse && (key === 'critical' || key === 'failure') ? 'pulse-border 3s ease-in-out infinite' : 'none',
        whiteSpace: 'nowrap',
        transition: 'all var(--duration-normal) var(--ease-out)',
      }}
    >
      {dot ? (
        <span
          style={{
            width: `${s.dotSize}px`,
            height: `${s.dotSize}px`,
            borderRadius: '50%',
            background: config.color,
            flexShrink: 0,
          }}
        />
      ) : (
        <Icon size={s.iconSize} />
      )}
      {displayLabel}
    </span>
  );
}
