"""
ThreatLens Automated End-to-End Test Suite
Tests ML predictions, IP Intelligence layer, VPN/Proxy/Tor detection,
risk correlation, SQLite alerts, and API health.
"""
import urllib.request
import urllib.parse
import json
import time

BASE_URL = "http://127.0.0.1:5000"

def get(url):
    req = urllib.request.Request(f"{BASE_URL}{url}", headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=5) as res:
        return res.status, json.loads(res.read().decode())

def post(url, data):
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}{url}",
        data=body,
        headers={"Content-Type": "application/json", "Accept": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=5) as res:
        return res.status, json.loads(res.read().decode())

def run_tests():
    print("=== STARTING THREATLENS END-TO-END VALIDATION ===\n")
    
    # 1. Health Check
    status, data = get("/api/health")
    print(f"[TEST 1] Health Check: HTTP {status}, Status: {data.get('status')}, Model Loaded: {data.get('model_loaded')}")
    assert status == 200 and data.get("model_loaded") is True

    # 2. Private IP Intelligence
    status, data = get("/api/ip-intelligence/192.168.1.105")
    print(f"[TEST 2] Private IP (192.168.1.105): Type={data.get('type')}, VPN={data.get('vpn')}, Proxy={data.get('proxy')}, Risk={data.get('risk')}")
    assert data.get("type") == "Private/Internal" and data.get("vpn") is False

    # 3. Known Demo VPN IP
    status, data = get("/api/ip-intelligence/198.51.100.25")
    print(f"[TEST 3] Demo VPN IP (198.51.100.25): Type={data.get('type')}, VPN={data.get('vpn')}, Provider={data.get('provider')}, Risk={data.get('risk')}")
    assert data.get("vpn") is True and data.get("type") == "Public/External"

    # 4. Known Demo Tor Exit Node
    status, data = get("/api/ip-intelligence/185.220.101.5")
    print(f"[TEST 4] Demo Tor IP (185.220.101.5): Tor={data.get('tor')}, Risk={data.get('risk')}, Country={data.get('country')}")
    assert data.get("tor") is True and data.get("risk") == "high"

    # 5. Known Demo Anonymous Proxy Node
    status, data = get("/api/ip-intelligence/203.0.113.88")
    print(f"[TEST 5] Demo Proxy IP (203.0.113.88): Proxy={data.get('proxy')}, Risk={data.get('risk')}")
    assert data.get("proxy") is True

    # 6. Unconfigured/Unknown Public IP
    status, data = get("/api/ip-intelligence/142.250.190.46")
    print(f"[TEST 6] Unconfigured Public IP: VPN={data.get('vpn')}, Source={data.get('source')}, Reason={data.get('reason')}")
    assert data.get("vpn") == "unknown" and data.get("source") == "demo_fallback"

    # 7. Invalid IP address
    status, data = get("/api/ip-intelligence/999.999.999.999")
    print(f"[TEST 7] Invalid IP: is_valid={data.get('is_valid')}, Type={data.get('type')}")
    assert data.get("is_valid") is False

    # 8. Prediction WITHOUT IP (Backward Compatibility)
    payload_no_ip = {
        "duration": 0, "protocol_type": "tcp", "service": "http", "flag": "SF",
        "src_bytes": 215, "dst_bytes": 3200, "count": 5, "srv_count": 5,
        "serror_rate": 0.0, "same_srv_rate": 1.0, "diff_srv_rate": 0.0
    }
    status, data = post("/api/predict", payload_no_ip)
    print(f"[TEST 8] POST /api/predict (no IP): Prediction={data.get('prediction')}, NormalProb={data.get('normal_probability')}, IPType={data.get('ip_type')}")
    assert status == 200 and data.get("prediction") == "Normal"

    # 9. Prediction WITH DoS Attack Flow + VPN Egress IP (Correlated Risk)
    payload_dos_vpn = {
        "source_ip": "198.51.100.25", "destination_ip": "10.0.0.1",
        "source_port": 49152, "destination_port": 80,
        "duration": 0, "protocol_type": "tcp", "service": "private", "flag": "S0",
        "src_bytes": 0, "dst_bytes": 0, "count": 160, "srv_count": 2,
        "serror_rate": 1.0, "same_srv_rate": 0.05, "diff_srv_rate": 0.75
    }
    status, data = post("/api/predict", payload_dos_vpn)
    corr = data.get("risk_correlation", {})
    intel = data.get("ip_intelligence", {})
    print(f"[TEST 9] POST /api/predict (DoS + VPN): Prediction={data.get('prediction')}, OverallRisk={data.get('overall_risk')}, VPN={intel.get('vpn')}, CorrelationSummary='{corr.get('correlation_summary')}'")
    assert status == 200 and data.get("prediction") == "Attack" and intel.get("vpn") is True

    # 10. Dashboard Stats & IP Telemetry
    status, data = get("/api/dashboard")
    print(f"[TEST 10] GET /api/dashboard: TotalTraffic={data.get('total_traffic')}, VPNAlerts={data.get('vpn_alerts_count')}, ProxyAlerts={data.get('proxy_alerts_count')}")
    assert status == 200 and "recent_alerts" in data

    # 11. Alerts Query & IP Context
    status, data = get("/api/alerts?per_page=5")
    alerts = data.get("alerts", [])
    print(f"[TEST 11] GET /api/alerts: Total={data.get('total')}, Retrieved={len(alerts)}")
    if alerts:
        a0 = alerts[0]
        print(f"         First Alert: ID={a0.get('id')}, Attack={a0.get('attack_type')}, Source={a0.get('source_ip')}, VPN={a0.get('vpn_detected')}, Risk={a0.get('overall_risk')}")
    assert status == 200

    print("\n=== ALL 11 END-TO-END SYSTEM TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
