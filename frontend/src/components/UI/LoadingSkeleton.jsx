import React from 'react';

export default function LoadingSkeleton({ type = 'card', count = 1, height, width }) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === 'text') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map(i => (
          <div
            key={i}
            className="skeleton skeleton-text"
            style={{
              height: height || '14px',
              width: width || (i === items.length - 1 ? '60%' : '100%')
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${width || '220px'}, 1fr))`, gap: '20px' }}>
        {items.map(i => (
          <div key={i} className="skeleton skeleton-card" style={{ height: height || '180px' }} />
        ))}
      </div>
    );
  }

  if (type === 'gauge') {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: '14px', width: '60%', margin: '0 auto 20px auto' }} />
        <div className="skeleton skeleton-circle" style={{ width: '160px', height: '160px', margin: '0 auto 16px auto' }} />
        <div className="skeleton" style={{ height: '12px', width: '40%', margin: '0 auto' }} />
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div className="skeleton" style={{ height: '16px', width: '200px', marginBottom: '20px' }} />
        {items.map(i => (
          <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            <div className="skeleton" style={{ height: '12px', flex: 1 }} />
            <div className="skeleton" style={{ height: '12px', flex: 2 }} />
            <div className="skeleton" style={{ height: '12px', flex: 1 }} />
            <div className="skeleton" style={{ height: '12px', flex: 1 }} />
          </div>
        ))}
      </div>
    );
  }

  return <div className="skeleton" style={{ height: height || '40px', width: width || '100%' }} />;
}
