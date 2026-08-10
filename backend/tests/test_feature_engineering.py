import pytest
import numpy as np
from app.ml.feature_engineering import extract_features

def test_10d_feature_vector_dimensions_and_math():
    event = {
        'tokens_used': 200,
        'latency_ms': 1000.0,
        'loop_count': 1,
        'status': 'SUCCESS'
    }
    
    # 5 history events with 100 tokens and 500ms latency
    history = [
        {'tokens_used': 100, 'latency_ms': 500.0, 'loop_count': 1, 'status': 'SUCCESS'}
        for _ in range(5)
    ]

    features = extract_features(event, history)

    # 1. Assert exact 10D vector shape
    assert isinstance(features, np.ndarray)
    assert features.shape == (10,)

    # 2. Check individual feature values
    # f0: tokens_used = 200
    assert features[0] == 200.0

    # f1: tokens_zscore = (200 - 100) / (std + 1e-6) -> std of [100, 100, 100, 100, 100] is 0 -> 100 / 1e-6 = 1e8 capped/large
    assert features[1] > 0

    # f2: latency_ms = 1000.0
    assert features[2] == 1000.0

    # f4: loop_count = 1
    assert features[4] == 1.0

    # f5: is_failure = 0 (status SUCCESS)
    assert features[5] == 0.0

    # f6: tokens_per_ms = 200 / 1000 = 0.2
    assert pytest.approx(features[6], 0.001) == 0.2

    # f7: rolling_fail_rate = 0.0
    assert features[7] == 0.0

    # f8: rolling_avg_tokens = 100.0
    assert features[8] == 100.0

def test_feature_vector_failure_status():
    event = {
        'tokens_used': 150,
        'latency_ms': 800.0,
        'loop_count': 2,
        'status': 'FAILURE'
    }
    features = extract_features(event, [])
    assert features[5] == 1.0  # is_failure flag set to 1 on failure
