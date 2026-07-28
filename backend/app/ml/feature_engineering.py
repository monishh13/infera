import numpy as np
from typing import List, Dict, Any

MAX_SESSION_LEN = 100.0

def extract_features(event: Dict[str, Any], agent_history: List[Dict[str, Any]]) -> np.ndarray:
    """
    Converts a telemetry event and historical context into a 10-dimensional feature vector.
    """
    tokens = float(event.get('tokens_used', 0))
    latency = float(event.get('latency_ms', 0.0))
    loop_count = float(event.get('loop_count', 1))
    status = event.get('status', 'SUCCESS')
    is_failure = 1.0 if status != 'SUCCESS' else 0.0
    
    hist_tok = [float(e.get('tokens_used', 0)) for e in agent_history] if agent_history else [tokens]
    hist_lat = [float(e.get('latency_ms', 0.0)) for e in agent_history] if agent_history else [latency]
    
    tok_mean = float(np.mean(hist_tok)) if hist_tok else tokens
    tok_std = float(np.std(hist_tok)) + 1e-6 if hist_tok else 1.0
    
    lat_mean = float(np.mean(hist_lat)) if hist_lat else latency
    lat_std = float(np.std(hist_lat)) + 1e-6 if hist_lat else 1.0
    
    tokens_zscore = (tokens - tok_mean) / tok_std
    latency_zscore = (latency - lat_mean) / lat_std
    
    tokens_per_ms = tokens / (latency + 1e-6)
    
    last10 = agent_history[-10:] if agent_history else [event]
    fail_count = sum(1 for e in last10 if e.get('status') != 'SUCCESS')
    rolling_fail_rate = float(fail_count) / float(max(len(last10), 1))
    
    rolling_avg_tokens = float(np.mean([float(e.get('tokens_used', 0)) for e in last10])) if last10 else tokens
    
    events_in_session = float(len(agent_history) + 1)
    session_age_ratio = min(1.0, events_in_session / MAX_SESSION_LEN)
    
    return np.array([
        tokens,
        tokens_zscore,
        latency,
        latency_zscore,
        loop_count,
        is_failure,
        tokens_per_ms,
        rolling_fail_rate,
        rolling_avg_tokens,
        session_age_ratio
    ], dtype=np.float64)
