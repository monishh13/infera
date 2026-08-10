import pytest
from app.ml.reliability_score import compute_reliability_score

def test_reliability_score_perfect_operation():
    stats = {
        'successful_calls': 10,
        'total_calls': 10,
        'expected_tokens': 100.0,
        'actual_tokens': 100.0,
        'avg_latency': 500.0,
        'baseline_latency': 500.0,
        'avg_loop_count': 1.0
    }
    result = compute_reliability_score(stats)
    
    assert result['score'] == 100.0
    assert result['risk_level'] == 'LOW'
    assert result['tool_success_rate'] == 1.0
    assert result['token_efficiency'] == 1.0
    assert result['latency_score'] == 1.0
    assert result['loop_frequency_score'] == 1.0
    assert result['predicted_failure_prob'] < 0.05

def test_reliability_score_degraded_performance_medium_band():
    stats = {
        'successful_calls': 8,
        'total_calls': 10,  # 80% success -> 0.8 * 40 = 32
        'expected_tokens': 100.0,
        'actual_tokens': 150.0,  # tok_eff = 100/150 = 0.667 -> 0.667 * 20 = 13.33
        'avg_latency': 1000.0,
        'baseline_latency': 500.0,  # lat_ratio = 2.0 -> lat_score = 0.5 -> 0.5 * 20 = 10
        'avg_loop_count': 1.5  # loop_score = 0.95 -> 0.95 * 20 = 19
    }
    result = compute_reliability_score(stats)
    
    # Score should sit in MEDIUM risk band (65 - 84)
    assert 65 <= result['score'] <= 84
    assert result['risk_level'] == 'MEDIUM'

def test_reliability_score_critical_band():
    stats = {
        'successful_calls': 2,
        'total_calls': 10,  # 20% success
        'expected_tokens': 100.0,
        'actual_tokens': 500.0,
        'avg_latency': 2000.0,
        'baseline_latency': 500.0,
        'avg_loop_count': 6.0
    }
    result = compute_reliability_score(stats)
    
    # Score should sit in CRITICAL risk band (0 - 39)
    assert result['score'] < 40.0
    assert result['risk_level'] == 'CRITICAL'
    assert result['predicted_failure_prob'] > 0.50
