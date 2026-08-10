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
      {/* ROW 1: 3 Compact KPI Cards */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        {loading ? (
          <LoadingSkeleton type="metric" count={3} height="84px" />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            <MetricCard
              title="Active Agents"
              value={overview.active_agents}
              subtitle="Monitored Fleet"
              trend="● Active"
              trendColor="var(--accent-green)"
              sparkData={[2, 3, 3, 2, 3, 3, overview.active_agents]}
              sparkColor="var(--accent-primary)"
              index={0}
            />

            <MetricCard
              title="Alerts"
              value={overview.alerts_today}
              subtitle="Last 24h"
              trend={overview.alerts_today > 0 ? 'Active Incidents' : 'No active incidents'}
              trendColor={overview.alerts_today > 0 ? 'var(--accent-amber)' : 'var(--text-secondary)'}
              sparkData={[0, 1, 0, 0, 2, overview.alerts_today]}
              sparkColor={overview.alerts_today > 0 ? 'var(--accent-amber)' : 'var(--accent-green)'}
              index={1}
            />

            <MetricCard
              title="Average Reliability"
              value={overview.avg_reliability_score}
              decimals={1}
              suffix="/100"
              subtitle="Predictive Index"
              trend="+2.4% vs prev"
              trendColor="var(--accent-green)"
              sparkData={[94, 96, 95, 98, 97, overview.avg_reliability_score]}
              sparkColor="var(--accent-green)"
              index={2}
            />
          </div>
        )}
      </div>

      {/* ROW 2: 3 Compact KPI Cards */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        {loading ? (
          <LoadingSkeleton type="metric" count={3} height="84px" />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            <MetricCard
              title="Cost Today"
              value={overview.cost_today_usd}
              prefix="$"
              decimals={4}
              subtitle="API Usage"
              trend="Today"
              trendColor="var(--text-secondary)"
              sparkData={[0.01, 0.02, 0.03, 0.04, overview.cost_today_usd]}
              sparkColor="var(--accent-blue)"
              index={3}
            />

            <MetricCard
              title="Token Allocation"
              value={12480}
              suffix=" tk"
              subtitle="Current Velocity"
              trend="2.1k / min"
              trendColor="var(--text-secondary)"
              sparkData={[8000, 9500, 11000, 12480]}
              sparkColor="var(--accent-primary)"
              index={4}
            />

            <MetricCard
              title="Failure Rate"
              value={0.02}
              decimals={2}
              suffix="%"
              subtitle="Model Invocations"
              trend="Nominal"
              trendColor="var(--accent-green)"
              sparkData={[0.05, 0.04, 0.03, 0.02]}
              sparkColor="var(--accent-green)"
              index={5}
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
