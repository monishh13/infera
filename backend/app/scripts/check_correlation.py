import numpy as np
from typing import List, Dict, Any
from app.ml.reliability_score import compute_reliability_score

def run_correlation_check():
    print("=" * 60)
    print("AGENT RELIABILITY SCORE (ARS) PREDICTIVE CORRELATION CHECK")
    print("=" * 60)

    # Simulate a sequence of 200 agent events where degradation/failures occur in waves
    np.random.seed(42)
    events = []
    
    # 0-50: Normal operation
    for _ in range(50):
        events.append({'status': 'SUCCESS', 'tokens': 120, 'latency': 400.0, 'loop': 1})
    # 51-100: Moderate degradation (higher latency, occasional failures)
    for _ in range(50):
        status = 'FAILURE' if np.random.random() < 0.3 else 'SUCCESS'
        events.append({'status': status, 'tokens': 220, 'latency': 1200.0, 'loop': 2})
    # 101-150: Severe failure cascade & reasoning loops
    for _ in range(50):
        status = 'FAILURE' if np.random.random() < 0.7 else 'SUCCESS'
        events.append({'status': status, 'tokens': 450, 'latency': 2800.0, 'loop': 5})
    # 151-200: Recovery back to normal
    for _ in range(50):
        events.append({'status': 'SUCCESS', 'tokens': 110, 'latency': 380.0, 'loop': 1})

    ars_scores = []
    future_failure_rates = []

    # Compute ARS at event N and compare against failure rate in N+1..N+10
    total_events = len(events)
    for i in range(total_events - 10):
        # Calculate stats up to event N
        past_events = events[:i+1]
        succ = sum(1 for e in past_events if e['status'] == 'SUCCESS')
        total = len(past_events)
        act_tok = sum(e['tokens'] for e in past_events)
        avg_lat = float(np.mean([e['latency'] for e in past_events[-10:]]))
        avg_loop = float(np.mean([e['loop'] for e in past_events[-10:]]))

        stats = {
            'successful_calls': succ,
            'total_calls': total,
            'expected_tokens': 150.0,
            'actual_tokens': act_tok,
            'avg_latency': avg_lat,
            'baseline_latency': 500.0,
            'avg_loop_count': avg_loop
        }

        res = compute_reliability_score(stats)
        ars = res['score']

        # Measure future failure rate in next 10 events N+1..N+10
        next_10 = events[i+1:i+11]
        failures_next_10 = sum(1 for e in next_10 if e['status'] == 'FAILURE')
        fail_rate_next_10 = failures_next_10 / 10.0

        ars_scores.append(ars)
        future_failure_rates.append(fail_rate_next_10)

    corr_matrix = np.corrcoef(ars_scores, future_failure_rates)
    r = corr_matrix[0, 1]

    print(f"\nCalculated Pearson Correlation Coefficient (ARS vs Future Failure Rate): {r:.4f}")
    print("\nInterpretation:")
    if r < -0.6:
        print("  STRONG NEGATIVE CORRELATION: Higher ARS scores strongly correlate with lower subsequent failure rates.")
        print("  This empirically supports the paper's claim that ARS serves as an effective predictive health metric for LLM agents.")
    elif r < -0.3:
        print("  MODERATE NEGATIVE CORRELATION: Higher ARS scores indicate lower subsequent failure rates.")
    else:
        print("  WEAK OR NO CORRELATION observed.")
    print("=" * 60)

if __name__ == "__main__":
    run_correlation_check()
