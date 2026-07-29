import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function TrendIndicator({ direction = 'stable', label, size = 'sm' }) {
  const configs = {
    increasing: { icon: TrendingUp, color: 'var(--danger)', label: label || '↑ Increasing' },
    decreasing: { icon: TrendingDown, color: 'var(--success)', label: label || '↓ Decreasing' },
    improving: { icon: TrendingUp, color: 'var(--success)', label: label || '↑ Improving' },
    degrading: { icon: TrendingDown, color: 'var(--danger)', label: label || '↓ Degrading' },
    stable: { icon: Minus, color: 'var(--text-dim)', label: label || '→ Stable' },
  };

  const config = configs[direction] || configs.stable;
  const Icon = config.icon;
  const iconSize = size === 'lg' ? 16 : 13;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: size === 'lg' ? '0.85rem' : '0.75rem', color: config.color, fontWeight: 600 }}>
      <Icon size={iconSize} />
      {config.label}
    </span>
  );
}
