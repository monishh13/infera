import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState — premium empty state with animated telemetry grid visualization.
 * Used when no agents, no data, or no results match filters.
 *
 * @param {React.ElementType} icon        - Lucide icon (default Inbox)
 * @param {string}            title       - Primary message
 * @param {string}            description - Supporting text
 * @param {React.ReactNode}   action      - Optional CTA button/element
 * @param {boolean}           showGrid    - Show animated telemetry grid (default true)
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data yet',
  description = '',
  action,
  showGrid = true,
}) {
  // Generate grid lines for the telemetry visualization
  const gridLines = useMemo(() => {
    const lines = [];
    // Horizontal lines
    for (let i = 0; i < 5; i++) {
      lines.push({ x1: 0, y1: 20 + i * 20, x2: 200, y2: 20 + i * 20, key: `h${i}` });
    }
    // Vertical lines
    for (let i = 0; i < 9; i++) {
      lines.push({ x1: 10 + i * 24, y1: 10, x2: 10 + i * 24, y2: 110, key: `v${i}` });
    }
    return lines;
  }, []);

  // Generate dots at some grid intersections
  const dots = useMemo(() => [
    { cx: 58, cy: 40, delay: 0 },
    { cx: 106, cy: 60, delay: 0.8 },
    { cx: 82, cy: 80, delay: 1.6 },
    { cx: 130, cy: 40, delay: 2.4 },
    { cx: 34, cy: 60, delay: 1.2 },
    { cx: 154, cy: 80, delay: 0.4 },
  ], []);

  return (
    <div className="empty-state">
      {/* Telemetry grid visualization */}
      {showGrid && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 'var(--space-5)', position: 'relative' }}
        >
          <svg
            width="200"
            height="120"
            viewBox="0 0 200 120"
            style={{ display: 'block' }}
          >
            {/* Grid lines */}
            {gridLines.map(line => (
              <line
                key={line.key}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="var(--border-color)"
                strokeWidth="0.5"
                style={{ animation: 'grid-pulse 4s ease-in-out infinite' }}
              />
            ))}

            {/* Dormant connection lines */}
            <path
              d="M 34 60 L 58 40 L 82 80 L 106 60 L 130 40 L 154 80"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.15"
              strokeLinecap="round"
            />

            {/* Intersection dots — subtle pulse */}
            {dots.map((dot, i) => (
              <circle
                key={i}
                cx={dot.cx}
                cy={dot.cy}
                r="2.5"
                fill="var(--primary)"
                opacity="0.25"
                style={{
                  animation: `grid-pulse 3s ease-in-out ${dot.delay}s infinite`,
                }}
              />
            ))}
          </svg>
        </motion.div>
      )}

      {/* Icon */}
      <motion.div
        className="empty-state-icon"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <Icon size={24} color="var(--text-tertiary)" />
      </motion.div>

      {/* Title */}
      <motion.h4
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-1)',
        }}
      >
        {title}
      </motion.h4>

      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          style={{
            fontSize: 'var(--font-size-md)',
            color: 'var(--text-tertiary)',
            maxWidth: '340px',
            lineHeight: 1.5,
          }}
        >
          {description}
        </motion.p>
      )}

      {/* Action CTA */}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          style={{ marginTop: 'var(--space-5)' }}
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}
