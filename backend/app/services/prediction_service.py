"""
ThreatLens Prediction Service
Handles ML model loading, feature alignment, vector predictions,
and structured confidence & MITRE telemetry.
"""
import os
import json
import logging
import time
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timezone

try:
    from config import FEATURE_NAMES, CATEGORICAL_FEATURES, NUMERIC_FEATURES
except ImportError:
    try:
        from ml.config import FEATURE_NAMES, CATEGORICAL_FEATURES, NUMERIC_FEATURES
    except ImportError:
        FEATURE_NAMES = [
            "duration", "protocol_type", "service", "flag",
            "src_bytes", "dst_bytes", "land", "wrong_fragment", "urgent",
            "hot", "num_failed_logins", "logged_in", "num_compromised",
            "root_shell", "su_attempted", "num_root", "num_file_creations",
            "num_shells", "num_access_files", "num_outbound_cmds",
            "is_host_login", "is_guest_login",
            "count", "srv_count", "serror_rate", "srv_serror_rate",
            "rerror_rate", "srv_rerror_rate", "same_srv_rate", "diff_srv_rate",
            "srv_diff_host_rate",
            "dst_host_count", "dst_host_srv_count",
            "dst_host_same_srv_rate", "dst_host_diff_srv_rate",
            "dst_host_same_src_port_rate", "dst_host_srv_diff_host_rate",
            "dst_host_serror_rate", "dst_host_srv_serror_rate",
            "dst_host_rerror_rate", "dst_host_srv_rerror_rate",
        ]
        CATEGORICAL_FEATURES = ["protocol_type", "service", "flag"]
        NUMERIC_FEATURES = [f for f in FEATURE_NAMES if f not in CATEGORICAL_FEATURES]
from app.utils.validators import classify_attack, get_mitre_mapping, get_severity

logger = logging.getLogger(__name__)


class PredictionService:
    """Service for loading the trained model and making real-time predictions."""
    
    def __init__(self, models_dir, model_version="v1.0"):
        self.models_dir = models_dir
        self.model_version = model_version
        self.model_pipeline = None
        self.model_metadata = None
        self.metrics = None
        # Cached mapping: original feature name -> global RF importance (computed once on load)
        self._original_feature_importances = None
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
        
        # Pre-compute the feature importance mapping once after load
        if self.model_pipeline is not None:
            self._original_feature_importances = self._compute_original_feature_importances()
    
    @property
    def is_loaded(self):
        return self.model_pipeline is not None
    
    def _compute_original_feature_importances(self):
        """
        Map the Random Forest's feature_importances_ (over transformed space)
        back to the original 41 NSL-KDD feature names.

        The ColumnTransformer outputs features in this order:
          1. StandardScaler columns: NUMERIC_FEATURES (38 features, 1-to-1)
          2. OneHotEncoder columns: OHE expansion of CATEGORICAL_FEATURES
             (protocol_type -> 3, service -> 70, flag -> 11 = 84 columns)
        Total: 38 + 84 = 122 transformed features.

        For categorical features, we SUM the importances of all their OHE
        columns to get one importance score per original feature name.

        Returns: list of {name, importance} sorted by importance descending.
        """
        try:
            classifier = self.model_pipeline.named_steps["classifier"]
            preprocessor = self.model_pipeline.named_steps["preprocessor"]
            raw_importances = classifier.feature_importances_

            # Build ordered list of transformed feature names matching the RF's input
            ohe = preprocessor.named_transformers_["cat"]
            ohe_feature_names = list(ohe.get_feature_names_out(CATEGORICAL_FEATURES))
            all_transformed = NUMERIC_FEATURES + ohe_feature_names

            if len(raw_importances) != len(all_transformed):
                logger.warning(
                    "feature_importances_ length (%d) != transformed features (%d). "
                    "Skipping explanation pre-computation.",
                    len(raw_importances), len(all_transformed)
                )
                return None

            # Aggregate importances to original feature space
            importance_map = {feat: 0.0 for feat in FEATURE_NAMES}
            for idx, feat_name in enumerate(all_transformed):
                if feat_name in importance_map:
                    # Numeric feature: direct 1-to-1
                    importance_map[feat_name] += raw_importances[idx]
                else:
                    # OHE column: "original_feature_value" -> map back to original feature
                    for cat_feat in CATEGORICAL_FEATURES:
                        prefix = cat_feat + "_"
                        if feat_name.startswith(prefix):
                            importance_map[cat_feat] += raw_importances[idx]
                            break

            # Sort descending and return as list
            sorted_features = sorted(
                importance_map.items(), key=lambda x: x[1], reverse=True
            )
            return [
                {"name": name, "importance": float(round(imp, 6))}
                for name, imp in sorted_features
            ]
        except Exception as e:
            logger.error("Failed to compute original feature importances: %s", e)
            return None

    def generate_explanation(self, features_dict, top_n=8):
        """
        Generate an explainability payload for a single prediction.

        Method: Random Forest global feature importance, mapped back to the
        original 41 NSL-KDD feature names. For each top feature, the actual
        value submitted for this traffic record is shown alongside the model's
        global importance score.

        IMPORTANT DISTINCTION:
        - 'importance' is the GLOBAL importance of this feature across the
          entire training dataset, not a causal explanation for this specific
          packet. It shows which features the trained model relies on most.
        - 'value' is the actual value submitted for THIS traffic record.

        Returns None on any failure so callers can safely fall back.
        """
        if self._original_feature_importances is None:
            return None

        try:
            def importance_label(score):
                if score >= 0.08:
                    return "High"
                elif score >= 0.03:
                    return "Medium"
                elif score >= 0.005:
                    return "Low"
                else:
                    return "Minimal"

            top_features = self._original_feature_importances[:top_n]
            explanation_features = []
            for entry in top_features:
                feat_name = entry["name"]
                importance = entry["importance"]
                # Fetch the actual value for this traffic record (or the default)
                if feat_name in features_dict and features_dict[feat_name] not in (None, ""):
                    raw_val = features_dict[feat_name]
                else:
                    raw_val = 0 if feat_name in NUMERIC_FEATURES else "other"
                explanation_features.append({
                    "name": feat_name,
                    "value": raw_val,
                    "importance": importance,
                    "importance_label": importance_label(importance),
                })

            return {
                "method": "Random Forest global feature importance (mapped to original features)",
                "method_note": (
                    "Importance scores reflect how much each feature contributed to the "
                    "model's decisions across all training data (global, not per-packet). "
                    "Values shown are the actual values submitted for this traffic record."
                ),
                "top_features": explanation_features,
            }
        except Exception as e:
            logger.error("Failed to generate explanation: %s", e)
            return None

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

            # Generate explainability payload (fault-tolerant: returns None on failure)
            try:
                explanation = self.generate_explanation(features_dict)
            except Exception as exp_err:
                logger.error("Explanation generation failed unexpectedly: %s", exp_err)
                explanation = None
            
            return {
                # Raw API fields
                "prediction": "Attack" if is_attack else "Normal",
                "binary_prediction": prediction,
                "label": "ATTACK" if is_attack else "NORMAL",
                "attack_probability": round(attack_prob, 4),
                "normal_probability": round(normal_prob, 4),
                "model_version": self.model_version,
                "feature_importances": self._get_top_features(),
                "explanation": explanation,
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
        """Get top N feature importances from the pre-computed original feature mapping."""
        if self._original_feature_importances:
            return self._original_feature_importances[:n]
        # Fall back to metrics file if live model data unavailable
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
