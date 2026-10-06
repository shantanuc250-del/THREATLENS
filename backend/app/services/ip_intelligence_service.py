"""
ThreatLens IP Intelligence & VPN/Proxy Detection Service
Provides modular IP validation, public/private classification, external API enrichment,
safe demo/mock intelligence, and explainable SOC risk correlation.

NOTE: This is a separate security intelligence layer and is NOT part of the NSL-KDD Random Forest model.
"""
import os
import re
import ipaddress
import time
import urllib.request
import urllib.error
import json
from typing import Dict, Any, Tuple, Optional

# Cache expiration TTL in seconds (10 minutes)
CACHE_TTL = 600
_intel_cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}

# Controlled Demo IP Intelligence Registry
# Used for safe, reproducible demo testing without inventing random classifications
DEMO_IP_REGISTRY = {
    # Public Anycast / Cloud Infrastructure (Clean/Low Risk)
    "8.8.8.8": {
        "ip": "8.8.8.8",
        "type": "Public/External",
        "vpn": False,
        "proxy": False,
        "tor": False,
        "risk": "low",
        "provider": "Google LLC (Public DNS)",
        "country": "United States",
        "country_code": "US",
        "source": "Demo IP Intelligence",
    },
    "1.1.1.1": {
        "ip": "1.1.1.1",
        "type": "Public/External",
        "vpn": False,
        "proxy": False,
        "tor": False,
        "risk": "low",
        "provider": "Cloudflare Anycast",
        "country": "United States",
        "country_code": "US",
        "source": "Demo IP Intelligence",
    },
    # Commercial VPN Gateway (Demo Test IP)
    "198.51.100.25": {
        "ip": "198.51.100.25",
        "type": "Public/External",
        "vpn": True,
        "proxy": False,
        "tor": False,
        "risk": "medium",
        "provider": "NordSecurity / Commercial VPN Egress",
        "country": "United States",
        "country_code": "US",
        "source": "Demo IP Intelligence",
    },
    # Anonymous HTTP/SOCKS Proxy (Demo Test IP)
    "203.0.113.88": {
        "ip": "203.0.113.88",
        "type": "Public/External",
        "vpn": False,
        "proxy": True,
        "tor": False,
        "risk": "high",
        "provider": "OpenProxy Anonymization Gateway",
        "country": "Netherlands",
        "country_code": "NL",
        "source": "Demo IP Intelligence",
    },
    # Tor Onion Router Exit Node (Demo Test IP)
    "185.220.101.5": {
        "ip": "185.220.101.5",
        "type": "Public/External",
        "vpn": False,
        "proxy": False,
        "tor": True,
        "risk": "high",
        "provider": "Tor Project Exit Relay Node",
        "country": "Germany",
        "country_code": "DE",
        "source": "Demo IP Intelligence",
    },
    # Suspicious Datacenter / Scanning Egress
    "45.33.32.156": {
        "ip": "45.33.32.156",
        "type": "Public/External",
        "vpn": True,
        "proxy": True,
        "tor": False,
        "risk": "high",
        "provider": "Datacenter Egress / Scanner Node",
        "country": "United States",
        "country_code": "US",
        "source": "Demo IP Intelligence",
    }
}


