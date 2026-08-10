import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * AnimatedCounter — smoothly animates between numeric values with ease-out cubic.
 * Supports locale formatting (commas), prefix/suffix, and configurable decimals.
 * Respects prefers-reduced-motion.
 *
 * @param {number}  value     - Target numeric value
 * @param {number}  duration  - Animation duration in ms (default 800)
 * @param {string}  prefix    - Text before the number (e.g. "$")
 * @param {string}  suffix    - Text after the number (e.g. "%")
 * @param {number}  decimals  - Decimal places (default 0)
 * @param {boolean} locale    - Use locale formatting for commas (default true)
 * @param {object}  style     - CSS style object
 */
export default function AnimatedCounter({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  decimals = 0,
  locale = true,
  style = {},
}) {
  const [display, setDisplay] = useState(typeof value === 'number' ? value : parseFloat(value) || 0);
  const prevValue = useRef(display);
  const animFrame = useRef(null);

  // Detect reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  }, []);

  useEffect(() => {
    const end = typeof value === 'number' ? value : parseFloat(value) || 0;

    if (prefersReducedMotion) {
      setDisplay(end);
      prevValue.current = end;
      return;
    }

    const start = prevValue.current;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplay(current);

      if (progress < 1) {
        animFrame.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };

    animFrame.current = requestAnimationFrame(animate);
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [value, duration, prefersReducedMotion]);

  const formatted = useMemo(() => {
    if (locale && decimals === 0) {
      return Math.round(display).toLocaleString();
    }
    if (locale && decimals > 0) {
      return display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    return decimals > 0 ? display.toFixed(decimals) : Math.round(display).toString();
  }, [display, decimals, locale]);

  return (
    <span className="mono metric-value" style={style}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
