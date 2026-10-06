"""
ThreatLens IP Intelligence & VPN Detection API Routes
Provides standalone IP intelligence queries and risk correlation lookup.
"""
from flask import Blueprint, request, jsonify
from app.utils.validators import sanitize_string

ip_intel_bp = Blueprint("ip_intel", __name__)


@ip_intel_bp.route("/api/ip-intelligence/<path:ip>", methods=["GET"])
def get_ip_intel_by_path(ip):
    """
    Retrieve IP intelligence, VPN/proxy/Tor flags, reputation, and risk metadata.
    Example: GET /api/ip-intelligence/8.8.8.8
    """
    from app import ip_intelligence_service

    if not ip_intelligence_service:
        return jsonify({
            "ip": ip,
            "type": "Public/External",
            "vpn": "unknown",
            "proxy": "unknown",
            "tor": "unknown",
            "risk": "unknown",
            "source": "unavailable",
            "reason": "IP intelligence service unavailable"
        }), 200

    clean_ip = sanitize_string(ip, 60)
    intel = ip_intelligence_service.get_ip_intelligence(clean_ip)
    return jsonify(intel)


@ip_intel_bp.route("/api/ip-intelligence", methods=["GET", "POST"])
def query_ip_intel():
    """
    Query IP intelligence via query parameter (?ip=...) or JSON payload ({"ip": "..."}).
    """
    from app import ip_intelligence_service

    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        raw_ip = data.get("ip") or data.get("source_ip") or "8.8.8.8"
        port = data.get("port")
    else:
        raw_ip = request.args.get("ip") or request.args.get("source_ip") or "8.8.8.8"
        port = request.args.get("port", type=int)

    clean_ip = sanitize_string(str(raw_ip), 60)

    if not ip_intelligence_service:
        return jsonify({
            "ip": clean_ip,
            "type": "Public/External",
            "vpn": "unknown",
            "proxy": "unknown",
            "tor": "unknown",
            "risk": "unknown",
            "source": "unavailable",
            "reason": "IP intelligence service unavailable"
        }), 200

    intel = ip_intelligence_service.get_ip_intelligence(clean_ip, port=port)
    return jsonify(intel)
