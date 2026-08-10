import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, Zap, DollarSign, AlertTriangle, Layers, RefreshCw, Hash, XCircle, Terminal, CheckCircle } from 'lucide-react';
import PageWrapper from '../components/Layout/PageWrapper';
import ExecutionTimeline from '../components/Timeline/ExecutionTimeline';
import SessionReplay from '../components/Timeline/SessionReplay';
import ToolGraph from '../components/ToolGraph/ToolGraph';
import StatusBadge from '../components/UI/StatusBadge';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import SectionHeader from '../components/UI/SectionHeader';
import EmptyState from '../components/UI/EmptyState';
import client from '../api/client';

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [sessionAlerts, setSessionAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replayStep, setReplayStep] = useState(-1);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      client.get(`/enhanced/sessions/${id}/detail`).catch(() => null),
      client.get('/anomalies/?limit=50').catch(() => null)
    ]).then(([detailRes, alertRes]) => {
      if (!isMounted) return;
      if (detailRes?.data) setDetail(detailRes.data);
      if (alertRes?.data && Array.isArray(alertRes.data)) {
        const matching = alertRes.data.filter(a => a.session_id === id);
        setSessionAlerts(matching);
      }
      setLoading(false);
    });

    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return (
      <PageWrapper title="Session Trace Inspector">
        <LoadingSkeleton type="metric" count={4} height="84px" />
        <div style={{ marginTop: 'var(--space-4)' }}>
          <LoadingSkeleton type="table" count={6} />
        </div>
      </PageWrapper>
    );
  }

  if (!detail) {
    return (
      <PageWrapper title="Session Not Found">
        <div className="glass-panel" style={{ padding: 'var(--space-6)', textAlign: 'center', background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
          <EmptyState
            icon={Terminal}
            title={`Session ${id} not found`}
            description="No telemetry events recorded for this session execution."
            action={
              <button onClick={() => navigate(-1)} className="btn-secondary">
                <ArrowLeft size={14} /> Go Back
              </button>
            }
          />
        </div>
      </PageWrapper>
    );
  }

  const stats = detail?.stats || {
    total_events: 0,
    execution_duration_ms: 0,
    avg_latency_ms: 0,
    total_tokens: 0,
    total_tools_used: 0,
    total_cost_usd: 0,
    retries: 0,
    failure_count: 0
  };
  const events = Array.isArray(detail?.events) ? detail.events : [];

  return (
    <PageWrapper
      title={`Session Trace — ${id}`}
      description="Detailed step-by-step telemetry trace inspector, tool DAG graph, and session replay."
    >
      {/* Contextual Breadcrumb & Back Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>Overview</Link>
          <span>/</span>
          <Link to={`/agents/${detail.agent_id}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
            {detail.agent_name || detail.agent_id}
          </Link>
          <span>/</span>
          <span className="mono" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{id}</span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>
            <ArrowLeft size={12} /> Back
          </button>
          <StatusBadge status={detail.status} size="sm" />
        </div>
      </div>

      {/* Session Identity Banner */}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Session <span className="mono" style={{ color: 'var(--accent-primary)' }}>{detail.session_id}</span>
            </h2>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
              Agent: <Link to={`/agents/${detail.agent_id}`} className="mono" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>{detail.agent_name}</Link> ({detail.agent_id})
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '8px' }}>
          {detail.started_at && <span>Started: <strong className="mono">{new Date(detail.started_at).toLocaleString()}</strong></span>}
          {detail.ended_at && <span>Ended: <strong className="mono">{new Date(detail.ended_at).toLocaleString()}</strong></span>}
        </div>
      </div>

      {/* Anomaly Alert Panel (If Anomalies Detected for this Session) */}
      {sessionAlerts.length > 0 && (
        <div
          style={{
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--accent-red-soft)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={16} color="var(--accent-red)" />
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--accent-red)' }}>
              Anomaly Detected in Session
            </h3>
          </div>
          {sessionAlerts.map(alert => (
            <div key={alert.id} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-primary)', marginBottom: '4px' }}>
              <span className="mono" style={{ fontWeight: 600, color: 'var(--accent-red)' }}>[{alert.severity}]</span> {alert.description} (IF Score: {alert.anomaly_score?.toFixed(2)})
            </div>
          ))}
        </div>
      )}

      {/* Execution Stats KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {[
          { label: 'Total Steps', value: stats.total_events, icon: Layers, color: 'var(--accent-primary)' },
          { label: 'Execution Time', value: `${(stats.execution_duration_ms / 1000).toFixed(1)}s`, icon: Clock, color: 'var(--accent-blue)' },
          { label: 'Avg Step Latency', value: `${stats.avg_latency_ms}ms`, icon: Clock, color: 'var(--accent-amber)' },
          { label: 'Total Tokens', value: stats.total_tokens, icon: Zap, color: 'var(--accent-primary)' },
          { label: 'Tools Used', value: stats.total_tools_used, icon: Hash, color: 'var(--accent-blue)' },
          { label: 'Total Cost', value: `$${stats.total_cost_usd.toFixed(4)}`, icon: DollarSign, color: 'var(--accent-green)' },
          { label: 'Retries', value: stats.retries, icon: RefreshCw, color: 'var(--accent-amber)' },
          { label: 'Failures', value: stats.failure_count, icon: XCircle, color: 'var(--accent-red)' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="glass-panel"
              style={{
                padding: 'var(--space-3)',
                background: '#FFFFFF',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>{stat.label}</span>
                <Icon size={14} color={stat.color} />
              </div>
              <span className="mono" style={{ fontSize: 'var(--font-size-metric)', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
                {stat.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Session Tool Invocation DAG Graph */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <SectionHeader
          title="Session Tool Invocation DAG Graph"
          description="Visual tool execution sequence graph"
        />
        <ToolGraph sessionId={id} />
      </div>

      {/* Interactive Session Replay Bar */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <SessionReplay events={events} onStepChange={setReplayStep} />
      </div>

      {/* Step-by-Step Execution Timeline & Event Inspector */}
      <div>
        <ExecutionTimeline events={events} highlightIndex={replayStep} />
      </div>
    </PageWrapper>
  );
}
