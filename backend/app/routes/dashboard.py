"""ThreatLens Dashboard Route — Overview statistics."""
from flask import Blueprint, request, jsonify

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    """Get dashboard overview statistics."""
    from app import prediction_service, db, simulation_service
    
    stats = db.get_dashboard_stats()
    
    # Add model info
    stats["model"] = {
        "version": prediction_service.model_version if prediction_service else "N/A",
        "status": "online" if (prediction_service and prediction_service.is_loaded) else "offline",
        "loaded": prediction_service.is_loaded if prediction_service else False,
    }
    
    # Add simulation status
    stats["simulation"] = simulation_service.get_status() if simulation_service else {"is_running": False}
    
    return jsonify(stats)


@dashboard_bp.route("/api/dashboard/timeline", methods=["GET"])
def get_timeline():
    """Get attack timeline data for charts."""
    from app import db
    
    time_range = request.args.get("range", "24h")
    allowed_ranges = {"1h", "24h", "7d", "all"}
    if time_range not in allowed_ranges:
        time_range = "24h"
    
    timeline = db.get_traffic_timeline(time_range)
    return jsonify({"timeline": timeline, "range": time_range})
