"""
ThreatLens ML Training Pipeline
End-to-end: Load → Preprocess → Train → Evaluate → Save
"""
import os
import sys
import json
import time
import joblib
import numpy as np
from datetime import datetime, timezone

from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline

from config import (
    MODEL_PARAMS, MODEL_VERSION, MODEL_NAME, DATASET_NAME,
    MODELS_DIR, FEATURE_NAMES, RANDOM_SEED
)
from preprocessing import prepare_training_data, build_preprocessor
from evaluate import evaluate_model, print_evaluation_report


def train_model():
    """
    Full training pipeline:
    1. Load and prepare NSL-KDD data
    2. Build preprocessing + model pipeline
    3. Train the model
    4. Evaluate on test set
    5. Save model, metadata, and metrics
    """
    print("=" * 60)
    print("  ThreatLens ML Training Pipeline")
    print(f"  Model: {MODEL_NAME} {MODEL_VERSION}")
    print(f"  Dataset: {DATASET_NAME}")
    print("=" * 60)
    
    # Step 1: Prepare data
    print("\n[Step 1/5] Preparing data...")
    X_train, X_test, y_train, y_test, data_metadata = prepare_training_data()
    
    # Step 2: Build pipeline
    print("\n[Step 2/5] Building model pipeline...")
    preprocessor = build_preprocessor()
    
    classifier = RandomForestClassifier(**MODEL_PARAMS)
    
    model_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", classifier),
    ])
    
    print(f"  Model: RandomForestClassifier")
    print(f"  Parameters: {MODEL_PARAMS}")
    
    # Step 3: Train
    print("\n[Step 3/5] Training model...")
    start_time = time.time()
    model_pipeline.fit(X_train, y_train)
    training_time = time.time() - start_time
    print(f"  Training completed in {training_time:.2f} seconds")
    
    # Step 4: Evaluate
    print("\n[Step 4/5] Evaluating model...")
    metrics = evaluate_model(model_pipeline, X_test, y_test)
    print_evaluation_report(metrics)
    
    # Step 5: Save
    print("\n[Step 5/5] Saving model and artifacts...")
    save_model_artifacts(model_pipeline, metrics, data_metadata, training_time)
    
    print("\n[DONE] Training pipeline complete!")
    return model_pipeline, metrics


def save_model_artifacts(model_pipeline, metrics, data_metadata, training_time):
    """Save model pipeline, metadata, and metrics."""
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    training_date = datetime.now(timezone.utc).isoformat()
    
    # Save model pipeline
    model_path = os.path.join(MODELS_DIR, f"threatlens_model_{MODEL_VERSION}.joblib")
    joblib.dump(model_pipeline, model_path)
    print(f"  [OK] Model saved: {model_path}")
    
    # Save metrics
    metrics_path = os.path.join(MODELS_DIR, f"metrics_{MODEL_VERSION}.json")
    metrics["training_date"] = training_date
    metrics["model_version"] = MODEL_VERSION
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"  [OK] Metrics saved: {metrics_path}")
    
    # Save model metadata
    metadata = {
        "model_name": MODEL_NAME,
        "model_version": MODEL_VERSION,
        "dataset": DATASET_NAME,
        "training_date": training_date,
        "training_time_seconds": round(training_time, 2),
        "n_features": len(FEATURE_NAMES),
        "feature_names": FEATURE_NAMES,
        "model_params": {k: str(v) for k, v in MODEL_PARAMS.items()},
        "model_path": model_path,
        "metrics_summary": {
            "accuracy": metrics["accuracy"],
            "precision": metrics["precision"],
            "recall": metrics["recall"],
            "f1_score": metrics["f1_score"],
            "fpr": metrics["fpr"],
            "roc_auc": metrics["roc_auc"],
        },
        "data": data_metadata,
        "notes": (
            "These metrics are calculated on the NSL-KDD test set. "
            "Real-world performance may differ. "
            "The model parameters are starting values and not claimed to be optimal."
        ),
    }
    
    metadata_path = os.path.join(MODELS_DIR, f"model_metadata_{MODEL_VERSION}.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"  [OK] Metadata saved: {metadata_path}")
    
    # Save reference data for drift detection
    # Store training feature distributions
    print(f"  [OK] All artifacts saved to: {MODELS_DIR}")


if __name__ == "__main__":
    train_model()
