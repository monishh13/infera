import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageWrapper from '../components/Layout/PageWrapper';
import MetricCard from '../components/UI/MetricCard';
import ReliabilityGauge from '../components/ReliabilityGauge/ReliabilityGauge';
import ToolGraph from '../components/ToolGraph/ToolGraph';
import HealthMetricCard from '../components/Health/HealthMetricCard';
import TrendCards from '../components/Trends/TrendCards';
import StatusBadge from '../components/UI/StatusBadge';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import SectionHeader from '../components/UI/SectionHeader';
import EmptyState from '../components/UI/EmptyState';
import { useTelemetry } from '../hooks/useTelemetry';
import client from '../api/client';
import { ArrowLeft, Clock, Zap, CheckCircle, AlertTriangle, Layers, Activity, ExternalLink, HeartPulse, Terminal } from 'lucide-react';

export default function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { telemetry, stats, reliability, loading: telemetryLoading } = useTelemetry(id, 3000);
  const [agent, setAgent] = useState(null);
  const [health, setHealth] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      client.get(`/agents/${id}`).catch(() => null),
      client.get(`/enhanced/agents/${id}/health`).catch(() => null),
      client.get(`/agents/${id}/sessions`).catch(() => null)
    ]).then(([agentRes, healthRes, sessRes]) => {
      if (!isMounted) return;
      if (agentRes?.data) setAgent(agentRes.data);
      if (healthRes?.data) setHealth(healthRes.data);
      if (sessRes?.data && Array.isArray(sessRes.data)) {
        setSessions(sessRes.data);
        if (sessRes.data.length > 0) {
          setSelectedSessionId(sessRes.data[0].id);
        }
      }
      setLoading(false);
    });

    return () => { isMounted = false; };
  }, [id]);

  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeTelemetry = Array.isArray(telemetry) ? telemetry : [];
  const safeTopReasons = Array.isArray(health?.top_reasons) ? health.top_reasons : [];

  if (loading) {
    return (
      <PageWrapper title="Agent Detail">
        <LoadingSkeleton type="metric" count={4} height="84px" />
        <div style={{ marginTop: 'var(--space-4)' }}>
          <LoadingSkeleton type="table" count={5} />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={`Agent — ${agent?.name || id}`}
      description="Agent identity, operational metrics, health index, and execution traces."
    >
      {/* Contextual Breadcrumb & Back Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>Overview</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Agents</span>
          <span>/</span>
          <span className="mono" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{id}</span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <StatusBadge status={health?.status || 'healthy'} size="sm" />
          <span className="badge badge-info">{agent?.type || 'LLM Agent'}</span>
          <span className={`badge badge-${reliability?.risk_level?.toLowerCase() || 'low'}`}>
            {reliability?.risk_level || 'LOW'} RISK
          </span>
        </div>
      </div>

      {/* Main Agent Identity Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          background: '#FFFFFF',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {agent?.name || id}
            </h2>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              {agent?.description || 'Monitored autonomous LLM agent execution flow and telemetry metrics.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11px' }}
          >
            <ArrowLeft size={12} /> Fleet Overview
          </button>
        </div>

        {/* Config Thresholds Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-3)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block' }}>Token Budget</span>
            <span className="mono" style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {agent?.token_budget?.toLocaleString() || '10,000'}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block' }}>Latency Threshold</span>
            <span className="mono" style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {agent?.latency_threshold_ms || '3000'} ms
            </span>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block' }}>Loop Threshold</span>
            <span className="mono" style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {agent?.loop_threshold || '10'} iters
            </span>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block' }}>Failure Threshold</span>
            <span className="mono" style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {(agent?.failure_threshold || 0.3) * 100}%
            </span>
          </div>
        </div>
      </div>

      {/* Agent KPI Summary Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <MetricCard
          title="Reliability Index"
          value={health?.overall_health || reliability?.score || 100.0}
          decimals={1}
          suffix="/100"
          subtitle="Composite Score"
          trend={health?.trend || 'stable'}
          trendColor="var(--accent-green)"
          index={0}
        />
        <MetricCard
          title="Average Latency"
          value={health?.avg_latency || stats?.avg_latency_ms || 382}
          suffix=" ms"
          subtitle="Action Execution"
          trend="Nominal"
          trendColor="var(--text-tertiary)"
          index={1}
        />
        <MetricCard
          title="Tool Success Rate"
          value={Math.round((health?.tool_success_rate ?? stats?.success_rate ?? 1.0) * 100)}
          suffix="%"
          subtitle="Model Tool Invocations"
          trend="Nominal"
          trendColor="var(--accent-green)"
          index={2}
        />
        <MetricCard
          title="Failure Probability"
          value={Math.round((health?.failure_probability || 0.02) * 100)}
          suffix="%"
          subtitle="Next 10 Calls"
          trend="Low Risk"
          trendColor="var(--accent-green)"
          index={3}
        />
      </div>

      {/* Comprehensive Health Report */}
      {health && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <SectionHeader
            title="Health & Risk Breakdown"
            description="Predictive model output and health degradation factors"
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <HealthMetricCard
              label="Overall Health"
              value={health.overall_health}
              unit="/100"
              trend={health.trend}
              icon={Activity}
              color={health.overall_health >= 85 ? 'var(--accent-green)' : (health.overall_health >= 65 ? 'var(--accent-amber)' : 'var(--accent-red)')}
            />
            <HealthMetricCard
              label="Tool Success Rate"
              value={`${Math.round(health.tool_success_rate * 100)}%`}
              icon={CheckCircle}
              color="var(--accent-green)"
            />
            <HealthMetricCard
              label="Avg Action Latency"
              value={`${health.avg_latency}ms`}
              icon={Clock}
              color="var(--accent-amber)"
            />
            <HealthMetricCard
              label="Predicted Failure Prob"
              value={`${Math.round(health.failure_probability * 100)}%`}
              icon={AlertTriangle}
              color={health.failure_probability > 0.15 ? 'var(--accent-red)' : 'var(--accent-green)'}
            />
          </div>

          {/* Key Factors Affecting Health */}
          {safeTopReasons.length > 0 && (
            <div className="glass-panel" style={{ padding: 'var(--space-4)', background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
              <h4 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Key Factors Affecting Health Score
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {safeTopReasons.map((reason, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: reason.severity === 'critical' ? 'var(--accent-red-soft)' : 'var(--accent-amber-soft)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={13} color={reason.severity === 'critical' ? 'var(--accent-red)' : 'var(--accent-amber)'} />
                      <span style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', color: 'var(--text-primary)' }}>{reason.label}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{reason.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metric Trends (P7) */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <TrendCards agentId={id} />
      </div>

      {/* Grid Row: Reliability Gauge + Execution Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
          gap: 'var(--space-5)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <ReliabilityGauge reliability={reliability} />

        <div className="glass-panel" style={{ padding: 'var(--space-4)', background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
          <SectionHeader
            title="Execution Metrics Summary"
            description="Aggregated execution telemetry counters"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={15} color="var(--accent-primary)" />
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)' }}>Average Tokens per Action</span>
              </div>
              <span className="mono" style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {stats?.avg_tokens || 0} tk
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={15} color="var(--accent-amber)" />
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)' }}>Average Action Latency</span>
              </div>
              <span className="mono" style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {stats?.avg_latency_ms || 0} ms
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={15} color="var(--accent-green)" />
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)' }}>Tool Success Rate</span>
              </div>
              <span className="mono" style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--accent-green)' }}>
                {Math.round((stats?.success_rate || 1) * 100)}%
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={15} color="var(--text-tertiary)" />
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)' }}>Total Emitted Events</span>
              </div>
              <span className="mono" style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {stats?.total_events || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Session Tool Invocation DAG Graph */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
          <SectionHeader
            title="Execution Sessions & Tool Graph"
            description="Tool invocation sequence and execution DAG graph"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedSessionId && (
              <Link to={`/sessions/${selectedSessionId}`} className="btn-secondary" style={{ padding: '3px 8px', fontSize: '11px', textDecoration: 'none' }}>
                Inspect Trace <ExternalLink size={11} />
              </Link>
            )}
            {safeSessions.length > 0 && (
              <select
                className="input-field"
                style={{ width: 'auto', padding: '3px 8px', fontSize: '11px' }}
                value={selectedSessionId || ''}
                onChange={e => setSelectedSessionId(e.target.value)}
              >
                {safeSessions.map(s => (
                  <option key={s.id} value={s.id}>Session {s.id} ({s.status})</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <ToolGraph sessionId={selectedSessionId} />
      </div>

      {/* Execution Sessions List Table */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <SectionHeader
          title="Recent Execution Sessions"
          description="Click a session to open detailed execution trace inspector"
        />
        <div className="glass-panel" style={{ overflow: 'hidden', background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
          {safeSessions.length === 0 ? (
            <EmptyState
              icon={Terminal}
              title="No execution sessions recorded"
              description="Start the telemetry stream to begin recording agent execution sessions."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="obs-table">
                <thead>
                  <tr>
                    <th>Session ID</th>
                    <th>Started At</th>
                    <th>Status</th>
                    <th>Total Tokens</th>
                    <th>Total Cost</th>
                    <th>Tool Invocations</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {safeSessions.map(s => (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/sessions/${s.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="mono" style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '11px' }}>
                        {s.id}
                      </td>
                      <td className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {s.started_at ? new Date(s.started_at).toLocaleString() : '-'}
                      </td>
                      <td>
                        <StatusBadge status={s.status} size="sm" />
                      </td>
                      <td className="mono" style={{ fontSize: '11px' }}>
                        {s.total_tokens || 0} tk
                      </td>
                      <td className="mono" style={{ fontSize: '11px' }}>
                        ${s.total_cost_usd ? s.total_cost_usd.toFixed(4) : '0.0000'}
                      </td>
                      <td className="mono" style={{ fontSize: '11px' }}>
                        {s.total_tool_calls || 0} tools ({s.failed_tool_calls || 0} failed)
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/sessions/${s.id}`} className="btn-secondary" style={{ padding: '2px 6px', fontSize: '10px', textDecoration: 'none' }}>
                          Trace Inspector →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
