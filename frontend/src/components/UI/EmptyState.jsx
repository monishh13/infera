import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'No data yet', description = '', action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={28} color="var(--text-dim)" />
      </div>
      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
        {title}
      </h4>
      {description && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', maxWidth: '320px' }}>
          {description}
        </p>
      )}
      {action && (
        <div style={{ marginTop: '16px' }}>
          {action}
        </div>
      )}
    </div>
  );
}
