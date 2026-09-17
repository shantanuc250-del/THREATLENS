"""ThreatLens Alert Routes — CRUD for SOC alerts."""
import json
from flask import Blueprint, request, jsonify
from app.utils.validators import sanitize_string

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("/api/alerts", methods=["GET"])
def get_alerts():
    """Get paginated, filtered alerts."""
    from app import db
    
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    sort_by = request.args.get("sort_by", "timestamp")
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
    if request.args.get("start_date"):
        filters["start_date"] = request.args["start_date"]
    if request.args.get("end_date"):
        filters["end_date"] = request.args["end_date"]
    
    result = db.get_alerts(filters=filters, page=page, per_page=per_page,
                           sort_by=sort_by, sort_order=sort_order)
    
    # Parse JSON fields
    for alert in result["alerts"]:
        for field in ["raw_features", "feature_importances"]:
            if alert.get(field) and isinstance(alert[field], str):
                try:
                    alert[field] = json.loads(alert[field])
                except (json.JSONDecodeError, TypeError):
                    pass
    
    return jsonify(result)


@alerts_bp.route("/api/alerts/<int:alert_id>", methods=["GET"])
def get_alert(alert_id):
    """Get a single alert by ID."""
    from app import db
    
    alert = db.get_alert_by_id(alert_id)
    if not alert:
        return jsonify({"error": "Alert not found"}), 404
    
    # Parse JSON fields
    for field in ["raw_features", "feature_importances"]:
        if alert.get(field) and isinstance(alert[field], str):
            try:
                alert[field] = json.loads(alert[field])
            except (json.JSONDecodeError, TypeError):
                pass
    
    return jsonify(alert)


@alerts_bp.route("/api/alerts/<int:alert_id>", methods=["PATCH"])
def update_alert(alert_id):
    """
    Update alert status and/or analyst notes.
    Supports the SOC workflow: NEW → INVESTIGATING → RESOLVED / FALSE_POSITIVE
    """
    from app import db
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400
    
    update = {}
    
    if "status" in data:
        allowed_statuses = {"NEW", "INVESTIGATING", "RESOLVED", "FALSE_POSITIVE"}
        if data["status"] not in allowed_statuses:
            return jsonify({
                "error": f"Invalid status. Must be one of: {', '.join(allowed_statuses)}"
            }), 400
        update["status"] = data["status"]
    
    if "analyst_notes" in data:
        update["analyst_notes"] = sanitize_string(data["analyst_notes"], 2000)
    
    if "severity" in data:
        allowed_severities = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
        if data["severity"] not in allowed_severities:
            return jsonify({
                "error": f"Invalid severity. Must be one of: {', '.join(allowed_severities)}"
            }), 400
        update["severity"] = data["severity"]
    
    if not update:
        return jsonify({"error": "No valid fields to update"}), 400
    
    success = db.update_alert(alert_id, update)
    if not success:
        return jsonify({"error": "Alert not found"}), 404
    
    # Return updated alert
    alert = db.get_alert_by_id(alert_id)
    return jsonify({"message": "Alert updated", "alert": alert})
