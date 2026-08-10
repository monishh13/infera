import React from 'react';
import { motion } from 'motion/react';
import PageWrapper from '../components/Layout/PageWrapper';
import { Radio, Server, Brain, Database, BarChart2, Layout, Wifi, Lock, Cpu, ArrowDown } from 'lucide-react';

const pipelineStages = [
  {
    id: 'source',
    label: 'Telemetry Source',
    icon: Radio,
    color: '#8b5cf6',
    description: 'Ingestion layer for agent telemetry data',
    children: [
      { label: 'Simulator', status: 'active', detail: 'Real-time synthetic agent telemetry generation' },
      { label: 'SDK', status: 'coming_soon', detail: 'Phase 2 — Direct instrumentation via Python/JS SDK' },
    ]
  },
  {
    id: 'ingest',
    label: 'POST /telemetry/ingest',
    icon: Wifi,
    color: '#3b82f6',
    description: 'FastAPI ingestion endpoint accepting structured telemetry payloads',
  },
  {
    id: 'backend',
    label: 'FastAPI Backend',
    icon: Server,
    color: '#06b6d4',
    description: 'Async Python backend with SQLAlchemy ORM, JWT auth, and REST API',
  },
  {
    id: 'feature',
    label: 'Feature Engineering',
    icon: Cpu,
    color: '#10b981',
    description: '10-dimensional feature vector extraction with z-scores, rolling stats, and session context',
  },
  {
    id: 'ml',
    label: 'Isolation Forest',
    icon: Brain,
    color: '#f59e0b',
    description: 'Unsupervised anomaly detection with scikit-learn IF model (contamination=0.05)',
  },
  {
    id: 'reliability',
    label: 'Reliability Score',
    icon: BarChart2,
    color: '#ef4444',
    description: 'Composite Agent Reliability Index (0-100) with 4-component weighted scoring',
  },
  {
    id: 'db',
    label: 'PostgreSQL / SQLite',
    icon: Database,
    color: '#8b5cf6',
    description: 'Persistent storage for telemetry events, alerts, scores, and model metadata',
  },
  {
    id: 'dashboard',
    label: 'React Dashboard',
    icon: Layout,
    color: '#3b82f6',
    description: 'Real-time observability dashboard with charts, alerts, and agent monitoring',
  },
];

function PipelineArrow() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
      <motion.div
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ArrowDown size={20} color="var(--text-dim)" />
      </motion.div>
    </div>
  );
}

export default function Architecture() {
  return (
    <PageWrapper title="System Architecture">
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '40px' }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            Infera Platform Architecture
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', maxWidth: '500px', margin: '0 auto' }}>
            Phase 1 data pipeline: from telemetry ingestion through ML anomaly detection to real-time visualization
          </p>
        </motion.div>

        {/* Pipeline */}
        {pipelineStages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <React.Fragment key={stage.id}>
              <motion.div
                className="glass-panel"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
                style={{
                  padding: '20px 24px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Top accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: stage.color, opacity: 0.6 }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: `${stage.color}20`,
                    border: `1px solid ${stage.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={20} color={stage.color} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                      {stage.label}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: '1.5' }}>
                      {stage.description}
                    </p>

                    {/* Telemetry source children */}
                    {stage.children && (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                        {stage.children.map(child => (
                          <div
                            key={child.label}
                            style={{
                              flex: 1,
                              padding: '10px 14px',
                              borderRadius: '8px',
                              background: child.status === 'active' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(107, 114, 128, 0.08)',
                              border: child.status === 'active' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px dashed rgba(107, 114, 128, 0.3)',
                              opacity: child.status === 'active' ? 1 : 0.5,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: child.status === 'active' ? '#fff' : 'var(--text-dim)' }}>
                                {child.label}
                              </span>
                              {child.status === 'active' ? (
                                <span style={{
                                  fontSize: '0.6rem', padding: '1px 6px', borderRadius: '4px',
                                  background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', fontWeight: 700,
                                  textTransform: 'uppercase',
                                }}>Active</span>
                              ) : (
                                <span style={{
                                  fontSize: '0.6rem', padding: '1px 6px', borderRadius: '4px',
                                  background: 'rgba(107, 114, 128, 0.2)', color: 'var(--text-dim)', fontWeight: 700,
                                  textTransform: 'uppercase',
                                }}>
                                  <Lock size={8} style={{ display: 'inline', marginRight: '2px' }} />
                                  Coming Soon
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                              {child.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {idx < pipelineStages.length - 1 && <PipelineArrow />}
            </React.Fragment>
          );
        })}
      </div>
    </PageWrapper>
  );
}
