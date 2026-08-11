import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/Layout/PageWrapper';
import MetricCard from '../components/UI/MetricCard';
import AgentCard from '../components/AgentCard/AgentCard';
import TokenChart from '../components/Charts/TokenChart';
import LatencyChart from '../components/Charts/LatencyChart';
import CostChart from '../components/Charts/CostChart';
import AnomalyLog from '../components/AnomalyLog/AnomalyLog';
import TrendCards from '../components/Trends/TrendCards';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import EmptyState from '../components/UI/EmptyState';
import SectionHeader from '../components/UI/SectionHeader';
import { useAgents } from '../hooks/useAgents';
import client from '../api/client';
import { Terminal } from 'lucide-react';

export default function Dashboard() {
  const { agents, loading: agentsLoading } = useAgents(5000);
  const [overview, setOverview] = useState({
    active_agents: 3,
    alerts_today: 0,
    avg_reliability_score: 100.0,
    cost_today_usd: 0.0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchOverview = () => {
      client.get('/dashboard/overview')
        .then(res => {
          if (isMounted) {
            setOverview(res.data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    };

    fetchOverview();
    const timer = setInterval(fetchOverview, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const safeAgents = Array.isArray(agents) ? agents : [];

  return (
    <PageWrapper
      title="Overview"
      description="Monitor AI agent execution, reliability, cost, and anomalies."
    >
      {/* ROW 1: 4 Primary KPI Cards */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        {loading ? (
          <LoadingSkeleton type="metric" count={4} height="84px" />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            <MetricCard
              title="Active Agents"
              value={overview.active_agents}
              subtitle="Monitored Fleet"
              trend={overview.active_agents > 0 ? "● Active" : "No agents online"}
              trendColor={overview.active_agents > 0 ? "var(--accent-green)" : "var(--text-secondary)"}
              index={0}
            />

            <MetricCard
              title="Alerts (24h)"
              value={overview.alerts_today}
              subtitle="Detected Anomalies"
              trend={overview.alerts_today > 0 ? 'Active Incidents' : 'Nominal'}
              trendColor={overview.alerts_today > 0 ? 'var(--accent-amber)' : 'var(--accent-green)'}
              index={1}
            />

            <MetricCard
              title="Average Reliability"
              value={overview.avg_reliability_score}
              decimals={1}
              suffix="/100"
              subtitle="Predictive Index"
              trend={overview.avg_reliability_score >= 85 ? 'Healthy Fleet' : 'Degraded Performance'}
              trendColor={overview.avg_reliability_score >= 85 ? 'var(--accent-green)' : 'var(--accent-amber)'}
              index={2}
            />

            <MetricCard
              title="Cost Today"
              value={overview.cost_today_usd}
              prefix="$"
              decimals={4}
              subtitle="API Execution Cost"
              trend="24h Window"
              trendColor="var(--text-secondary)"
              index={3}
            />
          </div>
        )}
      </div>

      {/* ROW 3: Primary Analytics Grid (60% Token Throughput + 40% Avg Latency) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: 'var(--space-5)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <TokenChart />
        <LatencyChart />
      </div>

      {/* ROW 4: Secondary Analytics & Fleet Metric Trends */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
          gap: 'var(--space-5)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <CostChart />
        <div className="glass-panel" style={{ padding: 'var(--space-4)' }}>
          <SectionHeader
            title="Fleet Metric Trends"
            description="Agent performance metrics and stability indicators"
          />
          <TrendCards agentId="A001" />
        </div>
      </div>

      {/* ROW 5: Monitored Agent Fleet Table */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <SectionHeader
          title="Monitored Agent Fleet"
          description="Operational state, token budget allocation, and risk metrics"
        />

        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {(() => {
            if (agentsLoading) return <LoadingSkeleton type="table" count={3} />;
            if (safeAgents.length === 0) {
              return (
                <EmptyState
                  icon={Terminal}
                  title="No telemetry data"
                  description="Start the telemetry stream to begin collecting agent metrics."
                />
              );
            }
            return (
              <div style={{ overflowX: 'auto' }}>
                <table className="obs-table">
                  <thead>
                    <tr>
                      <th style={{ width: '70px' }}>Status</th>
                      <th>Agent</th>
                      <th>Type</th>
                      <th>Reliability</th>
                      <th>Latency</th>
                      <th>Tokens</th>
                      <th>Risk</th>
                      <th style={{ textAlign: 'right' }}>Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeAgents.map((agent) => (
                      <AgentCard key={agent.id} agent={agent} />
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ROW 6: Anomaly Event Log */}
      <div>
        <AnomalyLog limit={15} />
      </div>
    </PageWrapper>
  );
}
