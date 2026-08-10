import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import AnimatedCounter from '../UI/AnimatedCounter';

export default function AgentCard({ agent }) {
  const navigate = useNavigate();

  const getScoreColor = (score) => {
    if (score >= 85) return 'var(--success)';
    if (score >= 65) return 'var(--warning)';
    return 'var(--danger)';
  };

  const scoreColor = getScoreColor(agent.reliability_score);
  const tokenPct = Math.min(100, Math.round((agent.current_tokens / (agent.token_budget || 10000)) * 100));

  return (
    <motion.div 
      className="glass-panel"
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/agents/${agent.id}`)}
      style={{
        padding: '24px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{agent.id}</span>
              <span className="badge badge-info">{agent.type}</span>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{agent.name}</h3>
          </div>

          <div style={{
            padding: '8px 14px',
            borderRadius: '12px',
            background: `${scoreColor}15`,
            border: `1px solid ${scoreColor}40`,
            textAlign: 'center'
          }}>
            <AnimatedCounter
              value={agent.reliability_score}
              style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor, fontFamily: 'var(--font-mono)' }}
            />
            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Reliability
            </span>
          </div>
        </div>

        {/* Risk badge & details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <span className={`badge badge-${agent.risk_level?.toLowerCase()}`}>
            <ShieldAlert size={12} />
            {agent.risk_level} RISK
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Budget: <strong style={{ color: '#fff' }}>{agent.token_budget}</strong> tokens
          </span>
        </div>
      </div>

      {/* Progress Bar & Footer */}
      <div>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
            <span>Token Usage Today</span>
            <span>{agent.current_tokens} ({tokenPct}%)</span>
          </div>
          <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${tokenPct}%`,
              background: tokenPct > 90 ? 'var(--danger)' : (tokenPct > 70 ? 'var(--warning)' : 'var(--primary)'),
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.75rem',
          color: 'var(--text-dim)'
        }}>
          <span>{agent.last_event_time ? new Date(agent.last_event_time).toLocaleTimeString() : 'No recent activity'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600 }}>
            Deep Dive <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}
