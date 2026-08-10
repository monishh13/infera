import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scissors, FileText, Cpu, Clock as ClockIcon, Globe, Server, RefreshCw, Shield, Search, AlertTriangle, Activity, GitBranch, Brain, Settings, BarChart2, Eye, Lightbulb } from 'lucide-react';
import client from '../../api/client';

const ICON_MAP = {
  scissors: Scissors,
  'file-text': FileText,
  cpu: Cpu,
  clock: ClockIcon,
  globe: Globe,
  server: Server,
  'refresh-cw': RefreshCw,
  shield: Shield,
  search: Search,
  'alert-triangle': AlertTriangle,
  activity: Activity,
  'git-branch': GitBranch,
  brain: Brain,
  settings: Settings,
  'bar-chart-2': BarChart2,
  eye: Eye,
};

const PRIORITY_COLORS = {
  critical: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)', color: 'var(--danger)' },
  high: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', color: 'var(--warning)' },
  medium: { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.25)', color: 'var(--primary)' },
  low: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)', color: 'var(--success)' },
};

export default function Recommendations({ alertId, expanded = false }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!expanded || !alertId) return;
    setLoading(true);
    client.get(`/enhanced/alerts/${alertId}/recommendations`)
      .then(res => setRecs(Array.isArray(res.data?.recommendations) ? res.data.recommendations : (Array.isArray(res.data) ? res.data : [])))
      .catch(() => setRecs([]))
      .finally(() => setLoading(false));
  }, [alertId, expanded]);

  const safeRecs = Array.isArray(recs) ? recs : [];

  if (!expanded) return null;

  return (
    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
            <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lightbulb size={14} color="var(--warning)" />
              Recommended Actions
            </h5>

            {loading ? (
              <div style={{ padding: '12px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>Loading recommendations...</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {safeRecs.map((rec, idx) => {
                  const Icon = ICON_MAP[rec.icon] || Lightbulb;
                  const prio = PRIORITY_COLORS[rec.priority] || PRIORITY_COLORS.medium;

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.06 }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: prio.bg,
                        border: `1px solid ${prio.border}`,
                        flex: '1 1 calc(50% - 4px)',
                        minWidth: '200px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Icon size={14} color={prio.color} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{rec.action}</span>
                        <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: prio.color, fontWeight: 600, textTransform: 'uppercase' }}>
                          {rec.priority}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {rec.description}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
