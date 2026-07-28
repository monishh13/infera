import os
import joblib
import numpy as np
from typing import Tuple
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

IF_CONFIG = {
    'n_estimators': 100,
    'contamination': 0.05,
    'random_state': 42,
    'max_samples': 'auto',
    'n_jobs': -1
}

class IFModel:
    def __init__(self):
        self.scaler = StandardScaler()
        self.model = IsolationForest(**IF_CONFIG)
        self.fitted = False

    def train(self, feature_matrix: np.ndarray):
        if len(feature_matrix) < 10:
            raise ValueError('Need at least 10 events to train baseline model')
        X = self.scaler.fit_transform(feature_matrix)
        self.model.fit(X)
        self.fitted = True

    def score(self, feature_vector: np.ndarray) -> Tuple[float, bool]:
        if not self.fitted:
            return 0.0, False
        X = self.scaler.transform(feature_vector.reshape(1, -1))
        # score_samples: lower / more negative = more anomalous
        score = float(self.model.score_samples(X)[0])
        label = int(self.model.predict(X)[0])  # -1 = anomaly, 1 = normal
        is_anomaly = (label == -1 or score < -0.5)
        return score, is_anomaly

    def save(self, path: str):
        dir_name = os.path.dirname(path)
        if dir_name and not os.path.exists(dir_name):
            os.makedirs(dir_name, exist_ok=True)
        tmp_path = path + '.tmp'
        joblib.dump({'scaler': self.scaler, 'model': self.model, 'fitted': self.fitted}, tmp_path)
        os.replace(tmp_path, path)

    @classmethod
    def load(cls, path: str):
        obj = cls()
        if os.path.exists(path):
            data = joblib.load(path)
            obj.scaler = data['scaler']
            obj.model = data['model']
            obj.fitted = data.get('fitted', True)
        return obj
