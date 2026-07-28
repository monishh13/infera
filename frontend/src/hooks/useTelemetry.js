import { useState, useEffect } from 'react';
import client from '../api/client';

export function useTelemetry(agentId, intervalMs = 3000) {
  const [telemetry, setTelemetry] = useState([]);
  const [stats, setStats] = useState(null);
  const [reliability, setReliability] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agentId) return;
    let isMounted = true;

    const fetchData = () => {
      Promise.all([
        client.get(`/telemetry/${agentId}?limit=30`),
        client.get(`/telemetry/${agentId}/stats`),
        client.get(`/agents/${agentId}/reliability`)
      ])
        .then(([telRes, statsRes, relRes]) => {
          if (isMounted) {
            setTelemetry(telRes.data);
            setStats(statsRes.data);
            setReliability(relRes.data);
            setLoading(false);
          }
        })
        .catch(err => {
          if (isMounted) {
            setError(err);
            setLoading(false);
          }
        });
    };

    fetchData();
    const timer = setInterval(fetchData, intervalMs);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [agentId, intervalMs]);

  return { telemetry, stats, reliability, error, loading };
}
