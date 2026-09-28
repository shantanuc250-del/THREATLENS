"""
ThreatLens Dashboard Route — Real-time overview metrics and time-series aggregations.
"""
from flask import Blueprint, request, jsonify

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    """Get dashboard overview statistics with model & simulation telemetry."""
    from app import prediction_service, db, simulation_service
    
    stats = db.get_dashboard_stats()
    
    # Model telemetry
    stats["model"] = {
        "version": prediction_service.model_version if prediction_service else "v1.0",
        "status": "online" if (prediction_service and prediction_service.is_loaded) else "offline",
        "loaded": prediction_service.is_loaded if prediction_service else False,
    }
    
    # Simulation telemetry
    stats["simulation"] = simulation_service.get_status() if simulation_service else {"is_running": False}
    if simulation_service and simulation_service.is_running:
        stats["active_sims"] = "1"
    else:
        stats["active_sims"] = "0"
        
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
