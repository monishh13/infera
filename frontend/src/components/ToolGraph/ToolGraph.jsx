import React, { useState, useEffect } from 'react';
import { GitCommit, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import client from '../../api/client';

export default function ToolGraph({ sessionId }) {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    client.get(`/sessions/${sessionId}/tool-graph`)
      .then(res => {
        setGraphData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>
        Select a session to view tool invocation DAG graph
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitCommit size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Tool Invocation Sequence DAG</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            Session <span className="mono">{sessionId}</span> execution flow graph
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>Rendering execution DAG...</div>
      ) : !graphData || !Array.isArray(graphData.nodes) || graphData.nodes.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>No tool calls recorded in this session</div>
      ) : (
        <div style={{ overflowX: 'auto', padding: '20px 0' }}>
          {/* SVG Pipeline View */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 'max-content' }}>
            {graphData.nodes.map((node, i) => {
              const isSuccess = node.status === 'SUCCESS';
              const isAnomaly = node.is_anomaly;
              const bgColor = isAnomaly ? '#FEF2F2' : (isSuccess ? '#F0FDF4' : '#FEF2F2');
              const borderColor = isAnomaly ? '#FCA5A5' : (isSuccess ? '#86EFAC' : '#FCA5A5');

              return (
                <React.Fragment key={node.id}>
                  <div style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    minWidth: '160px',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Step #{node.step}</span>
                      {isSuccess ? <CheckCircle size={14} color="var(--accent-green)" /> : <AlertCircle size={14} color="var(--accent-red)" />}
                    </div>

                    <h4 className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {node.label}
                    </h4>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {Math.round(node.latency_ms)} ms
                      </span>
                      <span>Tokens: <strong>{node.tokens_used}</strong></span>
                      {node.loop_count > 1 && (
                        <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>Loop count: {node.loop_count}</span>
                      )}
                    </div>
                  </div>

                  {i < graphData.nodes.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-tertiary)' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
