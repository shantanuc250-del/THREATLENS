"""ThreatLens Simulation Routes — Dataset replay for demonstration."""
from flask import Blueprint, request, jsonify

simulation_bp = Blueprint("simulation", __name__)


@simulation_bp.route("/api/simulation/start", methods=["POST"])
def start_simulation():
    """
    Start simulation mode.
    Replays NSL-KDD dataset records at a configurable rate.
    
    IMPORTANT: This is SIMULATION MODE — NOT live network monitoring.
    """
    from app import simulation_service
    
    if not simulation_service:
        return jsonify({"error": "Simulation service not initialized"}), 503
    
    data = request.get_json() or {}
    rate = min(max(int(data.get("rate", 50)), 10), 500)  # 10-500 records/batch
    
    result = simulation_service.start(rate=rate)
    
    if "error" in result:
        return jsonify(result), 400
    
    return jsonify(result)


@simulation_bp.route("/api/simulation/stop", methods=["POST"])
def stop_simulation():
    """Stop the running simulation."""
    from app import simulation_service
    
    if not simulation_service:
        return jsonify({"error": "Simulation service not initialized"}), 503
    
    result = simulation_service.stop()
    return jsonify(result)


@simulation_bp.route("/api/simulation/status", methods=["GET"])
def simulation_status():
    """Get current simulation status."""
    from app import simulation_service
    
    if not simulation_service:
        return jsonify({"is_running": False})
    
    return jsonify(simulation_service.get_status())
