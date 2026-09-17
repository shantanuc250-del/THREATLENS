"""
ThreatLens Prediction Routes
Single prediction and CSV batch analysis.
"""
import io
import json
import pandas as pd
from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from app.utils.validators import (
    validate_prediction_input, validate_csv_file, get_severity, sanitize_string
)

predict_bp = Blueprint("predict", __name__)


@predict_bp.route("/api/predict", methods=["POST"])
def predict_single():
    """
    Predict a single network traffic record.
    
    Expects JSON with NSL-KDD feature fields.
    Returns prediction, probability, severity, and recommended action.
    """
    from app import prediction_service, db
    
    if not prediction_service or not prediction_service.is_loaded:
        return jsonify({
            "error": "Model not loaded. Run the training pipeline first.",
        }), 503
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400
    
    is_valid, errors = validate_prediction_input(data)
    if not is_valid:
        return jsonify({"error": "Validation failed", "details": errors}), 400
    
    result = prediction_service.predict_single(data)
    
    if "error" in result:
        return jsonify(result), 500
    
    # Add severity and action
    severity = get_severity(result["attack_probability"])
    result["severity"] = severity
    
    if result["prediction"] == 1:
        result["recommended_action"] = "SOC INVESTIGATION REQUIRED"
    else:
        result["recommended_action"] = "No action required — traffic appears normal"
    
    # Auto-create alert for attack predictions
    if result["prediction"] == 1 and result["attack_probability"] >= 0.50:
        alert_data = {
            "timestamp": result["timestamp"],
            "source_ip": data.get("source_ip", "Manual Input"),
            "destination_ip": data.get("destination_ip", "Manual Input"),
            "protocol": data.get("protocol_type", "N/A"),
            "service": data.get("service", "N/A"),
            "attack_type": "Attack (Binary)",
            "probability": result["attack_probability"],
            "severity": severity,
            "model_version": result["model_version"],
            "raw_features": json.dumps({k: v for k, v in data.items() if k in [
                "duration", "protocol_type", "service", "flag",
                "src_bytes", "dst_bytes", "count", "srv_count",
                "serror_rate", "dst_host_count"
            ]}),
            "feature_importances": json.dumps(result.get("feature_importances", [])),
        }
        alert_id = db.create_alert(alert_data)
        result["alert_id"] = alert_id
    
    return jsonify(result)


@predict_bp.route("/api/analyze-csv", methods=["POST"])
def analyze_csv():
    """
    Analyze a CSV file of network traffic records.
    
    Expects multipart/form-data with a CSV file.
    Returns predictions for each row plus summary statistics.
    """
    from app import prediction_service, db
    
    if not prediction_service or not prediction_service.is_loaded:
        return jsonify({
            "error": "Model not loaded. Run the training pipeline first.",
        }), 503
    
    if "file" not in request.files:
        return jsonify({"error": "No file provided. Use 'file' field."}), 400
    
    file = request.files["file"]
    
    # Validate file
    is_valid, error = validate_csv_file(file)
    if not is_valid:
        return jsonify({"error": error}), 400
    
    try:
        # Read CSV
        content = file.read().decode("utf-8", errors="replace")
        df = pd.read_csv(io.StringIO(content))
        
        if len(df) == 0:
            return jsonify({"error": "CSV file is empty"}), 400
        
        if len(df) > 50000:
            return jsonify({"error": f"CSV too large ({len(df)} rows). Maximum: 50,000 rows"}), 400
        
        # Check if CSV has headers or needs NSL-KDD column names
        import sys, os
        sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "ml"))
        from config import FEATURE_NAMES, COLUMN_NAMES
        
        # If CSV has numeric column names (0, 1, 2...) or no matching features,
        # try assigning NSL-KDD names
        matching_features = set(df.columns) & set(FEATURE_NAMES)
        if len(matching_features) < 5 and len(df.columns) >= 41:
            # Likely a raw NSL-KDD file without headers
            if len(df.columns) == len(COLUMN_NAMES):
                df.columns = COLUMN_NAMES
            elif len(df.columns) == len(FEATURE_NAMES) + 1:
                df.columns = FEATURE_NAMES + ["label"]
            elif len(df.columns) >= len(FEATURE_NAMES):
                df.columns = FEATURE_NAMES + [f"extra_{i}" for i in range(len(df.columns) - len(FEATURE_NAMES))]
        
        # Run batch prediction
        result_df, error = prediction_service.predict_batch(df)
        
        if error:
            return jsonify({"error": error}), 500
        
        # Summary stats
        total = len(result_df)
        n_attack = int(result_df["prediction"].sum())
        n_normal = total - n_attack
        attack_pct = round(n_attack / total * 100, 2) if total > 0 else 0
        
        # Create alerts for attacks
        alerts_created = 0
        now = datetime.now(timezone.utc).isoformat()
        
        attacks = result_df[result_df["prediction"] == 1]
        for _, row in attacks.head(200).iterrows():  # Cap at 200 alerts per upload
            prob = float(row.get("attack_probability", 0))
            if prob >= 0.50:
                severity = get_severity(prob)
                alert_data = {
                    "timestamp": now,
                    "source_ip": str(row.get("src_bytes", "CSV Upload")),
                    "destination_ip": str(row.get("dst_bytes", "CSV Upload")),
                    "protocol": str(row.get("protocol_type", "N/A")),
                    "service": str(row.get("service", "N/A")),
                    "attack_type": "Attack (Binary)",
                    "probability": prob,
                    "severity": severity,
                    "model_version": prediction_service.model_version,
                }
                db.create_alert(alert_data)
                alerts_created += 1
        
        # Log traffic
        traffic_records = []
        for _, row in result_df.iterrows():
            traffic_records.append({
                "timestamp": now,
                "source_ip": "CSV Upload",
                "destination_ip": "CSV Upload",
                "protocol": str(row.get("protocol_type", "N/A")),
                "prediction": int(row.get("prediction", 0)),
                "probability": float(row.get("attack_probability", 0)),
                "is_simulation": 0,
            })
        db.log_traffic_batch(traffic_records)
        
        # Build results for frontend (limit to 500 rows for response)
        results = []
        display_df = result_df.head(500)
        for _, row in display_df.iterrows():
            prob = float(row.get("attack_probability", 0))
            results.append({
                "protocol": str(row.get("protocol_type", "N/A")),
                "service": str(row.get("service", "N/A")),
                "flag": str(row.get("flag", "N/A")),
                "duration": float(row.get("duration", 0)),
                "src_bytes": float(row.get("src_bytes", 0)),
                "dst_bytes": float(row.get("dst_bytes", 0)),
                "prediction": int(row.get("prediction", 0)),
                "label": str(row.get("label", "NORMAL")),
                "attack_probability": prob,
                "severity": get_severity(prob) if row.get("prediction") == 1 else "NONE",
            })
        
        return jsonify({
            "summary": {
                "total_records": total,
                "normal": n_normal,
                "attack": n_attack,
                "attack_percentage": attack_pct,
                "alerts_created": alerts_created,
            },
            "results": results,
            "truncated": total > 500,
            "note": "ML predictions are probabilistic and may contain false positives/false negatives.",
        })
    
    except pd.errors.EmptyDataError:
        return jsonify({"error": "CSV file is empty or malformed"}), 400
    except pd.errors.ParserError as e:
        return jsonify({"error": f"CSV parsing error: {str(e)[:200]}"}), 400
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)[:200]}"}), 500
