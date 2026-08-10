import React from 'react';

/**
 * SectionHeader — text-first section heading with title, description, and action slot.
 * Refined text contrast for Phase 3.8.
 *
 * @param {string}          title       - Section title
 * @param {string}          description - Optional subtitle/description
 * @param {React.ReactNode} action      - Optional right-side controls/buttons
 * @param {object}          style       - Container style overrides
 */
export default function SectionHeader({
  title,
  description,
  action,
  style,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-3)',
        ...style,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h3
          style={{
            fontSize: 'var(--font-size-md)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h3>
        {description && (
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-tertiary)',
              marginTop: '2px',
              lineHeight: 1.3,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {action && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {action}
        </div>
      )}
    </div>
  );
}
