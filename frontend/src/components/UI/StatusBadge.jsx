import React from 'react';

const STATUS_CONFIG = {
  success:      { color: 'var(--accent-green)', bg: 'var(--accent-green-soft)', border: 'rgba(95, 168, 132, 0.2)', label: 'Success' },
  healthy:      { color: 'var(--accent-green)', bg: 'var(--accent-green-soft)', border: 'rgba(95, 168, 132, 0.2)', label: 'Healthy' },
  warning:      { color: 'var(--accent-amber)', bg: 'var(--accent-amber-soft)', border: 'rgba(197, 150, 82, 0.2)', label: 'Warning' },
  degraded:     { color: 'var(--accent-amber)', bg: 'var(--accent-amber-soft)', border: 'rgba(197, 150, 82, 0.2)', label: 'Degraded' },
  failure:      { color: 'var(--accent-red)',   bg: 'var(--accent-red-soft)',   border: 'rgba(201, 104, 104, 0.2)', label: 'Failure' },
  critical:     { color: 'var(--accent-red)',   bg: 'var(--accent-red-soft)',   border: 'rgba(201, 104, 104, 0.2)', label: 'Critical' },
  at_risk:      { color: 'var(--accent-red)',   bg: 'var(--accent-red-soft)',   border: 'rgba(201, 104, 104, 0.2)', label: 'At Risk' },
  timeout:      { color: 'var(--accent-amber)', bg: 'var(--accent-amber-soft)', border: 'rgba(197, 150, 82, 0.2)', label: 'Timeout' },
  active:       { color: 'var(--accent-primary)', bg: 'var(--accent-primary-soft)', border: 'var(--accent-primary-border)', label: 'Active' },
  idle:         { color: 'var(--text-muted)',   bg: 'var(--surface-2)',         border: 'var(--border-default)', label: 'Idle' },
  created:      { color: 'var(--accent-primary)', bg: 'var(--accent-primary-soft)', border: 'var(--accent-primary-border)', label: 'Created' },
  acknowledged: { color: 'var(--accent-amber)', bg: 'var(--accent-amber-soft)', border: 'rgba(197, 150, 82, 0.2)', label: 'Acknowledged' },
  resolved:     { color: 'var(--accent-green)', bg: 'var(--accent-green-soft)', border: 'rgba(95, 168, 132, 0.2)', label: 'Resolved' },
};

export default function StatusBadge({ status, label, size = 'sm', pulse = false }) {
  const key = (status || 'idle').toLowerCase();
  const config = STATUS_CONFIG[key] || STATUS_CONFIG.idle;
  const displayLabel = label || config.label;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 6px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: config.color,
          flexShrink: 0,
        }}
      />
      {displayLabel}
    </span>
  );
}
