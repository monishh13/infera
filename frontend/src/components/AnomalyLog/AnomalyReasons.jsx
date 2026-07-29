import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Clock, XCircle, Repeat, AlertTriangle, Layers, TrendingUp } from 'lucide-react';
import client from '../../api/client';

const ICON_MAP = {
  brain: Brain,
  zap: Zap,
  clock: Clock,
  'x-circle': XCircle,
  repeat: Repeat,
  'alert-triangle': AlertTriangle,
  layers: Layers,
  'trending-up': TrendingUp,
};

export default function AnomalyReasons({ alertId, expanded = false }) {
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!expanded || !alertId) return;
    setLoading(true);
    client.get(`/enhanced/alerts/${alertId}/reasons`)
      .then(res => setReasons(res.data.reasons || []))
      .catch(() => setReasons([]))
      .finally(() => setLoading(false));
  }, [alertId, expanded]);

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
            <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Why This Alert Was Generated
            </h5>

            {loading ? (
              <div style={{ padding: '12px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>Analyzing anomaly reasons...</div>
            ) : reasons.length === 0 ? (
              <div style={{ padding: '12px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>No detailed reasons available</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {reasons.map((reason, idx) => {
                  const Icon = ICON_MAP[reason.icon] || AlertTriangle;
                  const severityColor = reason.severity === 'critical' ? 'var(--danger)' : (reason.severity === 'warning' ? 'var(--warning)' : 'var(--primary)');

                  return (
                    <motion.div
                      key={idx}
                      className={`reason-chip ${reason.severity}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div style={{ marginTop: '2px' }}>
                        <Icon size={14} color={severityColor} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: severityColor, marginBottom: '2px' }}>
                          {reason.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {reason.detail}
                        </div>
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
