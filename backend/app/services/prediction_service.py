"""
ThreatLens Prediction Service
Handles ML model loading and predictions.
"""
import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timezone

from config import FEATURE_NAMES, CATEGORICAL_FEATURES, NUMERIC_FEATURES


class PredictionService:
    """Service for loading the trained model and making predictions."""
    
    def __init__(self, models_dir, model_version="v1.0"):
        self.models_dir = models_dir
        self.model_version = model_version
        self.model_pipeline = None
        self.model_metadata = None
        self.metrics = None
        self._load_model()
    
    def _load_model(self):
        """Load the trained model pipeline and metadata."""
        model_path = os.path.join(self.models_dir, f"threatlens_model_{self.model_version}.joblib")
        metadata_path = os.path.join(self.models_dir, f"model_metadata_{self.model_version}.json")
        metrics_path = os.path.join(self.models_dir, f"metrics_{self.model_version}.json")
        
        if os.path.exists(model_path):
            try:
                self.model_pipeline = joblib.load(model_path)
                print(f"  [OK] Model loaded: {model_path}")
            except Exception as e:
                print(f"  [FAIL] Failed to load model: {e}")
                self.model_pipeline = None
        else:
            print(f"  [WARN] Model not found: {model_path}")
            print(f"    Run 'python ml/train.py' to train the model first.")
        
        if os.path.exists(metadata_path):
            with open(metadata_path) as f:
                self.model_metadata = json.load(f)
        
        if os.path.exists(metrics_path):
            with open(metrics_path) as f:
                self.metrics = json.load(f)
    
    @property
    def is_loaded(self):
        return self.model_pipeline is not None
    
    def predict_single(self, features_dict):
        """
        Predict a single traffic record.
        
        Args:
            features_dict: dict with NSL-KDD feature names as keys
        
        Returns:
            dict with prediction, probability, and feature importances
        """
        if not self.is_loaded:
            return {"error": "Model not loaded. Run the training pipeline first."}
        
        # Build a DataFrame with the correct feature order
        row = {}
        for feat in FEATURE_NAMES:
            if feat in features_dict:
                row[feat] = features_dict[feat]
            elif feat in NUMERIC_FEATURES:
                row[feat] = 0
            elif feat in CATEGORICAL_FEATURES:
                row[feat] = "other"
        
        df = pd.DataFrame([row])
        
        # Ensure numeric types
        for feat in NUMERIC_FEATURES:
            if feat in df.columns:
                df[feat] = pd.to_numeric(df[feat], errors='coerce').fillna(0)
        
        try:
            prediction = int(self.model_pipeline.predict(df)[0])
            probabilities = self.model_pipeline.predict_proba(df)[0]
            attack_probability = float(probabilities[1])
            
            # Get feature importances
            importances = self._get_top_features()
            
            return {
                "prediction": prediction,
                "label": "ATTACK" if prediction == 1 else "NORMAL",
                "attack_probability": round(attack_probability, 4),
                "normal_probability": round(float(probabilities[0]), 4),
                "model_version": self.model_version,
                "feature_importances": importances,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "note": "ML predictions are probabilistic and may contain false positives/false negatives.",
            }
        except Exception as e:
            return {"error": f"Prediction failed: {str(e)}"}
    
    def predict_batch(self, df):
        """
        Predict a batch of traffic records from a DataFrame.
        
        Args:
            df: pandas DataFrame with NSL-KDD features
        
        Returns:
            DataFrame with predictions added
        """
        if not self.is_loaded:
            return None, "Model not loaded. Run the training pipeline first."
        
        # Ensure we have the right columns
        for feat in FEATURE_NAMES:
            if feat not in df.columns:
                if feat in NUMERIC_FEATURES:
                    df[feat] = 0
                elif feat in CATEGORICAL_FEATURES:
                    df[feat] = "other"
        
        # Select only the features we need, in order
        X = df[FEATURE_NAMES].copy()
        
        # Ensure numeric types
        for feat in NUMERIC_FEATURES:
            X[feat] = pd.to_numeric(X[feat], errors='coerce').fillna(0)
        
        try:
            predictions = self.model_pipeline.predict(X)
            probabilities = self.model_pipeline.predict_proba(X)[:, 1]
            
            result_df = df.copy()
            result_df["prediction"] = predictions
            result_df["attack_probability"] = np.round(probabilities, 4)
            result_df["label"] = result_df["prediction"].map({0: "NORMAL", 1: "ATTACK"})
            
            return result_df, None
        except Exception as e:
            return None, f"Batch prediction failed: {str(e)}"
    
    def _get_top_features(self, n=10):
        """Get top N feature importances from the model."""
        if self.metrics and "feature_importances" in self.metrics:
            return self.metrics["feature_importances"][:n]
        return []
    
    def get_metrics(self):
        """Get model evaluation metrics."""
        if self.metrics:
            return self.metrics
        return {"error": "Model not trained — run the training pipeline."}
    
    def get_info(self):
        """Get model metadata."""
        if self.model_metadata:
            info = {
                **self.model_metadata,
                "status": "loaded" if self.is_loaded else "not_loaded",
            }
            return info
        return {
            "status": "not_trained",
            "message": "Model not trained — run the training pipeline.",
        }
