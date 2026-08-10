import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Zap, DollarSign, AlertTriangle, Layers, RefreshCw, Hash, XCircle } from 'lucide-react';
import PageWrapper from '../components/Layout/PageWrapper';
import ExecutionTimeline from '../components/Timeline/ExecutionTimeline';
import SessionReplay from '../components/Timeline/SessionReplay';
import StatusBadge from '../components/UI/StatusBadge';
import AnimatedCounter from '../components/UI/AnimatedCounter';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import client from '../api/client';

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replayStep, setReplayStep] = useState(-1);

  useEffect(() => {
    client.get(`/enhanced/sessions/${id}/detail`)
      .then(res => {
        setDetail(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <PageWrapper title="Session Detail">
        <LoadingSkeleton type="card" count={4} height="120px" />
        <div style={{ marginTop: '24px' }}>
          <LoadingSkeleton type="table" count={6} />
        </div>
      </PageWrapper>
    );
  }

  if (!detail) {
    return (
      <PageWrapper title="Session Not Found">
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
          Session {id} not found. It may not have any events recorded yet.
          <div style={{ marginTop: '16px' }}>
            <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
          </div>
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
    <PageWrapper title={`Session — ${id}`}>
      {/* Back button and header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <StatusBadge status={detail.status} size="md" />
        </div>
      </div>

      {/* Session Banner */}
      <motion.div
        className="glass-panel"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: '24px', marginBottom: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            Session <span className="mono" style={{ color: 'var(--primary)' }}>{detail.session_id}</span>
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Agent: <span className="mono" style={{ color: 'var(--primary)', fontWeight: 600 }}>{detail.agent_name}</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '24px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          {detail.started_at && <span>Started: {new Date(detail.started_at).toLocaleString()}</span>}
          {detail.ended_at && <span>Ended: {new Date(detail.ended_at).toLocaleString()}</span>}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Events', value: stats.total_events, icon: Layers, color: 'var(--primary)' },
          { label: 'Execution Time', value: `${(stats.execution_duration_ms / 1000).toFixed(1)}s`, icon: Clock, color: 'var(--accent)' },
          { label: 'Avg Latency', value: `${stats.avg_latency_ms}ms`, icon: Clock, color: 'var(--warning)' },
          { label: 'Total Tokens', value: stats.total_tokens, icon: Zap, color: 'var(--primary)' },
          { label: 'Tools Used', value: stats.total_tools_used, icon: Hash, color: 'var(--accent)' },
          { label: 'Total Cost', value: `$${stats.total_cost_usd.toFixed(4)}`, icon: DollarSign, color: 'var(--success)' },
          { label: 'Retries', value: stats.retries, icon: RefreshCw, color: 'var(--warning)' },
          { label: 'Failures', value: stats.failure_count, icon: XCircle, color: 'var(--danger)' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="glass-panel kpi-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
              style={{ padding: '16px', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: stat.color, opacity: 0.5 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 500 }}>{stat.label}</span>
                <Icon size={15} color={stat.color} />
              </div>
              <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                {stat.value}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Session Replay */}
      <div style={{ marginBottom: '24px' }}>
        <SessionReplay events={events} onStepChange={setReplayStep} />
      </div>

      {/* Execution Timeline */}
      <div>
        <ExecutionTimeline events={events} highlightIndex={replayStep} />
      </div>
    </PageWrapper>
  );
}
