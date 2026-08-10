import React from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedCounter from '../UI/AnimatedCounter';
import StatusBadge from '../UI/StatusBadge';
import LiveIndicator from '../UI/LiveIndicator';

export default function AgentCard({ agent }) {
  const navigate = useNavigate();

  const score = typeof agent.reliability_score === 'number' ? agent.reliability_score : 100;
  const tokenBudget = agent.token_budget || 10000;
  const currentTokens = agent.current_tokens || 0;
  const tokenPct = Math.min(100, Math.round((currentTokens / tokenBudget) * 100));

  const riskLevel = (agent.risk_level || 'LOW').toUpperCase();
  const sourceLabel = agent.source === 'sdk' ? 'SDK' : 'Sim';

  const formattedTime = agent.last_event_time
    ? new Date(agent.last_event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Idle';

  return (
    <tr
      onClick={() => navigate(`/agents/${agent.id}`)}
      style={{
        cursor: 'pointer',
        transition: 'background-color 0.12s ease',
      }}
    >
      {/* Status */}
      <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LiveIndicator active={true} color="var(--accent-green)" size={5} />
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
            {agent.id}
          </span>
        </div>
      </td>

      {/* Agent Name */}
      <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, color: 'var(--text-primary)' }}>
        {agent.name}
      </td>

      {/* Type Tag & Source */}
      <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '1px 6px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '10px',
              fontWeight: 500,
              background: 'var(--surface-2)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
            }}
          >
            {agent.type || 'LLM Agent'}
          </span>
          <span
            style={{
              display: 'inline-block',
              padding: '1px 5px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '9px',
              fontWeight: 600,
              background: agent.source === 'sdk' ? 'var(--accent-primary-soft)' : 'var(--surface-2)',
              color: agent.source === 'sdk' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              border: agent.source === 'sdk' ? '1px solid var(--accent-primary-border)' : '1px solid var(--border-subtle)',
            }}
          >
            {sourceLabel}
          </span>
        </div>
      </td>

      {/* Reliability Index */}
      <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AnimatedCounter
            value={score}
            decimals={1}
            style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>/ 100</span>
        </div>
      </td>

      {/* Latency */}
      <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }} className="mono">
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          {agent.latency_threshold_ms ? `${Math.round(agent.latency_threshold_ms)}ms` : '382ms'}
        </span>
      </td>

      {/* Token Allocation */}
      <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }} className="mono">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '130px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)' }}>
            <span>{currentTokens.toLocaleString()} tk</span>
            <span>{tokenPct}%</span>
          </div>
          <div style={{ height: '3px', width: '100%', background: '#EEF0F3', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${tokenPct}%`,
                background: tokenPct > 90 ? 'var(--accent-red)' : (tokenPct > 70 ? 'var(--accent-amber)' : 'var(--accent-primary)'),
              }}
            />
          </div>
        </div>
      </td>

      {/* Risk Badge */}
      <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <StatusBadge status={riskLevel === 'LOW' ? 'healthy' : riskLevel.toLowerCase()} size="sm" />
      </td>

      {/* Last Activity */}
      <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', textAlign: 'right' }}>
        <span className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
          {formattedTime}
        </span>
      </td>
    </tr>
  );
}
