import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, AlertTriangle, Clock, Zap, DollarSign, ChevronDown, ChevronUp, Code } from 'lucide-react';

const statusIcon = (status, isAnomaly) => {
  if (isAnomaly) return <XCircle size={12} color="var(--accent-red)" />;
  if (status === 'SUCCESS') return <CheckCircle size={12} color="var(--accent-green)" />;
  if (status === 'TIMEOUT') return <AlertTriangle size={12} color="var(--accent-amber)" />;
  return <XCircle size={12} color="var(--accent-red)" />;
};

export default function ExecutionTimeline({ events = [], highlightIndex = -1 }) {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const safeEvents = Array.isArray(events) ? events : [];

  if (!safeEvents || safeEvents.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: 'var(--space-6)', textAlign: 'center', color: '#64748B', fontSize: 'var(--font-size-base)', fontWeight: 500 }}>
        No execution events recorded for this session.
      </div>
    );
  }

  const toggleInspector = (id) => {
    setSelectedEventId(prev => prev === id ? null : id);
  };

  return (
    <div className="glass-panel" style={{ padding: 'var(--space-4)', background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={16} color="var(--accent-primary)" />
        Execution Timeline & Event Inspector
      </h3>

      <div style={{ position: 'relative', paddingLeft: '8px' }}>
        {/* Timeline line */}
        <div
          style={{
            position: 'absolute',
            left: '17px',
            top: '12px',
            bottom: '24px',
            width: '2px',
            background: 'var(--border-default)',
          }}
        />

        {safeEvents.map((event, idx) => {
          const isHighlighted = highlightIndex === idx;
          const isSelected = selectedEventId === event.id;
          const isStart = idx === 0;
          const isEnd = idx === safeEvents.length - 1;

          return (
            <motion.div
              key={event.id || idx}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.2 }}
              style={{
                position: 'relative',
                paddingLeft: '32px',
                marginBottom: idx === safeEvents.length - 1 ? 0 : '16px',
              }}
            >
              {/* Timeline Dot */}
              <div
                style={{
                  position: 'absolute',
                  left: '11px',
                  top: '10px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: event.is_anomaly
                    ? '2px solid var(--accent-red)'
                    : (event.status === 'SUCCESS' ? '2px solid var(--accent-green)' : '2px solid var(--accent-amber)'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                }}
              >
                {statusIcon(event.status, event.is_anomaly)}
              </div>

              {/* Event Step Card */}
              <div
                onClick={() => toggleInspector(event.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--surface-2)' : (isHighlighted ? 'var(--accent-primary-soft)' : '#FFFFFF'),
                  border: event.is_anomaly
                    ? '1px solid rgba(220, 38, 38, 0.3)'
                    : (isSelected ? '1px solid var(--accent-primary-border)' : '1px solid var(--border-default)'),
                  boxShadow: 'var(--shadow-card)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isStart && (
                      <span className="badge badge-info" style={{ fontSize: '9px' }}>START</span>
                    )}
                    {isEnd && (
                      <span className="badge badge-success" style={{ fontSize: '9px' }}>END</span>
                    )}
                    <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {event.tool_name || 'LLM Reasoning'}
                    </span>
                    <span className={`badge ${event.status === 'SUCCESS' ? 'badge-success' : 'badge-critical'}`}>
                      {event.status}
                    </span>
                    {event.is_anomaly && (
                      <span className="badge badge-critical">ANOMALY</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      Step #{event.step || idx + 1}
                    </span>
                    {isSelected ? <ChevronUp size={14} color="var(--text-tertiary)" /> : <ChevronDown size={14} color="var(--text-tertiary)" />}
                  </div>
                </div>

                {/* Metrics row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} color="var(--text-tertiary)" />
                    <span className="mono">{event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '-'}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} color="var(--accent-amber)" />
                    <span className="mono">{Math.round(event.latency_ms)}ms</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={12} color="var(--accent-primary)" />
                    <span className="mono">{event.tokens_used} tk</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <DollarSign size={12} color="var(--accent-green)" />
                    <span className="mono">${event.cost_usd ? event.cost_usd.toFixed(5) : '0.00000'}</span>
                  </span>
                  {event.loop_count > 1 && (
                    <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                      Loop: {event.loop_count}
                    </span>
                  )}
                </div>

                {/* Error Banner */}
                {event.error_message && (
                  <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-red-soft)', border: '1px solid rgba(220, 38, 38, 0.2)', fontSize: '11px', color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
                    Error: {event.error_message}
                  </div>
                )}

                {/* Expanded Event Inspector */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-default)', cursor: 'default' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <h4 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Code size={12} color="var(--accent-primary)" /> Event Telemetry Inspector
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '10px', fontSize: '11px' }}>
                        <div style={{ padding: '6px 8px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                          <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '10px' }}>Event ID</span>
                          <span className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{event.id || '-'}</span>
                        </div>
                        <div style={{ padding: '6px 8px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                          <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '10px' }}>Prompt Length</span>
                          <span className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{event.prompt_length || '-'} chars</span>
                        </div>
                        <div style={{ padding: '6px 8px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                          <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '10px' }}>Response Length</span>
                          <span className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{event.response_length || '-'} chars</span>
                        </div>
                        <div style={{ padding: '6px 8px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                          <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '10px' }}>Isolation Forest Score</span>
                          <span className="mono" style={{ fontWeight: 600, color: event.anomaly_score < -0.5 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                            {event.anomaly_score ? event.anomaly_score.toFixed(4) : 'Normal'}
                          </span>
                        </div>
                      </div>

                      {/* Monospace JSON Viewer */}
                      <div style={{ background: '#18181B', borderRadius: 'var(--radius-sm)', padding: '10px', color: '#F4F4F5', fontFamily: 'var(--font-mono)', fontSize: '11px', overflowX: 'auto' }}>
                        <div style={{ color: '#9CA3AF', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Raw Telemetry Payload JSON
                        </div>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {JSON.stringify(
                            event.raw_payload || {
                              id: event.id,
                              tool_name: event.tool_name,
                              status: event.status,
                              latency_ms: event.latency_ms,
                              tokens_used: event.tokens_used,
                              anomaly_score: event.anomaly_score,
                              error_message: event.error_message
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
