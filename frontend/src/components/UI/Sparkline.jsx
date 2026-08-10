import React, { useMemo } from 'react';

/**
 * Sparkline — lightweight SVG mini-chart for KPI cards and inline metrics.
 *
 * @param {number[]} data     - Array of numeric values
 * @param {number}   width    - SVG width (default 80)
 * @param {number}   height   - SVG height (default 28)
 * @param {string}   color    - Stroke color (default var(--primary))
 * @param {boolean}  fill     - Show gradient fill under line
 * @param {number}   strokeWidth - Line thickness (default 1.5)
 */
export default function Sparkline({
  data = [],
  width = 80,
  height = 28,
  color = 'var(--primary)',
  fill = true,
  strokeWidth = 1.5,
}) {
  const points = useMemo(() => {
    if (!data || data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;
    const usableW = width - padding * 2;
    const usableH = height - padding * 2;

    return data
      .map((val, i) => {
        const x = padding + (i / (data.length - 1)) * usableW;
        const y = padding + usableH - ((val - min) / range) * usableH;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data, width, height]);

  const fillPoints = useMemo(() => {
    if (!points || !fill) return '';
    const padding = 2;
    const usableW = width - padding * 2;
    return `${padding},${height - padding} ${points} ${padding + usableW},${height - padding}`;
  }, [points, fill, width, height]);

  if (!data || data.length < 2) return null;

  const gradientId = `spark-grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={fillPoints}
            fill={`url(#${gradientId})`}
          />
        </>
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
