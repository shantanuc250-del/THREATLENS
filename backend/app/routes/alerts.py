"""
ThreatLens Alert Routes — CRUD operations and incident triage for SOC analysts.
"""
import json
from flask import Blueprint, request, jsonify
from app.utils.validators import sanitize_string

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("/api/alerts", methods=["GET"])
def get_alerts():
    """Get paginated, filtered alerts."""
    from app import db
    
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 50, type=int), 200)
    sort_by = request.args.get("sort_by", "id")
    sort_order = request.args.get("sort_order", "desc")
    
    filters = {}
    if request.args.get("status"):
        filters["status"] = request.args["status"]
    if request.args.get("severity"):
        filters["severity"] = request.args["severity"]
    if request.args.get("attack_type"):
        filters["attack_type"] = request.args["attack_type"]
    if request.args.get("search"):
        filters["search"] = sanitize_string(request.args["search"], 100)
    
    result = db.get_alerts(filters=filters, page=page, per_page=per_page,
                           sort_by=sort_by, sort_order=sort_order)
    
    return jsonify(result)


@alerts_bp.route("/api/alerts/<int:alert_id>", methods=["GET"])
def get_alert(alert_id):
    """Get a single alert by numeric ID."""
    from app import db
    
    alert = db.get_alert_by_id(alert_id)
    if not alert:
        return jsonify({"error": "Alert not found"}), 404
        
    return jsonify(alert)


@alerts_bp.route("/api/alerts/<int:alert_id>", methods=["PATCH"])
def update_alert(alert_id):
    """
    Update alert status, severity, or analyst notes.
    Supports SOC workflow: Blocked / Flagged / Investigating / Resolved
    """
    from app import db
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be a JSON object"}), 400
    
    update = {}
    if "status" in data:
        update["status"] = sanitize_string(data["status"], 50)
    if "analyst_notes" in data:
        update["analyst_notes"] = sanitize_string(data["analyst_notes"], 2000)
    if "severity" in data:
        update["severity"] = sanitize_string(data["severity"], 50)
        
    if not update:
        return jsonify({"error": "No valid fields to update"}), 400
        
    success = db.update_alert(alert_id, update)
    if not success:
        return jsonify({"error": "Alert not found"}), 404
        
    alert = db.get_alert_by_id(alert_id)
    return jsonify({"message": "Alert updated successfully", "alert": alert})
