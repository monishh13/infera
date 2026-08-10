import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, AlertTriangle, Clock, Zap, DollarSign } from 'lucide-react';

const statusIcon = (status, isAnomaly) => {
  if (isAnomaly) return <XCircle size={12} />;
  if (status === 'SUCCESS') return <CheckCircle size={12} />;
  if (status === 'TIMEOUT') return <AlertTriangle size={12} />;
  return <XCircle size={12} />;
};

const statusClass = (status, isAnomaly) => {
  if (isAnomaly) return 'anomaly';
  if (status === 'SUCCESS') return 'success';
  if (status === 'TIMEOUT') return 'warning';
  return 'failure';
};

export default function ExecutionTimeline({ events = [], highlightIndex = -1 }) {
  const safeEvents = Array.isArray(events) ? events : [];

  if (!safeEvents || safeEvents.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>
        No events recorded for this session
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={20} color="var(--primary)" />
        Execution Timeline
      </h3>

      <div style={{ position: 'relative', paddingLeft: '4px' }}>
        {/* Vertical connecting line */}
        <div className="timeline-line" />

        {safeEvents.map((event, idx) => {
          const cls = statusClass(event.status, event.is_anomaly);
          const isHighlighted = highlightIndex === idx;
          const isStart = idx === 0;
          const isEnd = idx === events.length - 1;

          return (
            <motion.div
              key={event.id || idx}
              className="timeline-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.35, ease: 'easeOut' }}
              style={{
                background: isHighlighted ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                borderRadius: '8px',
                marginLeft: '-4px',
                paddingTop: '8px',
                paddingBottom: idx === events.length - 1 ? '8px' : '24px',
              }}
            >
              {/* Timeline dot */}
              <div className={`timeline-dot ${cls}`}>
                {statusIcon(event.status, event.is_anomaly)}
              </div>

              {/* Event card */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  background: event.is_anomaly
                    ? 'rgba(239, 68, 68, 0.08)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: event.is_anomaly
                    ? '1px solid rgba(239, 68, 68, 0.25)'
                    : '1px solid var(--border-color)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isStart && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', fontWeight: 600 }}>
                        START
                      </span>
                    )}
                    {isEnd && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontWeight: 600 }}>
                        END
                      </span>
                    )}
                    <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {event.tool_name}
                    </span>
                    <span className={`badge badge-${event.status === 'SUCCESS' ? 'low' : 'critical'}`} style={{ fontSize: '0.65rem' }}>
                      {event.status}
                    </span>
                    {event.is_anomaly && (
                      <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>ANOMALY</span>
                    )}
                  </div>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Step #{event.step}
                  </span>
                </div>

                {/* Metrics row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} color="var(--accent)" />
                    <span className="mono">{event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '-'}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} color="var(--warning)" />
                    <span className="mono">{event.latency_ms}ms</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={13} color="var(--primary)" />
                    <span className="mono">{event.tokens_used} tokens</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <DollarSign size={13} color="var(--accent)" />
                    <span className="mono">${event.cost_usd?.toFixed(5) || '0.00000'}</span>
                  </span>
                  {event.loop_count > 1 && (
                    <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                      Loop: {event.loop_count}
                    </span>
                  )}
                </div>

                {/* Error message */}
                {event.error_message && (
                  <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', fontSize: '0.75rem', color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
                    {event.error_message}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
