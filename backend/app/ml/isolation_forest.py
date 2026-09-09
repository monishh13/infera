import os
import joblib
import numpy as np
from typing import Tuple, Optional
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import RobustScaler
from sklearn.metrics import precision_score, recall_score, f1_score

IF_CONFIG = {
    'n_estimators': 200,
    'contamination': 0.05,
    'random_state': 42,
    'max_samples': 'auto',
    'n_jobs': 1
}

class IFModel:
    def __init__(self, contamination: Optional[float] = None):
        self.scaler = RobustScaler()
        config = IF_CONFIG.copy()
        if contamination is not None:
            config['contamination'] = contamination
        self.model = IsolationForest(**config)
        self.fitted = False
        self.decision_threshold = 0.0

    def train(self, feature_matrix: np.ndarray):
        if len(feature_matrix) < 200:
            raise ValueError('Need at least 200 events to train baseline model')
        X = self.scaler.fit_transform(feature_matrix)
        self.model.fit(X)
        # IsolationForest's offset is the default cutoff. Keep a separate
        # threshold so it can be calibrated on held-out labeled telemetry.
        self.decision_threshold = float(self.model.offset_)
        self.fitted = True

    def calibrate(self, feature_matrix: np.ndarray, y_true: np.ndarray) -> Tuple[float, float, float]:
        """Choose a score cutoff that maximizes validation F1."""
        if not self.fitted or len(feature_matrix) == 0 or len(y_true) != len(feature_matrix):
            return 0.0, 0.0, 0.0

        scores = self.score_samples(feature_matrix)
        candidates = np.unique(np.percentile(scores, np.linspace(1, 99, 99)))
        best = (0.0, 0.0, 0.0, self.decision_threshold)
        for threshold in candidates:
            semantic_anomalies = (
                (feature_matrix[:, 4] >= 10.0)
                | (feature_matrix[:, 1] >= 5.0)
                | (feature_matrix[:, 3] >= 5.0)
                | ((feature_matrix[:, 5] > 0.0) & (feature_matrix[:, 7] >= 0.5))
            )
            y_pred = ((scores < threshold) | semantic_anomalies).astype(int)
            precision = float(precision_score(y_true, y_pred, zero_division=0))
            recall = float(recall_score(y_true, y_pred, zero_division=0))
            f1 = float(f1_score(y_true, y_pred, zero_division=0))
            if f1 > best[2]:
                best = (precision, recall, f1, float(threshold))
        self.decision_threshold = best[3]
        return tuple(round(value, 4) for value in best[:3])

    def score_samples(self, feature_matrix: np.ndarray) -> np.ndarray:
        if not self.fitted:
            return np.array([], dtype=np.float64)
        X = self.scaler.transform(feature_matrix)
        return self.model.score_samples(X)

    def evaluate(self, feature_matrix: np.ndarray, y_true: np.ndarray) -> Tuple[float, float, float]:
        """
        Evaluates model predictions on ground-truth labels y_true (1 = anomaly, 0 = normal).
        Returns (precision, recall, f1).
        """
        if not self.fitted or len(feature_matrix) == 0:
            return 0.0, 0.0, 0.0
        scores = self.score_samples(feature_matrix)
        semantic_anomalies = (
            (feature_matrix[:, 4] >= 10.0)
            | (feature_matrix[:, 1] >= 5.0)
            | (feature_matrix[:, 3] >= 5.0)
            | ((feature_matrix[:, 5] > 0.0) & (feature_matrix[:, 7] >= 0.5))
        )
        y_pred = np.where((scores < self.decision_threshold) | semantic_anomalies, 1, 0)
        
        prec = float(precision_score(y_true, y_pred, zero_division=0))
        rec = float(recall_score(y_true, y_pred, zero_division=0))
        f1 = float(f1_score(y_true, y_pred, zero_division=0))
        return round(prec, 4), round(rec, 4), round(f1, 4)

    def score(self, feature_vector: np.ndarray) -> Tuple[float, bool]:
        if not self.fitted:
            return 0.0, False
        X = self.scaler.transform(feature_vector.reshape(1, -1))
        # score_samples: lower / more negative = more anomalous
        score = float(self.model.score_samples(X)[0])
        semantic_anomaly = (
            feature_vector[4] >= 10.0
            or feature_vector[1] >= 5.0
            or feature_vector[3] >= 5.0
            or (feature_vector[5] > 0.0 and feature_vector[7] >= 0.5)
        )
        is_anomaly = bool(score < self.decision_threshold or semantic_anomaly)
        return score, is_anomaly

    def save(self, path: str):
        dir_name = os.path.dirname(path)
        if dir_name and not os.path.exists(dir_name):
            os.makedirs(dir_name, exist_ok=True)
        tmp_path = path + '.tmp'
        joblib.dump({
            'scaler': self.scaler,
            'model': self.model,
            'fitted': self.fitted,
            'decision_threshold': self.decision_threshold,
        }, tmp_path)
        os.replace(tmp_path, path)

    @classmethod
    def load(cls, path: str):
        obj = cls()
        if os.path.exists(path):
            data = joblib.load(path)
            obj.scaler = data['scaler']
            obj.model = data['model']
            obj.fitted = data.get('fitted', True)
            obj.decision_threshold = data.get('decision_threshold', float(obj.model.offset_))
        return obj
