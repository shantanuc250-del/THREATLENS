"""
ThreatLens Drift Monitoring
Detects model drift using Population Stability Index (PSI) and distribution comparison.
"""
import json
import os
import numpy as np
from config import MODELS_DIR, MODEL_VERSION


def calculate_psi(reference, current, bins=10):
    """
    Calculate Population Stability Index (PSI).
    
    PSI < 0.1: No significant drift
    0.1 <= PSI < 0.25: Moderate drift (warning)
    PSI >= 0.25: Significant drift detected
    
    NOTE: This is a statistical indicator and should be interpreted
    in context. It does not prove that model performance has degraded.
    """
    eps = 1e-6
    
    # Create bins from reference distribution
    breakpoints = np.histogram_bin_edges(reference, bins=bins)
    
    ref_counts, _ = np.histogram(reference, bins=breakpoints)
    cur_counts, _ = np.histogram(current, bins=breakpoints)
    
    # Convert to proportions
    ref_pct = ref_counts / (ref_counts.sum() + eps) + eps
    cur_pct = cur_counts / (cur_counts.sum() + eps) + eps
    
    # PSI formula
    psi = np.sum((cur_pct - ref_pct) * np.log(cur_pct / ref_pct))
    
    return float(psi)


def get_drift_status(psi_value):
    """Map PSI value to drift status."""
    if psi_value < 0.1:
        return "STABLE"
    elif psi_value < 0.25:
        return "WARNING"
    else:
        return "DRIFT_DETECTED"


def analyze_drift(reference_data, current_data, feature_names=None):
    """
    Analyze drift between reference (training) and current data distributions.
    
    Args:
        reference_data: numpy array of reference feature values (n_samples, n_features)
        current_data: numpy array of current feature values (n_samples, n_features)
        feature_names: list of feature names
    
    Returns:
        dict with overall status and per-feature PSI values
    
    NOTE: When using dataset-based monitoring (not live traffic),
    this should be clearly labeled as "Simulation / Dataset-based drift monitoring"
    """
    if feature_names is None:
        feature_names = [f"feature_{i}" for i in range(reference_data.shape[1])]
    
    n_features = min(reference_data.shape[1], current_data.shape[1], len(feature_names))
    
    feature_psi = []
    psi_values = []
    
    for i in range(n_features):
        ref_col = reference_data[:, i].astype(float)
        cur_col = current_data[:, i].astype(float)
        
        # Skip columns with zero variance
        if np.std(ref_col) < 1e-10 and np.std(cur_col) < 1e-10:
            continue
        
        psi = calculate_psi(ref_col, cur_col)
        status = get_drift_status(psi)
        psi_values.append(psi)
        
        feature_psi.append({
            "feature": feature_names[i],
            "psi": round(psi, 6),
            "status": status,
        })
    
    # Sort by PSI descending
    feature_psi.sort(key=lambda x: x["psi"], reverse=True)
    
    # Overall status based on mean PSI
    mean_psi = np.mean(psi_values) if psi_values else 0.0
    overall_status = get_drift_status(mean_psi)
    
    # Count drifted features
    n_drifted = sum(1 for f in feature_psi if f["status"] == "DRIFT_DETECTED")
    n_warning = sum(1 for f in feature_psi if f["status"] == "WARNING")
    
    return {
        "overall_status": overall_status,
        "mean_psi": round(mean_psi, 6),
        "total_features_analyzed": len(feature_psi),
        "features_stable": len(feature_psi) - n_drifted - n_warning,
        "features_warning": n_warning,
        "features_drifted": n_drifted,
        "feature_details": feature_psi[:20],  # Top 20 most drifted
        "monitoring_type": "dataset_based",
        "note": (
            "This drift analysis compares distributions between reference and current data. "
            "When using dataset-based monitoring, results indicate distribution differences "
            "within the dataset and may not reflect real-world production drift."
        ),
    }


def load_reference_stats():
    """Load reference statistics saved during training."""
    stats_path = os.path.join(MODELS_DIR, f"reference_stats_{MODEL_VERSION}.json")
    if os.path.exists(stats_path):
        with open(stats_path) as f:
            return json.load(f)
    return None


def save_reference_stats(X_train_processed, feature_names):
    """Save reference distribution statistics for drift comparison."""
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    stats = {}
    for i, name in enumerate(feature_names):
        col = X_train_processed[:, i].astype(float)
        stats[name] = {
            "mean": float(np.mean(col)),
            "std": float(np.std(col)),
            "min": float(np.min(col)),
            "max": float(np.max(col)),
            "median": float(np.median(col)),
        }
    
    stats_path = os.path.join(MODELS_DIR, f"reference_stats_{MODEL_VERSION}.json")
    with open(stats_path, "w") as f:
        json.dump(stats, f, indent=2)
    
    return stats
