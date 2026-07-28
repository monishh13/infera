import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/Layout/PageWrapper';
import client from '../api/client';
import { Sliders, Zap, Check, AlertCircle } from 'lucide-react';

export default function Settings() {
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('A001');
  const [thresholds, setThresholds] = useState({
    token_budget: 10000,
    latency_threshold_ms: 3000.0,
    loop_threshold: 10,
    failure_threshold: 0.30
  });

  // Injector state
  const [injectAgentId, setInjectAgentId] = useState('A001');
  const [anomalyType, setAnomalyType] = useState('token_spike');
  const [durationEvents, setDurationEvents] = useState(5);
  const [injectMessage, setInjectMessage] = useState('');
  const [injectLoading, setInjectLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    client.get('/agents/')
      .then(res => {
        setAgents(res.data);
        if (res.data.length > 0) {
          const first = res.data[0];
          setSelectedAgentId(first.id);
          setThresholds({
            token_budget: first.token_budget,
            latency_threshold_ms: first.latency_threshold_ms,
            loop_threshold: first.loop_threshold,
            failure_threshold: first.failure_threshold
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleAgentSelect = (id) => {
    setSelectedAgentId(id);
    const found = agents.find(a => a.id === id);
    if (found) {
      setThresholds({
        token_budget: found.token_budget,
        latency_threshold_ms: found.latency_threshold_ms,
        loop_threshold: found.loop_threshold,
        failure_threshold: found.failure_threshold
      });
    }
  };

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    try {
      await client.put(`/agents/${selectedAgentId}`, thresholds);
      setSaveMessage(`Successfully updated threshold configuration for ${selectedAgentId}`);
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInjectAnomaly = async (e) => {
    e.preventDefault();
    setInjectLoading(true);
    setInjectMessage('');

    try {
      const res = await client.post('/simulator/inject-anomaly', {
        agent_id: injectAgentId,
        anomaly_type: anomalyType,
        duration_events: parseInt(durationEvents, 10)
      });
      setInjectMessage(res.data.message);
    } catch (err) {
      setInjectMessage(err.response?.data?.detail || 'Failed to inject anomaly');
    } finally {
      setInjectLoading(false);
    }
  };

  return (
    <PageWrapper title="Settings & Anomaly Injector">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '32px' }}>
        
        {/* Panel 1: Per-Agent Threshold Editor */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Sliders size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Agent Threshold Editor</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '24px' }}>
            Tune individual agent anomaly trigger boundaries
          </p>

          {saveMessage && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', fontSize: '0.85rem', marginBottom: '16px' }}>
              <Check size={14} style={{ display: 'inline', marginRight: '6px' }} /> {saveMessage}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Select Target Agent</label>
            <select className="input-field" value={selectedAgentId} onChange={e => handleAgentSelect(e.target.value)}>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.id} — {a.name}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSaveThresholds} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Session Token Budget</label>
              <input 
                type="number" 
                className="input-field mono" 
                value={thresholds.token_budget} 
                onChange={e => setThresholds({ ...thresholds, token_budget: parseInt(e.target.value, 10) })} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Latency Threshold (ms)</label>
              <input 
                type="number" 
                className="input-field mono" 
                value={thresholds.latency_threshold_ms} 
                onChange={e => setThresholds({ ...thresholds, latency_threshold_ms: parseFloat(e.target.value) })} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Loop Iteration Threshold</label>
              <input 
                type="number" 
                className="input-field mono" 
                value={thresholds.loop_threshold} 
                onChange={e => setThresholds({ ...thresholds, loop_threshold: parseInt(e.target.value, 10) })} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Failure Threshold Rate (0.0 - 1.0)</label>
              <input 
                type="number" 
                step="0.05"
                className="input-field mono" 
                value={thresholds.failure_threshold} 
                onChange={e => setThresholds({ ...thresholds, failure_threshold: parseFloat(e.target.value) })} 
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
              Save Threshold Configuration
            </button>
          </form>
        </div>

        {/* Panel 2: Viva Demo On-Demand Anomaly Injector */}
        <div className="glass-panel" style={{ padding: '28px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Zap size={20} color="var(--warning)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Viva Demo Anomaly Injector</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '24px' }}>
            Inject real-time behavioral anomalies into running simulator streams for live demonstration
          </p>

          {injectMessage && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#fff', fontSize: '0.85rem', marginBottom: '16px' }}>
              {injectMessage}
            </div>
          )}

          <form onSubmit={handleInjectAnomaly} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Target Agent</label>
              <select className="input-field" value={injectAgentId} onChange={e => setInjectAgentId(e.target.value)}>
                <option value="A001">Customer Support Agent (A001)</option>
                <option value="A002">Deep Research Agent (A002)</option>
                <option value="A003">Sales Representative Agent (A003)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Anomaly Type</label>
              <select className="input-field" value={anomalyType} onChange={e => setAnomalyType(e.target.value)}>
                <option value="token_spike">Token Consumption Spike (5x-15x normal tokens)</option>
                <option value="infinite_loop">Infinite Reasoning Loop (loop_count increments)</option>
                <option value="high_latency">High Latency Spike (4x-10x baseline latency)</option>
                <option value="tool_failure_cascade">Tool Failure Cascade (consecutive FAILURE events)</option>
                <option value="behavioral_drift">Behavioral Drift (gradual token increase over time)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Duration (Number of Telemetry Events)</label>
              <input 
                type="number" 
                className="input-field mono" 
                value={durationEvents} 
                onChange={e => setDurationEvents(e.target.value)} 
                min="1"
                max="20"
              />
            </div>

            <button 
              type="submit" 
              disabled={injectLoading}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                fontWeight: 700,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px 0 var(--warning-glow)',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Zap size={18} />
              {injectLoading ? 'Injecting Anomaly...' : 'Inject Anomaly Live'}
            </button>
          </form>
        </div>

      </div>
    </PageWrapper>
  );
}
