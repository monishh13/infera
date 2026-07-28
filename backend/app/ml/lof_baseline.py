import os
import joblib
import numpy as np
from typing import Tuple
from sklearn.neighbors import LocalOutlierFactor
from sklearn.preprocessing import StandardScaler

LOF_CONFIG = {
    'n_neighbors': 20,
    'contamination': 0.05,
    'novelty': True,
    'n_jobs': -1
}

class LOFModel:
    def __init__(self):
        self.scaler = StandardScaler()
        self.model = LocalOutlierFactor(**LOF_CONFIG)
        self.fitted = False

    def train(self, feature_matrix: np.ndarray):
        if len(feature_matrix) < 20:
            raise ValueError('Need >= 20 events to train LOF model')
        X = self.scaler.fit_transform(feature_matrix)
        self.model.fit(X)
        self.fitted = True

    def score(self, feature_vector: np.ndarray) -> Tuple[float, bool]:
        if not self.fitted:
            return 0.0, False
        X = self.scaler.transform(feature_vector.reshape(1, -1))
        score = float(self.model.score_samples(X)[0])
        label = int(self.model.predict(X)[0])
        return score, (label == -1)

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
