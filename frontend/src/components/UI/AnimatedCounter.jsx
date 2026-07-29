import React, { useState, useEffect, useRef } from 'react';

export default function AnimatedCounter({ value, duration = 1200, prefix = '', suffix = '', decimals = 0, style = {} }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const animFrame = useRef(null);

  useEffect(() => {
    const start = prevValue.current;
    const end = typeof value === 'number' ? value : parseFloat(value) || 0;
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
  }, [value, duration]);

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display);

  return (
    <span className="mono" style={style}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
