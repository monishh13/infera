import React from 'react';
import { Terminal } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Terminal,
  title = 'No telemetry data',
  description = 'Start the telemetry stream to begin collecting real-time agent metrics.',
  action,
}) {
  return (
    <div className="empty-state" style={{ padding: 'var(--space-6) var(--space-4)' }}>
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface-2)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-3)',
        }}
      >
        <Icon size={18} color="var(--text-tertiary)" />
      </div>

      <h4
        style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 600,
          color: '#64748B',
          letterSpacing: '0.01em',
          marginBottom: '4px',
        }}
      >
        {title}
      </h4>

      {description && (
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-muted)',
            maxWidth: '360px',
            lineHeight: 1.4,
          }}
        >
          {description}
        </p>
      )}

      {action && <div style={{ marginTop: 'var(--space-4)' }}>{action}</div>}
    </div>
  );
}
