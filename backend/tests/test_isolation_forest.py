import pytest
import numpy as np
from app.ml.isolation_forest import IFModel
from app.ml.feature_engineering import extract_features

def test_if_model_13d_training_eval_and_scoring():
    np.random.seed(42)
    
    # Generate synthetic 13D dataset (250 normal, 20 anomalous)
    normal_data = np.random.normal(loc=10.0, scale=2.0, size=(250, 13))
    anomaly_data = np.random.normal(loc=100.0, scale=10.0, size=(20, 13))
    
    X = np.vstack([normal_data, anomaly_data])
    y = np.array([0] * 250 + [1] * 20)
    
    # Shuffle
    indices = np.arange(len(X))
    np.random.shuffle(indices)
    X = X[indices]
    y = y[indices]
    
    model = IFModel(contamination=0.08)
    assert not model.fitted
    
    # Train model
    model.train(X[:200])
    assert model.fitted
    
    # Score a single 13D vector
    score, is_anom = model.score(X[0])
    assert isinstance(score, float)
    assert isinstance(is_anom, bool)
    
    # Evaluate model performance on held out eval set
    prec, rec, f1 = model.evaluate(X[200:], y[200:])
    assert 0.0 <= prec <= 1.0
    assert 0.0 <= rec <= 1.0
    assert 0.0 <= f1 <= 1.0

def test_if_model_calibration_changes_cutoff_and_persists(tmp_path):
    np.random.seed(7)
    normal = np.random.normal(0.0, 1.0, size=(220, 13))
    anomalies = np.random.normal(6.0, 1.0, size=(40, 13))
    model = IFModel(contamination=0.05)
    model.train(normal)

    before = model.decision_threshold
    precision, recall, f1 = model.calibrate(
        np.vstack([normal[:80], anomalies]),
        np.array([0] * 80 + [1] * 40),
    )

    assert model.decision_threshold != before
    assert 0.0 <= precision <= 1.0
    assert 0.0 <= recall <= 1.0
    assert 0.0 <= f1 <= 1.0

    path = tmp_path / "if.pkl"
    model.save(str(path))
    restored = IFModel.load(str(path))
    assert restored.decision_threshold == model.decision_threshold
