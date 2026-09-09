import numpy as np
from typing import List, Dict, Any

MAX_SESSION_LEN = 100.0

def extract_features(event: Dict[str, Any], agent_history: List[Dict[str, Any]]) -> np.ndarray:
    """
    Converts a telemetry event and historical context into a 13-dimensional feature vector.
    Features:
      0. tokens_used
      1. tokens_zscore
      2. latency_ms
      3. latency_zscore
      4. loop_count
      5. is_failure
      6. tokens_per_ms
      7. rolling_fail_rate
      8. rolling_avg_tokens
      9. session_age_ratio
      10. cost_per_token
      11. prompt_response_ratio
      12. rolling_latency_cv
    """
    tokens = float(event.get('tokens_used', 0))
    latency = float(event.get('latency_ms', 0.0))
    loop_count = float(event.get('loop_count', 1))
    status = event.get('status', 'SUCCESS')
    is_failure = 1.0 if status != 'SUCCESS' else 0.0
    
    prompt_len = float(event.get('prompt_length', 0) or 0)
    response_len = float(event.get('response_length', 0) or 0)
    
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
    
    # New 13D Features
    total_cost = (prompt_len * 0.0015 / 1000.0 + response_len * 0.004 / 1000.0) if (prompt_len > 0 or response_len > 0) else (tokens * 0.002 / 1000.0)
    cost_per_token = total_cost / max(tokens, 1.0)
    prompt_response_ratio = prompt_len / max(response_len, 1.0)
    
    last10_lat = [float(e.get('latency_ms', 0.0)) for e in last10]
    last10_lat_std = float(np.std(last10_lat))
    last10_lat_mean = float(np.mean(last10_lat))
    rolling_latency_cv = last10_lat_std / (last10_lat_mean + 1e-6)
    
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
        session_age_ratio,
        cost_per_token,
        prompt_response_ratio,
        rolling_latency_cv
    ], dtype=np.float64)
