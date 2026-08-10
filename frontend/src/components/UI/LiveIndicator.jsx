import React from 'react';

/**
 * LiveIndicator — CSS-only animated pulse dot for live/streaming status.
 * No JS animation loops — uses CSS @keyframes for performance.
 *
 * @param {boolean} active    - Whether the indicator is live/active
 * @param {string}  color     - Dot color when active (default var(--success))
 * @param {string}  inactiveColor - Dot color when inactive (default var(--text-tertiary))
 * @param {number}  size      - Dot diameter in px (default 8)
 * @param {string}  label     - Optional text label next to the dot
 */
export default function LiveIndicator({
  active = false,
  color = 'var(--success)',
  inactiveColor = 'var(--text-tertiary)',
  size = 8,
  label,
}) {
  const activeColor = active ? color : inactiveColor;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span
        style={{
          position: 'relative',
          display: 'inline-block',
          width: `${size}px`,
          height: `${size}px`,
          flexShrink: 0,
        }}
      >
        {/* Pulse ring — CSS only, only when active */}
        {active && (
          <span
            style={{
              position: 'absolute',
              inset: '-3px',
              borderRadius: '50%',
              background: activeColor,
              opacity: 0.3,
              animation: 'pulse-live 2s ease-in-out infinite',
            }}
          />
        )}
        {/* Core dot */}
        <span
          style={{
            position: 'relative',
            display: 'block',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: activeColor,
            boxShadow: active ? `0 0 8px ${activeColor}` : 'none',
            transition: 'background 0.3s ease, box-shadow 0.3s ease',
          }}
        />
      </span>
      {label && (
        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: activeColor,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
