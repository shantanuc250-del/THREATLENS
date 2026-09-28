"""
ThreatLens Simulation Routes
Supports both scenario-based triggers (/api/simulation with {scenario: 'dos'|'probe'|'r2l'})
and lifecycle control endpoints (/api/simulation/start, /stop, /status).
"""
from flask import Blueprint, request, jsonify

simulation_bp = Blueprint("simulation", __name__)


@simulation_bp.route("/api/simulation", methods=["POST"])
def toggle_scenario_simulation():
    """
    Handle scenario execution or toggle from frontend Simulator view.
    Accepts JSON: { "scenario": "dos" | "probe" | "r2l", "action": "start" | "stop" (optional) }
    """
    from app import simulation_service
    
    if not simulation_service:
        return jsonify({"error": "Simulation service not initialized"}), 503
        
    data = request.get_json() or {}
    scenario = data.get("scenario", "dos").lower()
    action = data.get("action", "")
    
    if action == "stop":
        res = simulation_service.stop()
        return jsonify(res)
    elif action == "start":
        res = simulation_service.start(scenario=scenario)
        return jsonify(res)
    else:
        # Default behavior: if running and same scenario, stop; else start
        if simulation_service.is_running and simulation_service.current_scenario == scenario:
            res = simulation_service.stop()
            return jsonify(res)
        else:
            res = simulation_service.start(scenario=scenario)
            return jsonify(res)


@simulation_bp.route("/api/simulation/start", methods=["POST"])
def start_simulation():
    """Start simulation with configurable rate and scenario."""
    from app import simulation_service
    if not simulation_service:
        return jsonify({"error": "Simulation service not initialized"}), 503
        
    data = request.get_json() or {}
    scenario = data.get("scenario", "dos")
    rate = min(max(int(data.get("rate", 50)), 10), 500)
    
    result = simulation_service.start(scenario=scenario, rate=rate)
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
    """Get current simulation status, scenario, and real-time terminal feed."""
    from app import simulation_service
    if not simulation_service:
        return jsonify({"is_running": False, "logs": []})
        
    return jsonify(simulation_service.get_status())
