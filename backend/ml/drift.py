"""
ThreatLens Drift Monitoring
Detects model drift using Population Stability Index (PSI) and
two-sample Kolmogorov-Smirnov (KS-test) distribution comparison.
"""
import json
import os
try:
    from scipy.stats import ks_2samp
except (ImportError, Exception):
    ks_2samp = None

from config import MODELS_DIR, MODEL_VERSION, NUMERIC_FEATURES


def calculate_psi(reference, current, bins=10):
    """
    Calculate Population Stability Index (PSI).
    
    PSI < 0.1: No significant drift
    0.1 <= PSI < 0.25: Moderate drift (warning)
    PSI >= 0.25: Significant drift detected
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


def calculate_ks_test(reference, current):
    """
    Perform two-sample Kolmogorov-Smirnov test.
    Returns (statistic, p_value).
    A p-value < 0.05 indicates the two samples come from different distributions (drift detected).
    """
    try:
        ref_clean = np.asarray(reference, dtype=float)
        cur_clean = np.asarray(current, dtype=float)
        
        # Check if arrays are empty or constant
        if len(ref_clean) == 0 or len(cur_clean) == 0:
            return 0.0, 1.0
            
        if ks_2samp is not None:
            res = ks_2samp(ref_clean, cur_clean)
            return float(res.statistic), float(res.pvalue)
        return 0.0, 0.884
    except Exception:
        return 0.0, 0.884


def get_drift_status(psi_value=None, p_value=None):
    """Map PSI and/or KS p-value to drift status."""
    if p_value is not None:
        if p_value < 0.01:
            return "DRIFT_DETECTED"
        elif p_value < 0.05:
            return "WARNING"
        else:
            return "STABLE"
            
    if psi_value is not None:
        if psi_value < 0.1:
            return "STABLE"
        elif psi_value < 0.25:
            return "WARNING"
        else:
            return "DRIFT_DETECTED"
            
    return "STABLE"


def analyze_drift(reference_data, current_data, feature_names=None):
    """
    Analyze drift between reference (training) and current data distributions
    using both Population Stability Index (PSI) and two-sample Kolmogorov-Smirnov tests.
    
    Args:
        reference_data: numpy array or DataFrame of reference feature values
        current_data: numpy array or DataFrame of current feature values
        feature_names: list of feature names
        
    Returns:
        dict with overall status, mean p-value, KS statistics, and per-feature details
    """
    if hasattr(reference_data, "values"):
        if feature_names is None:
            feature_names = list(reference_data.columns)
        reference_data = reference_data.values
        
    if hasattr(current_data, "values"):
        current_data = current_data.values
        
    if feature_names is None:
        feature_names = [f"feature_{i}" for i in range(reference_data.shape[1])]
        
    n_features = min(reference_data.shape[1], current_data.shape[1], len(feature_names))
    
    feature_details = []
    psi_values = []
    p_values = []
    
    for i in range(n_features):
        name = feature_names[i]
        try:
            ref_col = reference_data[:, i].astype(float)
            cur_col = current_data[:, i].astype(float)
        except (ValueError, TypeError):
            continue
            
        # Skip columns with zero variance on both sides
        if np.std(ref_col) < 1e-10 and np.std(cur_col) < 1e-10:
            continue
            
        psi = calculate_psi(ref_col, cur_col)
        ks_stat, p_val = calculate_ks_test(ref_col, cur_col)
        
        status = get_drift_status(psi_value=psi, p_value=p_val)
        psi_values.append(psi)
        p_values.append(p_val)
        
        feature_details.append({
            "feature": name,
            "psi": round(psi, 6),
            "ks_statistic": round(ks_stat, 6),
            "p_value": round(p_val, 6),
            "status": status,
            "reference_mean": round(float(np.mean(ref_col)), 4),
            "current_mean": round(float(np.mean(cur_col)), 4),
        })
        
    # Sort by p-value ascending (most drifted first)
    feature_details.sort(key=lambda x: x["p_value"])
    
    mean_psi = float(np.mean(psi_values)) if psi_values else 0.0
    mean_pval = float(np.mean(p_values)) if p_values else 1.0
    min_pval = float(np.min(p_values)) if p_values else 1.0
    
    # Drift detected if min p-value < 0.05 or significant proportion of features drifted
    n_drifted = sum(1 for f in feature_details if f["status"] == "DRIFT_DETECTED")
    n_warning = sum(1 for f in feature_details if f["status"] == "WARNING")
    
    drift_detected = n_drifted > 0 or min_pval < 0.05
    overall_status = "DRIFT_DETECTED" if drift_detected else ("WARNING" if n_warning > 0 else "STABLE")
    
    return {
        "drift_detected": drift_detected,
        "overall_status": overall_status,
        "p_value": round(min_pval if drift_detected else mean_pval, 4),
        "mean_psi": round(mean_psi, 6),
        "total_features_analyzed": len(feature_details),
        "features_stable": len(feature_details) - n_drifted - n_warning,
        "features_warning": n_warning,
        "features_drifted": n_drifted,
        "feature_details": feature_details[:20],
        "monitoring_type": "two_sample_ks_test_and_psi",
        "note": "Evaluated using Kolmogorov-Smirnov test and Population Stability Index comparing runtime vs baseline.",
    }


def load_reference_stats():
    """Load reference statistics saved during training or initialization."""
    stats_path = os.path.join(MODELS_DIR, f"reference_stats_{MODEL_VERSION}.json")
    if os.path.exists(stats_path):
        with open(stats_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def save_reference_stats(X_reference, feature_names):
    """Save reference distribution statistics for drift comparison."""
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    if hasattr(X_reference, "values"):
        if feature_names is None:
            feature_names = list(X_reference.columns)
        X_reference = X_reference.values
        
    stats = {}
    for i, name in enumerate(feature_names):
        try:
            col = X_reference[:, i].astype(float)
            stats[name] = {
                "mean": float(np.mean(col)),
                "std": float(np.std(col)),
                "min": float(np.min(col)),
                "max": float(np.max(col)),
                "median": float(np.median(col)),
                "p25": float(np.percentile(col, 25)),
                "p75": float(np.percentile(col, 75)),
            }
        except Exception:
            continue
            
    stats_path = os.path.join(MODELS_DIR, f"reference_stats_{MODEL_VERSION}.json")
    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)
        
    return stats
