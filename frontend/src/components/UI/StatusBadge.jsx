import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock, Circle } from 'lucide-react';

const STATUS_CONFIG = {
  success: { icon: CheckCircle, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', label: 'Success' },
  healthy: { icon: CheckCircle, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', label: 'Healthy' },
  warning: { icon: AlertTriangle, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', label: 'Warning' },
  degraded: { icon: AlertTriangle, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', label: 'Degraded' },
  failure: { icon: XCircle, color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', label: 'Failure' },
  critical: { icon: XCircle, color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', label: 'Critical' },
  at_risk: { icon: XCircle, color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', label: 'At Risk' },
  timeout: { icon: Clock, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', label: 'Timeout' },
  active: { icon: Circle, color: 'var(--primary)', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', label: 'Active' },
  idle: { icon: Circle, color: 'var(--text-dim)', bg: 'rgba(107, 114, 128, 0.15)', border: 'rgba(107, 114, 128, 0.3)', label: 'Idle' },
  created: { icon: Circle, color: 'var(--primary)', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', label: 'Created' },
  acknowledged: { icon: AlertTriangle, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', label: 'Acknowledged' },
  resolved: { icon: CheckCircle, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', label: 'Resolved' },
};

export default function StatusBadge({ status, label, size = 'sm', pulse = false }) {
  const key = (status || 'idle').toLowerCase();
  const config = STATUS_CONFIG[key] || STATUS_CONFIG.idle;
  const Icon = config.icon;
  const displayLabel = label || config.label;

  const sizes = {
    sm: { padding: '3px 10px', fontSize: '0.75rem', iconSize: 12 },
    md: { padding: '5px 14px', fontSize: '0.8rem', iconSize: 14 },
    lg: { padding: '6px 18px', fontSize: '0.85rem', iconSize: 16 },
  };

  const s = sizes[size] || sizes.sm;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: s.padding,
        borderRadius: '9999px',
        fontSize: s.fontSize,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        animation: pulse && key === 'critical' ? 'pulse-border 2s infinite' : 'none',
      }}
    >
      <Icon size={s.iconSize} />
      {displayLabel}
    </span>
  );
}
