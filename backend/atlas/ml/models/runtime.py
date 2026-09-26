import logging
from pathlib import Path
from typing import Any
import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge

logger = logging.getLogger("atlas.ml.runtime")

MODEL_PATH = Path(__file__).resolve().parent.parent.parent.parent / "data" / "ml" / "runtime_model.joblib"


class RuntimePredictor:
    """Predicts task execution duration (seconds) based on job and worker features."""

    def __init__(self, model_path: Path = MODEL_PATH):
        self.model_path = model_path
        self.model: Any = None
        self._is_trained = False
        self._load()

    def _load(self):
        if self.model_path.exists():
            try:
                self.model = joblib.load(self.model_path)
                self._is_trained = True
                logger.info("Loaded trained runtime prediction model from disk.")
            except Exception as e:
                logger.warning(f"Could not load runtime model: {e}")
                self.model = None

    def save(self):
        self.model_path.parent.mkdir(parents=True, exist_ok=True)
        if self.model:
            joblib.dump(self.model, self.model_path)

    def train(self, X: np.ndarray, y: np.ndarray) -> dict[str, float]:
        """Trains the runtime prediction model on historical execution data."""
        if len(X) < 5:
            return {"error": "Insufficient training samples"}

        # Use Ridge for small datasets, RandomForest for larger
        if len(X) < 100:
            regressor = Ridge(alpha=1.0)
        else:
            regressor = RandomForestRegressor(n_estimators=30, max_depth=6, random_state=42)

        regressor.fit(X, y)
        self.model = regressor
        self._is_trained = True
        self.save()

        # Compute training MAE
        preds = regressor.predict(X)
        mae = float(np.mean(np.abs(preds - y)))
        return {"samples": len(X), "mae_seconds": round(mae, 4)}

    def predict(self, feature_vector: np.ndarray) -> float:
        """Predicts runtime in seconds with cold-start safety fallbacks."""
        if self._is_trained and self.model is not None:
            try:
                features_2d = feature_vector.reshape(1, -1)
                predicted = float(self.model.predict(features_2d)[0])
                return max(0.05, round(predicted, 2))
            except Exception as e:
                logger.debug(f"Prediction fallback due to error: {e}")

        # Cold-start heuristic fallback based on task type index (feature 0) and queue (feature 4)
        job_type_idx = int(feature_vector[0])
        queue_depth = float(feature_vector[4])
        base_times = {0: 1.2, 1: 0.8, 2: 2.0}  # HTTP, Python, Delay defaults
        base = base_times.get(job_type_idx, 1.0)
        return max(0.1, round(base + (queue_depth * 0.15), 2))


runtime_predictor = RuntimePredictor()
