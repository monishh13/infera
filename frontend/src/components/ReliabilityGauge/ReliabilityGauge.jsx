import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function ReliabilityGauge({ reliability }) {
  if (!reliability) return null;

  const score = Math.round(reliability.score || 100);
  const risk = reliability.risk_level || 'LOW';
  const failureProb = Math.round((reliability.predicted_failure_prob || 0.02) * 100);

  // SVG Gauge calculations
  const radius = 80;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // semicircle
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (s) => {
    if (s >= 85) return '#10b981';
    if (s >= 65) return '#f59e0b';
    return '#ef4444';
  };

  const scoreColor = getScoreColor(score);

  const components = [
    { label: 'Tool Success Rate', weight: '40%', val: `${Math.round((reliability.tool_success_rate || 1) * 100)}%` },
    { label: 'Token Efficiency', weight: '20%', val: `${Math.round((reliability.token_efficiency || 1) * 100)}%` },
    { label: 'Latency Score', weight: '20%', val: `${Math.round((reliability.latency_score || 1) * 100)}%` },
    { label: 'Loop Frequency Score', weight: '20%', val: `${Math.round((reliability.loop_frequency_score || 1) * 100)}%` }
  ];

  return (
    <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
        Agent Reliability Index (ARS)
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '20px' }}>
        Composite health index predicting failure risk
      </p>

      {/* Semicircle SVG Gauge */}
      <div style={{ position: 'relative', width: '200px', margin: '0 auto 10px auto' }}>
        <svg width="200" height="110" viewBox="0 0 200 110">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active arc */}
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
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: scoreColor, fontFamily: 'var(--font-mono)' }}>
            {score}
          </span>
          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Out of 100
          </span>
        </div>
      </div>

      {/* Risk Badge & Failure Prob */}
      <div style={{ marginBottom: '24px' }}>
        <span className={`badge badge-${risk.toLowerCase()}`} style={{ fontSize: '0.85rem', padding: '4px 14px' }}>
          {risk === 'LOW' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
          {risk} RISK LEVEL
        </span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          Estimated Failure Prob (next 10 calls): <strong style={{ color: scoreColor }}>{failureProb}%</strong>
        </p>
      </div>

      {/* 4-Component Score Breakdown Table */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '12px', textAlign: 'left' }}>
          Composite Metrics Breakdown
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
          {components.map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{c.label} <small style={{ color: 'var(--text-dim)' }}>({c.weight})</small></span>
              <span className="mono" style={{ fontWeight: 600, color: '#fff' }}>{c.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
