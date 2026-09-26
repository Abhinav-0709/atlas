import logging
from pathlib import Path
from typing import Any
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression

logger = logging.getLogger("atlas.ml.failure")

MODEL_PATH = Path(__file__).resolve().parent.parent.parent.parent / "data" / "ml" / "failure_model.joblib"


class FailurePredictor:
    """Predicts probability of task failure (0.0 to 1.0) on a candidate worker."""

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
                logger.info("Loaded trained failure prediction model from disk.")
            except Exception as e:
                logger.warning(f"Could not load failure model: {e}")
                self.model = None

    def save(self):
        self.model_path.parent.mkdir(parents=True, exist_ok=True)
        if self.model:
            joblib.dump(self.model, self.model_path)

    def train(self, X: np.ndarray, y: np.ndarray) -> dict[str, float]:
        """Trains the failure prediction classifier."""
        if len(X) < 10 or len(np.unique(y)) < 2:
            return {"error": "Insufficient or single-class training samples"}

        classifier = LogisticRegression(class_weight="balanced", max_iter=200)
        classifier.fit(X, y)
        self.model = classifier
        self._is_trained = True
        self.save()

        # Training accuracy
        preds = classifier.predict(X)
        accuracy = float(np.mean(preds == y))
        return {"samples": len(X), "accuracy": round(accuracy, 4)}

    def predict_probability(self, feature_vector: np.ndarray) -> float:
        """Returns failure probability strictly between 0.0 and 1.0."""
        if self._is_trained and self.model is not None:
            try:
                features_2d = feature_vector.reshape(1, -1)
                # Probability of class 1 (failure)
                prob = float(self.model.predict_proba(features_2d)[0][1])
                return max(0.0, min(1.0, round(prob, 4)))
            except Exception as e:
                logger.debug(f"Failure prediction error fallback: {e}")

        # Cold start heuristic calculation
        # Feature 5: retry_count, Feature 6: historical failure rate, Feature 2: worker CPU
        retry_count = float(feature_vector[5])
        hist_failure = float(feature_vector[6])
        worker_cpu = float(feature_vector[2])

        base_risk = hist_failure
        if retry_count > 0:
            base_risk += retry_count * 0.15
        if worker_cpu > 80.0:
            base_risk += 0.20

        return max(0.01, min(0.99, round(base_risk, 3)))


failure_predictor = FailurePredictor()
