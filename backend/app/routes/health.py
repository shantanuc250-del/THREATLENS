"""Health check endpoint."""
from flask import Blueprint, jsonify
from datetime import datetime, timezone

health_bp = Blueprint("health", __name__)


@health_bp.route("/api/health", methods=["GET"])
def health_check():
    from app import prediction_service
    return jsonify({
        "status": "healthy",
        "service": "ThreatLens API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model_loaded": prediction_service.is_loaded if prediction_service else False,
    })