class IPIntelligenceService:
    """
    Security intelligence layer that extracts IP metadata, detects VPN/Proxy/Tor
    anonymization, tracks historical SOC incidents, and calculates correlated risk.
    """

    def __init__(self, db=None):
        self.db = db
        self.api_key = os.environ.get("IP_INTELLIGENCE_API_KEY", "").strip()

    @staticmethod
    def parse_ip_and_port(raw_input: Any) -> Tuple[str, Optional[int]]:
        """
        Extract clean IP and port from string (e.g. '192.168.1.1:8080' -> ('192.168.1.1', 8080)).
        """
        if not raw_input:
            return "192.168.1.1", None

        s = str(raw_input).strip()
        port = None

        # Check for IP:Port format (IPv4)
        if ":" in s and not s.startswith("["):
            parts = s.split(":")
            if len(parts) == 2 and parts[1].isdigit():
                s = parts[0]
                port = int(parts[1])

        return s, port

    @staticmethod
    def validate_ip_address(ip_str: str) -> Tuple[bool, Optional[ipaddress.IPv4Address | ipaddress.IPv6Address]]:
        """
        Validate IPv4 or IPv6 address using Python's standard ipaddress library.
        """
        try:
            ip_obj = ipaddress.ip_address(ip_str)
            return True, ip_obj
        except (ValueError, TypeError):
            return False, None

    @staticmethod
    def get_ip_classification(ip_obj: ipaddress.IPv4Address | ipaddress.IPv6Address) -> str:
        """
        Classify IP into Private/Internal or Public/External.
        """
        if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local:
            # If in RFC 1918 / loopback ranges
            return "Private/Internal"
        return "Public/External"

    def get_ip_intelligence(self, raw_ip: str, port: Optional[int] = None) -> Dict[str, Any]:
        """
        Retrieve intelligence for an IP address.
        Returns IP type, VPN/Proxy/Tor flags, reputation risk, provider metadata, and previous SOC alerts.
        """
        clean_ip, extracted_port = self.parse_ip_and_port(raw_ip)
        final_port = port if port is not None else extracted_port

        # 1. Validate IP
        is_valid, ip_obj = self.validate_ip_address(clean_ip)
        if not is_valid or ip_obj is None:
            return {
                "ip": clean_ip,
                "port": final_port,
                "is_valid": False,
                "type": "Unknown",
                "vpn": "unknown",
                "proxy": "unknown",
                "tor": "unknown",
                "risk": "unknown",
                "provider": "Invalid Address Format",
                "country": "Unknown",
                "previous_alerts": 0,
                "source": "validation_failed",
                "reason": f"'{clean_ip}' is not a valid IPv4 or IPv6 address"
            }

        # Query previous alert count from SQLite if DB available
        prev_alerts_count = 0
        if self.db and hasattr(self.db, "get_ip_alert_count"):
            try:
                prev_alerts_count = self.db.get_ip_alert_count(clean_ip)
            except Exception:
                prev_alerts_count = 0

        # Check Cache
        now = time.time()
        if clean_ip in _intel_cache:
            cache_time, cached_data = _intel_cache[clean_ip]
            if now - cache_time < CACHE_TTL:
                result = dict(cached_data)
                result["port"] = final_port
                result["previous_alerts"] = prev_alerts_count
                return result

        # 2. Case A: Controlled Demo IP Registry (Prioritized for demo/test fidelity)
        if clean_ip in DEMO_IP_REGISTRY:
            demo_meta = DEMO_IP_REGISTRY[clean_ip]
            result = {
                **demo_meta,
                "port": final_port,
                "is_valid": True,
                "previous_alerts": prev_alerts_count,
            }
            self._save_to_cache(clean_ip, result)
            return result

        ip_classification = self.get_ip_classification(ip_obj)

        # 3. Case B: Private / Internal IP Address
        if ip_classification == "Private/Internal":
            result = {
                "ip": clean_ip,
                "port": final_port,
                "is_valid": True,
                "type": "Private/Internal",
                "vpn": False,
                "proxy": False,
                "tor": False,
                "risk": "low",
                "provider": "Internal Corporate Subnet (RFC 1918 / Loopback)",
                "country": "Local / Internal",
                "country_code": "LOC",
                "previous_alerts": prev_alerts_count,
                "source": "private_network",
                "reason": "Internal private address space is isolated from public anonymity relays."
            }
            self._save_to_cache(clean_ip, result)
            return result

        # 4. Case C: External API configured via IP_INTELLIGENCE_API_KEY
        if self.api_key:
            api_result = self._fetch_external_intel(clean_ip)
            if api_result:
                result = {
                    **api_result,
                    "ip": clean_ip,
                    "port": final_port,
                    "is_valid": True,
                    "type": "Public/External",
                    "previous_alerts": prev_alerts_count,
                }
                self._save_to_cache(clean_ip, result)
                return result

        # 5. Case D: Safe Demo/Fallback for generic public IPs when no external provider is configured
        result = {
            "ip": clean_ip,
            "port": final_port,
            "is_valid": True,
            "type": "Public/External",
            "vpn": "unknown",
            "proxy": "unknown",
            "tor": "unknown",
            "risk": "unknown",
            "provider": "External ISP / Unresolved",
            "country": "Unknown",
            "country_code": "--",
            "previous_alerts": prev_alerts_count,
            "source": "demo_fallback",
            "reason": "IP intelligence provider not configured (set IP_INTELLIGENCE_API_KEY for live external lookup)"
        }
        self._save_to_cache(clean_ip, result)
        return result

    def _fetch_external_intel(self, ip_str: str) -> Optional[Dict[str, Any]]:
        """
        Query an external IP intelligence API safely with timeout and error handling.
        Supports standard IP intelligence format or VPNAPI/IPInfo.
        """
        try:
            url = f"https://vpnapi.io/api/{ip_str}?key={self.api_key}"
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "ThreatLens-SOC/1.0", "Accept": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=2.5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    security = data.get("security", {})
                    location = data.get("location", {})
                    network = data.get("network", {})

                    is_vpn = bool(security.get("vpn", False))
                    is_proxy = bool(security.get("proxy", False))
                    is_tor = bool(security.get("tor", False))

                    risk = "high" if (is_tor or is_proxy) else ("medium" if is_vpn else "low")

                    return {
                        "vpn": is_vpn,
                        "proxy": is_proxy,
                        "tor": is_tor,
                        "risk": risk,
                        "provider": network.get("autonomous_system_organization", network.get("autonomous_system_number", "External Provider")),
                        "country": location.get("country", "Unknown"),
                        "country_code": location.get("country_code", "--"),
                        "source": "ip_intelligence_provider"
                    }
        except Exception:
            # External API failure or timeout: never crash prediction service
            pass
        return None

    def _save_to_cache(self, ip_str: str, data: Dict[str, Any]):
        """Cache IP intelligence results with bounded memory."""
        global _intel_cache
        if len(_intel_cache) > 1000:
            # Clear oldest 20%
            keys_to_remove = list(_intel_cache.keys())[:200]
            for k in keys_to_remove:
                _intel_cache.pop(k, None)
        _intel_cache[ip_str] = (time.time(), data)

    @staticmethod
    def calculate_risk_correlation(ml_result: Dict[str, Any], ip_intel: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate an explainable, deterministic risk correlation combining ML Intrusion Detection
        with IP Intelligence.

        Correlation Logic:
        1. ML Attack + Anonymized (Tor / Proxy / High Risk IP) -> CRITICAL
        2. ML Attack + VPN / Prior Alerts (>= 3) -> HIGH
        3. ML Attack + Normal/Unknown IP -> Severity based on ML confidence
        4. ML Normal + Anonymized (Tor / Proxy) -> MEDIUM (Suspicious connection point despite benign pattern)
        5. ML Normal + Clean/Unknown IP -> LOW (Clean baseline)
        """
        is_attack = ml_result.get("prediction") == "Attack" or ml_result.get("binary_prediction") == 1
        attack_prob = float(ml_result.get("attack_probability", 0.0))
        attack_category = ml_result.get("attack_category", "DoS")
        attack_type = ml_result.get("attack_type", "Anomalous Flow")

        is_vpn = ip_intel.get("vpn") is True
        is_proxy = ip_intel.get("proxy") is True
        is_tor = ip_intel.get("tor") is True
        ip_risk = str(ip_intel.get("risk", "unknown")).lower()
        prev_alerts = int(ip_intel.get("previous_alerts", 0))

        # Explainable factors
        ml_summary = f"{'Attack' if is_attack else 'Normal'} ({attack_prob * 100:.1f}% confidence, {attack_category})"
        ip_factors = []
        if is_tor:
            ip_factors.append("Tor Exit Node")
        if is_proxy:
            ip_factors.append("Anonymous Proxy")
        if is_vpn:
            ip_factors.append("Commercial VPN Gateway")
        if prev_alerts > 0:
            ip_factors.append(f"{prev_alerts} previous alert(s)")
        if not ip_factors:
            ip_factors.append(f"IP Risk: {ip_risk.capitalize() if ip_risk != 'unknown' else 'Unknown'}")

        ip_summary = ", ".join(ip_factors)

        if is_attack:
            if is_tor or is_proxy or ip_risk == "high" or attack_prob >= 0.95:
                overall_risk = "CRITICAL"
                explanation = (
                    f"High-threat intrusion flagged by Random Forest model ({attack_type}) "
                    f"and corroborated by high-risk network provenance ({ip_summary})."
                )
            elif is_vpn or prev_alerts >= 3 or attack_prob >= 0.80:
                overall_risk = "HIGH"
                explanation = (
                    f"Intrusion anomaly detected by Random Forest model with elevated risk "
                    f"due to anonymized routing ({ip_summary})."
                )
            elif attack_prob >= 0.65:
                overall_risk = "MEDIUM"
                explanation = f"Moderate intrusion anomaly flagged by model. IP intelligence: {ip_summary}."
            else:
                overall_risk = "LOW"
                explanation = f"Low-confidence anomaly flagged by model. IP intelligence: {ip_summary}."
        else:
            if is_tor or is_proxy:
                overall_risk = "MEDIUM"
                explanation = (
                    f"Normal traffic flow detected by ML model, but connection originates from "
                    f"anonymized routing infrastructure ({ip_summary}). Elevated monitoring recommended."
                )
            elif is_vpn or ip_risk == "medium":
                overall_risk = "LOW"
                explanation = f"Standard benign traffic baseline with commercial VPN routing detected ({ip_summary})."
            else:
                overall_risk = "LOW"
                explanation = "Standard benign traffic baseline with clean IP reputation."

        return {
            "overall_risk": overall_risk,
            "ml_prediction": "Attack" if is_attack else "Normal",
            "ml_confidence": f"{attack_prob * 100:.1f}%" if is_attack else f"{(1 - attack_prob) * 100:.1f}%",
            "ml_contribution": ml_summary,
            "ip_contribution": ip_summary,
            "correlation_summary": explanation,
            "vpn_detected": is_vpn,
            "proxy_detected": is_proxy,
            "tor_detected": is_tor,
            "ip_risk": ip_risk
        }
