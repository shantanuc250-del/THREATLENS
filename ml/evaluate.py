"""
ThreatLens ML Evaluation
Computes all required metrics from a trained model.
"""
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, roc_curve, confusion_matrix, classification_report
)


def evaluate_model(model_pipeline, X_test, y_test):
    """
    Evaluate the trained model pipeline on test data.
    
    Returns a dictionary with all metrics, confusion matrix data,
    ROC curve data, and feature importances.
    """
    # Predictions
    y_pred = model_pipeline.predict(X_test)
    y_proba = model_pipeline.predict_proba(X_test)[:, 1]
    
    # Core metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_proba)
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    # False Positive Rate: FPR = FP / (FP + TN)
    fpr_value = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    
    # ROC curve data
    fpr_curve, tpr_curve, thresholds = roc_curve(y_test, y_proba)
    
    # Sample ROC curve to reasonable number of points for frontend
    n_points = min(200, len(fpr_curve))
    indices = np.linspace(0, len(fpr_curve) - 1, n_points, dtype=int)
    roc_data = [
        {"fpr": round(float(fpr_curve[i]), 4), "tpr": round(float(tpr_curve[i]), 4)}
        for i in indices
    ]
    
    # Classification report
    report = classification_report(y_test, y_pred, target_names=["Normal", "Attack"], output_dict=True)
    
    # Feature importances from Random Forest
    feature_importances = get_feature_importances(model_pipeline)
    
    metrics = {
        "accuracy": round(float(accuracy), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "fpr": round(float(fpr_value), 4),
        "roc_auc": round(float(roc_auc), 4),
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp),
            "matrix": cm.tolist(),
        },
        "roc_curve": roc_data,
        "classification_report": {
            "Normal": {
                "precision": round(report["Normal"]["precision"], 4),
                "recall": round(report["Normal"]["recall"], 4),
                "f1-score": round(report["Normal"]["f1-score"], 4),
                "support": int(report["Normal"]["support"]),
            },
            "Attack": {
                "precision": round(report["Attack"]["precision"], 4),
                "recall": round(report["Attack"]["recall"], 4),
                "f1-score": round(report["Attack"]["f1-score"], 4),
                "support": int(report["Attack"]["support"]),
            },
        },
        "test_samples": int(len(y_test)),
        "predictions": {
            "total": int(len(y_pred)),
            "predicted_normal": int(np.sum(y_pred == 0)),
            "predicted_attack": int(np.sum(y_pred == 1)),
            "actual_normal": int(np.sum(y_test == 0)),
            "actual_attack": int(np.sum(y_test == 1)),
        },
        "feature_importances": feature_importances,
    }
    
    return metrics


def get_feature_importances(model_pipeline):
    """
    Extract feature importances from the Random Forest inside the pipeline.
    Maps importances back to original feature names.
    """
    try:
        # Get the classifier from the pipeline
        classifier = model_pipeline.named_steps["classifier"]
        preprocessor = model_pipeline.named_steps["preprocessor"]
        
        importances = classifier.feature_importances_
        
        # Get feature names from the preprocessor
        feature_names = []
        
        # Numeric features
        num_features = preprocessor.transformers_[0][2]  # numeric feature names
        feature_names.extend(num_features)
        
        # Categorical features (one-hot encoded)
        cat_encoder = preprocessor.transformers_[1][1]  # OneHotEncoder
        if hasattr(cat_encoder, "get_feature_names_out"):
            cat_features = cat_encoder.get_feature_names_out().tolist()
            feature_names.extend(cat_features)
        
        # Pair and sort by importance
        if len(feature_names) == len(importances):
            importance_pairs = list(zip(feature_names, importances.tolist()))
        else:
            # Fallback: use indices
            importance_pairs = [(f"feature_{i}", float(v)) for i, v in enumerate(importances)]
        
        importance_pairs.sort(key=lambda x: x[1], reverse=True)
        
        # Return top 20
        top_features = [
            {"feature": name, "importance": round(float(imp), 6)}
            for name, imp in importance_pairs[:20]
        ]
        
        return top_features
    
    except Exception as e:
        print(f"Warning: Could not extract feature importances: {e}")
        return []


def print_evaluation_report(metrics):
    """Print a formatted evaluation report to console."""
    print("\n" + "=" * 60)
    print("  ThreatLens Model Evaluation Report")
    print("=" * 60)
    
    print(f"\n  Accuracy:     {metrics['accuracy']:.4f}")
    print(f"  Precision:    {metrics['precision']:.4f}")
    print(f"  Recall:       {metrics['recall']:.4f}")
    print(f"  F1 Score:     {metrics['f1_score']:.4f}")
    print(f"  FPR:          {metrics['fpr']:.4f}")
    print(f"  ROC-AUC:      {metrics['roc_auc']:.4f}")
    
    cm = metrics["confusion_matrix"]
    print(f"\n  Confusion Matrix:")
    print(f"                    Predicted")
    print(f"                  Normal  Attack")
    print(f"  Actual Normal   {cm['tn']:>6}  {cm['fp']:>6}")
    print(f"  Actual Attack   {cm['fn']:>6}  {cm['tp']:>6}")
    
    print(f"\n  Test Samples: {metrics['test_samples']}")
    
    print(f"\n  Top 10 Feature Importances:")
    for fi in metrics["feature_importances"][:10]:
        bar = "#" * int(fi["importance"] * 100)
        print(f"    {fi['feature']:>30s}: {fi['importance']:.4f} {bar}")
    
    print("\n" + "=" * 60)
    print("  NOTE: These metrics are from the NSL-KDD test set.")
    print("  Real-world performance may vary.")
    print("=" * 60 + "\n")
