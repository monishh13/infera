import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export default function ReliabilityGauge({ reliability }) {
  if (!reliability) return null;

  const score = Math.round(reliability.score || 100);
  const risk = reliability.risk_level || 'LOW';
  const failureProb = Math.round((reliability.predicted_failure_prob || 0.02) * 100);

  // SVG Gauge calculations
  const radius = 80;
  const strokeWidth = 12;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (s) => {
    if (s >= 85) return 'var(--accent-green)';
    if (s >= 65) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  const scoreColor = getScoreColor(score);

  const components = [
    { label: 'Tool Success Rate', weight: '40%', val: `${Math.round((reliability.tool_success_rate || 1) * 100)}%` },
    { label: 'Token Efficiency', weight: '20%', val: `${Math.round((reliability.token_efficiency || 1) * 100)}%` },
    { label: 'Latency Score', weight: '20%', val: `${Math.round((reliability.latency_score || 1) * 100)}%` },
    { label: 'Loop Frequency Score', weight: '20%', val: `${Math.round((reliability.loop_frequency_score || 1) * 100)}%` }
  ];

  return (
    <div className="glass-panel" style={{ padding: 'var(--space-4)', textAlign: 'center', background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
        Agent Reliability Index (ARS)
      </h3>
      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>
        Composite health index predicting failure risk
      </p>

      {/* Semicircle SVG Gauge */}
      <div style={{ position: 'relative', width: '200px', margin: '0 auto 10px auto' }}>
        <svg width="200" height="110" viewBox="0 0 200 110">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#EEF0F3"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
          />
        </svg>

        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: 0,
          right: 0,
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '2.2rem', fontWeight: 800, color: scoreColor, fontFamily: 'var(--font-sans)', lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: '2px' }}>
            Out of 100
          </span>
        </div>
      </div>

      {/* Risk Badge & Failure Prob */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <span className={`badge badge-${risk.toLowerCase()}`} style={{ fontSize: '11px', padding: '3px 10px' }}>
          {risk === 'LOW' ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
          {risk} RISK LEVEL
        </span>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '8px' }}>
          Failure Probability (next 10 calls): <strong style={{ color: scoreColor }}>{failureProb}%</strong>
        </p>
      </div>

      {/* 4-Component Score Breakdown */}
      <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-3)' }}>
        <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '8px', textAlign: 'left' }}>
          Composite Metrics Breakdown
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
          {components.map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{c.label} <small style={{ color: 'var(--text-tertiary)' }}>({c.weight})</small></span>
              <span className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
