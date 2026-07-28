import { useState, useEffect } from 'react';
import client from '../api/client';

export function useAgents(intervalMs = 5000) {
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAgents = () => {
      client.get('/dashboard/agents/active')
        .then(r => {
          if (isMounted) {
            setAgents(r.data);
            setLoading(false);
          }
        })
        .catch(e => {
          if (isMounted) {
            setError(e);
            setLoading(false);
          }
        });
    };

    fetchAgents();
    const id = setInterval(fetchAgents, intervalMs);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return { agents, error, loading };
}
