import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/Layout/PageWrapper';
import SectionHeader from '../components/UI/SectionHeader';
import MetricCard from '../components/UI/MetricCard';
import client from '../api/client';
import { Bot, Cpu, Zap, AlertTriangle, CheckCircle, RefreshCw, Send, ShieldAlert, Terminal } from 'lucide-react';

export default function RealAgentPlayground() {
  const [selectedPreset, setSelectedPreset] = useState('workflow'); // workflow | adversarial | custom
  const [customPrompt, setCustomPrompt] = useState('');
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = () => {
    client.get('/telemetry/A004')
      .then(res => {
        setHistory(Array.isArray(res.data) ? res.data : []);
        setLoadingHistory(false);
      })
      .catch(() => setLoadingHistory(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleExecute = async () => {
    setErrorMsg(null);
    setExecuting(true);

    const payload = {
      adversarial_mode: selectedPreset === 'adversarial',
      prompt: selectedPreset === 'custom' ? customPrompt.trim() : (selectedPreset === 'workflow' ? "Check weather in Tokyo, convert 100 USD to JPY, and summarize." : null)
    };

    try {
      const response = await client.post('/simulator/real-llm/execute', payload);
      setExecutionResult(response.data);
      fetchHistory();
    } catch (err) {
      console.error("Real LLM Execution Error:", err);
      const msg = err.response?.data?.detail || err.message || "Failed to communicate with Real LLM Agent";
      setErrorMsg(msg);
    } finally {
      setExecuting(false);
    }
  };

  const isCustomDisabled = selectedPreset === 'custom' && (!customPrompt.trim() || customPrompt.length > 500);

  return (
    <PageWrapper
      title="Real LLM Agent Playground"
      description="Live interactive control room for Agent A004 powered by Groq (llama-3.1-8b-instant)."
    >
      {/* SECTION 1: Control Panel & Presets */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <SectionHeader
          title="Interactive Execution Controls"
          description="Trigger real LLM tool-calling steps or adversarial prompts and observe real-time telemetry."
        />

        <div className="glass-panel" style={{ padding: 'var(--space-5)' }}>
          {/* Preset Buttons */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
            <button
              onClick={() => { setSelectedPreset('workflow'); setErrorMsg(null); }}
              className={selectedPreset === 'workflow' ? 'btn-primary' : 'btn-secondary'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Zap size={15} />
              Multi-Step Tool Workflow
            </button>

            <button
              onClick={() => { setSelectedPreset('adversarial'); setErrorMsg(null); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                background: selectedPreset === 'adversarial' ? 'var(--accent-red-soft)' : 'var(--surface-2)',
                color: selectedPreset === 'adversarial' ? 'var(--accent-red)' : 'var(--text-secondary)',
                border: selectedPreset === 'adversarial' ? '1px solid var(--accent-red)' : '1px solid var(--border-default)'
              }}
            >
              <AlertTriangle size={15} />
              Adversarial Token Spike Preset
            </button>

            <button
              onClick={() => { setSelectedPreset('custom'); setErrorMsg(null); }}
              className={selectedPreset === 'custom' ? 'btn-primary' : 'btn-secondary'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Bot size={15} />
              Custom User Inquiry
            </button>
          </div>

          {/* Custom Input Guarded Text Field */}
          {selectedPreset === 'custom' && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Enter Prompt for Agent A004 (Groq llama-3.1-8b-instant):
                </label>
                <span style={{ fontSize: '11px', color: customPrompt.length > 500 ? 'var(--accent-red)' : 'var(--text-tertiary)' }}>
                  {customPrompt.length} / 500 chars
                </span>
              </div>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Summarize customer ticket #4029 and calculate shipping estimate..."
                rows={3}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-1)',
                  border: customPrompt.length > 500 ? '1px solid var(--accent-red)' : '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
          )}

          {/* Execute Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
              Agent ID: <strong>A004</strong> | Model: <strong>Groq llama-3.1-8b-instant</strong>
            </span>

            <button
              onClick={handleExecute}
              disabled={executing || isCustomDisabled}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-5)',
                borderRadius: 'var(--radius-md)',
                background: executing || isCustomDisabled ? 'var(--surface-3)' : 'var(--accent-primary)',
                color: executing || isCustomDisabled ? 'var(--text-dim)' : '#000000',
                fontWeight: 700,
                fontSize: 'var(--font-size-sm)',
                border: 'none',
                cursor: executing || isCustomDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {executing ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  Executing Groq Step...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Execute Real LLM Step
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ERROR BANNER IF TIMEOUT OR 429 */}
      {errorMsg && (
        <div style={{
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--accent-red)',
          color: 'var(--accent-red)',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)'
        }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', fontSize: 'var(--font-size-sm)' }}>Execution Failure / Rate Limit</strong>
            <span style={{ fontSize: 'var(--font-size-xs)' }}>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* SECTION 2: Live Execution Result Banner & ML Scoring */}
      {executionResult && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <SectionHeader
            title="Real-Time Telemetry & ML Scoring Engine Output"
            description="Ingested directly via process_single_telemetry into 10D Feature Engineering and Isolation Forest."
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
            <MetricCard
              title="Real Tokens Used"
              value={executionResult.tokens_used}
              subtitle="Groq API Usage Output"
              trend={executionResult.tokens_used > 400 ? "High Usage" : "Nominal"}
              trendColor={executionResult.tokens_used > 400 ? "var(--accent-amber)" : "var(--accent-green)"}
              index={0}
            />

            <MetricCard
              title="Measured Latency"
              value={executionResult.latency_ms}
              decimals={1}
              suffix=" ms"
              subtitle="Network + Inference Time"
              trend={executionResult.latency_ms > 1500 ? "High Latency" : "Fast"}
              trendColor={executionResult.latency_ms > 1500 ? "var(--accent-amber)" : "var(--accent-green)"}
              index={1}
            />

            <MetricCard
              title="Isolation Forest Score"
              value={executionResult.anomaly_score}
              decimals={3}
              subtitle="Unsupervised Outlier Score"
              trend={executionResult.is_anomaly ? "ANOMALY DETECTED" : "NOMINAL"}
              trendColor={executionResult.is_anomaly ? "var(--accent-red)" : "var(--accent-green)"}
              index={2}
            />

            <MetricCard
              title="Agent Reliability (ARS)"
              value={executionResult.reliability_score}
              decimals={1}
              suffix="/100"
              subtitle="Calculated Fleet Health"
              trend={executionResult.reliability_score >= 80 ? "Healthy" : "Degraded"}
              trendColor={executionResult.reliability_score >= 80 ? "var(--accent-green)" : "var(--accent-red)"}
              index={3}
            />
          </div>

          {/* Detailed Response & Telemetry Breakdown */}
          <div className="glass-panel" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Cpu size={16} color="var(--accent-primary)" />
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  LLM Response & Step Status
                </h4>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <span className={`status-badge status-${executionResult.status.toLowerCase()}`}>
                  {executionResult.status}
                </span>
                {executionResult.is_anomaly && (
                  <span className="status-badge status-critical">
                    ML Anomaly
                  </span>
                )}
                {executionResult.alert_generated && (
                  <span className="status-badge status-warning">
                    Alert Generated
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
              Prompt: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{executionResult.prompt_used}</span> | Tool: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{executionResult.tool_name}</span>
            </div>

            {/* Truncated scrollable response container */}
            <div
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-1)',
                border: '1px solid var(--border-subtle)',
                maxHeight: '220px',
                overflowY: 'auto',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5
              }}
            >
              {executionResult.response_text || executionResult.error_message || "No content returned."}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Agent A004 Telemetry Event Log */}
      <div>
        <SectionHeader
          title="Agent A004 Ingestion History"
          description="Recent telemetry records emitted by the Real LLM Agent into PostgreSQL datastore."
        />

        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {loadingHistory ? (
            <div style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              Loading telemetry history...
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <Terminal size={32} style={{ marginBottom: 'var(--space-2)', opacity: 0.5 }} />
              <p>No telemetry events recorded for Agent A004 yet.</p>
              <span style={{ fontSize: 'var(--font-size-xs)' }}>Click "Execute Real LLM Step" above to generate live telemetry.</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="obs-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Tool Step</th>
                    <th>Tokens Used</th>
                    <th>Latency (ms)</th>
                    <th>Loop</th>
                    <th>Anomaly Score</th>
                    <th>ML Outlier</th>
                    <th style={{ textAlign: 'right' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 10).map((ev) => (
                    <tr key={ev.id}>
                      <td>
                        <span className={`status-badge status-${(ev.status || 'SUCCESS').toLowerCase()}`}>
                          {ev.status || 'SUCCESS'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{ev.tool_name || 'llm_call'}</td>
                      <td>{ev.tokens_used} tok</td>
                      <td>{ev.latency_ms ? ev.latency_ms.toFixed(1) : 0} ms</td>
                      <td>{ev.loop_count || 1}</td>
                      <td style={{ fontFamily: 'monospace' }}>{ev.anomaly_score ? ev.anomaly_score.toFixed(3) : '0.000'}</td>
                      <td>
                        {ev.is_anomaly ? (
                          <span style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: '11px' }}>● YES</span>
                        ) : (
                          <span style={{ color: 'var(--accent-green)', fontSize: '11px' }}>NOMINAL</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-tertiary)', fontSize: '11px' }}>
                        {new Date(ev.timestamp).toLocaleTimeString()}
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
