from typing import Dict, Any

def score_to_risk(score: float) -> str:
    if score >= 85:
        return 'LOW'
    elif score >= 65:
        return 'MEDIUM'
    elif score >= 40:
        return 'HIGH'
    else:
        return 'CRITICAL'

def score_to_failure_prob(score: float) -> float:
    # Estimate failure probability based on score
    if score >= 85:
        return round(max(0.01, (100.0 - score) / 300.0), 4)
    elif score >= 65:
        return round(0.05 + (85.0 - score) * 0.0075, 4)
    elif score >= 40:
        return round(0.20 + (65.0 - score) * 0.012, 4)
    else:
        return round(min(0.95, 0.50 + (40.0 - score) * 0.01125), 4)

def compute_reliability_score(session_stats: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes composite Agent Reliability Score (0-100) and risk level.
    Required keys in session_stats:
    - successful_calls
    - total_calls
    - expected_tokens
    - actual_tokens
    - avg_latency
    - baseline_latency
    - avg_loop_count
    """
    total_calls = max(int(session_stats.get('total_calls', 1)), 1)
    successful_calls = int(session_stats.get('successful_calls', total_calls))
    tool_sr = float(successful_calls) / float(total_calls)
    
    expected_tokens = float(session_stats.get('expected_tokens', 1000))
    actual_tokens = max(float(session_stats.get('actual_tokens', expected_tokens)), 1.0)
    tok_eff = min(expected_tokens / actual_tokens, 1.0)
    
    avg_latency = float(session_stats.get('avg_latency', 500.0))
    baseline_latency = max(float(session_stats.get('baseline_latency', 500.0)), 1.0)
    lat_ratio = avg_latency / baseline_latency
    lat_score = max(0.0, 1.0 - max(0.0, lat_ratio - 1.0) / 2.0)
    
    avg_loop = float(session_stats.get('avg_loop_count', 1.0))
    loop_score = max(0.0, 1.0 - max(0.0, avg_loop - 1.0) * 0.1)
    
    score = (0.40 * tool_sr + 0.20 * tok_eff + 0.20 * lat_score + 0.20 * loop_score) * 100.0
    score = round(max(0.0, min(100.0, score)), 2)
    
    risk_level = score_to_risk(score)
    pred_fail = score_to_failure_prob(score)
    
    return {
        'score': score,
        'tool_success_rate': round(tool_sr, 4),
        'token_efficiency': round(tok_eff, 4),
        'latency_score': round(lat_score, 4),
        'loop_frequency_score': round(loop_score, 4),
        'risk_level': risk_level,
        'predicted_failure_prob': pred_fail
    }
