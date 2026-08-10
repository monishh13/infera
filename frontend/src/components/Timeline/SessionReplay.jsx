import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';

export default function SessionReplay({ events = [], onStepChange }) {
  const safeEvents = Array.isArray(events) ? events : [];
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef(null);

  const totalSteps = safeEvents.length;

  const stop = useCallback(() => {
    setPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const advanceStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev + 1;
      if (next >= totalSteps) {
        stop();
        return totalSteps - 1;
      }
      return next;
    });
  }, [totalSteps, stop]);

  useEffect(() => {
    if (onStepChange) onStepChange(currentStep);
  }, [currentStep, onStepChange]);

  useEffect(() => {
    if (!playing || currentStep >= totalSteps - 1) return;

    // Calculate delay based on timestamp difference between events
    let delay = 800 / speed;
    if (currentStep >= 0 && currentStep < totalSteps - 1) {
      const curr = safeEvents[currentStep];
      const next = safeEvents[currentStep + 1];
      if (curr?.timestamp && next?.timestamp) {
        const diff = new Date(next.timestamp) - new Date(curr.timestamp);
        delay = Math.max(200, Math.min(2000, diff)) / speed;
      }
    }

    timerRef.current = setTimeout(advanceStep, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, currentStep, speed, totalSteps, safeEvents, advanceStep]);

  const handlePlay = () => {
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(-1);
    }
    setPlaying(true);
    if (currentStep < 0) advanceStep();
  };

  const handlePause = () => stop();

  const handleRestart = () => {
    stop();
    setCurrentStep(-1);
  };

  const cycleSpeed = () => {
    const speeds = [1, 2, 4];
    const idx = speeds.indexOf(speed);
    setSpeed(speeds[(idx + 1) % speeds.length]);
  };

  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  if (safeEvents.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Play size={16} color="var(--primary)" />
          Session Replay
        </h4>
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          {currentStep + 1} / {totalSteps} steps
        </span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div className="replay-controls">
          {playing ? (
            <button className="replay-btn active" onClick={handlePause}>
              <Pause size={14} /> Pause
            </button>
          ) : (
            <button className="replay-btn" onClick={handlePlay}>
              <Play size={14} /> {currentStep >= totalSteps - 1 ? 'Replay' : 'Play'}
            </button>
          )}
          <button className="replay-btn" onClick={handleRestart}>
            <RotateCcw size={14} /> Restart
          </button>
          <button className="replay-btn" onClick={cycleSpeed} title={`Speed: ${speed}x`}>
            <FastForward size={14} /> {speed}x
          </button>
        </div>

        {/* Progress bar */}
        <div className="replay-progress">
          <div className="replay-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Current event display */}
      {currentStep >= 0 && events[currentStep] && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: events[currentStep].is_anomaly ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.08)',
            border: `1px solid ${events[currentStep].is_anomaly ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
            fontSize: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span className="mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
              {events[currentStep].tool_name}
            </span>
            <span className={`badge badge-${events[currentStep].status === 'SUCCESS' ? 'low' : 'critical'}`} style={{ fontSize: '0.65rem' }}>
              {events[currentStep].status}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <span className="mono">{events[currentStep].latency_ms}ms</span>
            <span className="mono">{events[currentStep].tokens_used} tokens</span>
            <span className="mono">
              {events[currentStep].timestamp ? new Date(events[currentStep].timestamp).toLocaleTimeString() : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
