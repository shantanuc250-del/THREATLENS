"""
ThreatLens Prediction Service
Handles ML model loading, feature alignment, vector predictions,
and structured confidence & MITRE telemetry.
"""
import os
import json
import time
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timezone

from config import FEATURE_NAMES, CATEGORICAL_FEATURES, NUMERIC_FEATURES
from app.utils.validators import classify_attack, get_mitre_mapping, get_severity


class PredictionService:
    """Service for loading the trained model and making real-time predictions."""
    
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
        
        if os.path.exists(metadata_path):
            with open(metadata_path, "r", encoding="utf-8") as f:
                self.model_metadata = json.load(f)
        
        if os.path.exists(metrics_path):
            with open(metrics_path, "r", encoding="utf-8") as f:
                self.metrics = json.load(f)
    
    @property
    def is_loaded(self):
        return self.model_pipeline is not None
    
    def predict_single(self, features_dict):
        """
        Predict a single traffic record with full MITRE & confidence enrichment.
        """
        if not self.is_loaded:
            return {"error": "Model not loaded. Ensure threatlens_model_v1.0.joblib is present."}
        
        start_time = time.perf_counter()
        
        # Build DataFrame with the exact 41 features
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
            attack_prob = float(probabilities[1])
            normal_prob = float(probabilities[0])
            
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            
            is_attack = prediction == 1
            attack_name, category = classify_attack(features_dict, is_attack)
            mitre_info = get_mitre_mapping(category, attack_name)
            severity = get_severity(attack_prob if is_attack else 0.0)
            confidence_pct = f"{(attack_prob if is_attack else normal_prob) * 100:.1f}%"
            
            return {
                # Raw API fields
                "prediction": "Attack" if is_attack else "Normal",
                "binary_prediction": prediction,
                "label": "ATTACK" if is_attack else "NORMAL",
                "attack_probability": round(attack_prob, 4),
                "normal_probability": round(normal_prob, 4),
                "model_version": self.model_version,
                "feature_importances": self._get_top_features(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                
                # UI / Diagnostic Display fields
                "confidence": confidence_pct,
                "attack_type": attack_name,
                "attack_category": category,
                "risk_level": severity,
                "severity": severity,
                "suggested_action": mitre_info["suggested_action"],
                "recommended_action": mitre_info["suggested_action"],
                "mitre": mitre_info["technique_id"],
                "mitre_technique": mitre_info["technique_name"],
                "description": mitre_info["description"],
                "latency": f"{max(elapsed_ms, 0.8):.2f} ms",
            }
        except Exception as e:
            return {"error": f"Prediction failed: {str(e)}"}
    
    def predict_batch(self, df):
        """
        Vectorized batch prediction across a DataFrame.
        """
        if not self.is_loaded:
            return None, "Model not loaded. Ensure threatlens_model_v1.0.joblib is present."
        
        # Align all 41 features
        aligned_df = df.copy()
        for feat in FEATURE_NAMES:
            if feat not in aligned_df.columns:
                if feat in NUMERIC_FEATURES:
                    aligned_df[feat] = 0
                elif feat in CATEGORICAL_FEATURES:
                    aligned_df[feat] = "other"
        
        X = aligned_df[FEATURE_NAMES].copy()
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
        """Get top N feature importances from the model metrics."""
        if self.metrics and "feature_importances" in self.metrics:
            return self.metrics["feature_importances"][:n]
        return []
    
    def get_metrics(self):
        """Get model evaluation metrics."""
        if self.metrics:
            return self.metrics
        return {"error": "Model metrics not loaded."}
    
    def get_info(self):
        """Get model metadata."""
        if self.model_metadata:
            return {
                **self.model_metadata,
                "status": "loaded" if self.is_loaded else "not_loaded",
            }
        return {
            "status": "loaded" if self.is_loaded else "not_loaded",
            "version": self.model_version,
            "architecture": "Random Forest + Feature Transformer Pipeline",
        }
