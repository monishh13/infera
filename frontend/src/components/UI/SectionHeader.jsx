import React from 'react';

/**
 * SectionHeader — consistent section title with icon, description, and optional right-side content.
 *
 * @param {React.ElementType} icon        - Lucide icon component
 * @param {string}            title       - Section title
 * @param {string}            description - Optional subtitle/description
 * @param {string}            iconColor   - Icon color (default var(--primary))
 * @param {React.ReactNode}   action      - Optional right-side content (buttons, selects)
 * @param {object}            style       - Optional container style overrides
 */
export default function SectionHeader({
  icon: Icon,
  title,
  description,
  iconColor = 'var(--primary)',
  action,
  style,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '16px',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0 }}>
        {Icon && (
          <div
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              background: `color-mix(in srgb, ${iconColor} 10%, transparent)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '1px',
            }}
          >
            <Icon size={16} color={iconColor} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}
          >
            {title}
          </h3>
          {description && (
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--text-tertiary)',
                marginTop: '2px',
                lineHeight: 1.4,
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {action}
        </div>
      )}
    </div>
  );
}
