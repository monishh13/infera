import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/Layout/PageWrapper';
import AgentCard from '../components/AgentCard/AgentCard';
import TokenChart from '../components/Charts/TokenChart';
import LatencyChart from '../components/Charts/LatencyChart';
import CostChart from '../components/Charts/CostChart';
import AnomalyLog from '../components/AnomalyLog/AnomalyLog';
import { useAgents } from '../hooks/useAgents';
import client from '../api/client';
import { Activity, AlertTriangle, DollarSign, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  const { agents } = useAgents(5000);
  const [overview, setOverview] = useState({
    active_agents: 3,
    alerts_today: 0,
    avg_reliability_score: 100.0,
    cost_today_usd: 0.0
  });

  useEffect(() => {
    let isMounted = true;
    const fetchOverview = () => {
      client.get('/dashboard/overview')
        .then(res => {
          if (isMounted) setOverview(res.data);
        })
        .catch(() => {});
    };

    fetchOverview();
    const timer = setInterval(fetchOverview, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <PageWrapper title="Observability Overview">
      {/* 4 KPI Stat Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Active AI Agents</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)' }}>
              <Activity size={20} />
            </div>
          </div>
          <span className="mono" style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{overview.active_agents}</span>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px' }}>● 100% Monitored</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Alerts (Last 24h)</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <span className="mono" style={{ fontSize: '2rem', fontWeight: 800, color: overview.alerts_today > 0 ? 'var(--warning)' : '#fff' }}>
            {overview.alerts_today}
          </span>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Isolation Forest & Rules</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Avg Reliability Score</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
              <ShieldCheck size={20} />
            </div>
          </div>
          <span className="mono" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>
            {overview.avg_reliability_score}
          </span>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Predictive Composite Index</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Cost Today (USD)</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <span className="mono" style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
            ${overview.cost_today_usd.toFixed(4)}
          </span>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>API Token Expenditure</span>
        </div>
      </div>

      {/* Active Agents Cards Grid */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Monitored Agent Fleet</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* Token Chart */}
      <div style={{ marginBottom: '32px' }}>
        <TokenChart />
      </div>

      {/* Analytics Breakdown Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <LatencyChart />
        <CostChart />
      </div>

      {/* Live Anomaly Log */}
      <div>
        <AnomalyLog limit={15} />
      </div>
    </PageWrapper>
  );
}
