# 🛡️ ThreatLens Architecture: ML Intrusion Detection & IP Intelligence Layer

## Executive Summary & Design Principle

> [!IMPORTANT]
> **Core Architectural Distinction:**
> **ThreatLens's Random Forest detects suspicious network behavior from network-flow features.**
> **VPN/IP intelligence is an additional enrichment layer and is NOT claimed to be learned directly by the NSL-KDD model.**

```
Network Ingress Traffic Record
             |
             v
+-----------------------------+
|    ML Intrusion Detection   | ---> Random Forest Model (NSL-KDD 41 Flow Features)
|   Binary: Normal vs Attack  | ---> Classification & Attack Type Mapping (DoS, Probe, R2L, U2R)
+-----------------------------+
             |
             +----------------------------------+
             |                                  |
             v                                  v
+--------------------------+       +------------------------------------+
|  Attack Classification   |       |       IP Intelligence Layer        |
|  & MITRE ATT&CK Mapping  |       |  (Modular Security Microservice)   |
|  (T1498, T1046, etc.)    |       |  - IPv4 / IPv6 Validation          |
+--------------------------+       |  - Public vs Private LAN Egress    |
             |                     |  - Commercial VPN Detection        |
             |                     |  - Anonymous Proxy & Tor Exit Node |
             |                     |  - Provider / ASN & Country        |
             |                     |  - Historical Incident Frequency   |
             |                     +------------------------------------+
             |                                  |
             +-----------------+----------------+
                               |
                               v
               +-------------------------------+
               |    SOC Risk Correlation       |
               | (Deterministic Explainability)|
               +-------------------------------+
                               |
                               v
               +-------------------------------+
               |   Enriched SOC Alert Record   |
               |  (Detect -> Enrich -> Alert)  |
               +-------------------------------+
                               |
                               v
               +-------------------------------+
               |     THREATLENS Dashboard      |
               | (Interactive SOC Operations)  |
               +-------------------------------+
```

---

## 1. Component Architecture Breakdown

### A. Machine Learning Detection Layer
* **Algorithm**: Scikit-Learn Random Forest Classifier (`n_estimators=200`, balanced class weighting).
* **Dataset & Feature Space**: 41 NSL-KDD network-flow metrics (including connection duration, service type, TCP flag distribution, source/destination bytes, error rates `serror_rate`, `srv_serror_rate`, count frequencies, and host-level connection density).
* **Output**: Binary classification (`Normal` vs `Attack`) and calibrated probabilities.
* **Role**: Evaluates *packet flow kinetics and behavioral anomalies*.

### B. IP Intelligence Layer (`IPIntelligenceService`)
* **Role**: Evaluates *network provenance, routing anonymity, and historical threat reputation*.
* **Validation**: Strict IPv4 and IPv6 syntax verification via Python's standard `ipaddress` library.
* **Network Scoping**: Distinguishes RFC 1918 private LAN traffic (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`, `127.0.0.1`) from public WAN addresses.
* **Provider Integration**: Supports live external threat intelligence APIs via the `IP_INTELLIGENCE_API_KEY` environment variable with built-in timeouts (2.5s) and fallback mechanisms to ensure the ML pipeline never blocks or fails.
* **Caching**: Built-in 10-minute TTL in-memory LRU cache to prevent duplicate external lookups and respect rate limits.

### C. VPN Detection
* Flags traffic routed through commercial VPN providers (e.g. NordSecurity, ExpressVPN, Surfshark, datacenter VPN relays).
* Output states: `true`, `false`, or `unknown` (with an explicit reason if an external provider is not configured).

### D. Proxy & Tor Detection
* Flags connections originating from anonymous HTTP/SOCKS open proxies or Tor Project onion router exit nodes.
* Tor exit relays and anonymous open proxies represent high-risk anonymization infrastructure and trigger elevated triage priority.

### E. Explainable Risk Correlation
ThreatLens avoids black-box arbitrary risk numbers. Instead, it computes an **explainable, deterministic correlation** between the ML flow detection and the IP intelligence layer:

| ML Classification | Confidence | IP Anonymization / Provenance | Correlated Overall Risk | Action Workflow |
| :--- | :--- | :--- | :--- | :--- |
| **Attack** | $\ge 85\%$ | **Tor Exit / Anonymous Proxy** | **CRITICAL** | Immediate SOC Escalation & Packet Trace |
| **Attack** | $\ge 70\%$ | **Commercial VPN / $\ge 3$ Previous Alerts** | **HIGH** | Priority Incident Review & Egress Audit |
| **Attack** | $\ge 50\%$ | **Private LAN / Clean Public IP** | **MEDIUM / HIGH** | Standard SOC Alert for Analyst Review |
| **Normal** | High | **Tor Exit / Anonymous Proxy** | **MEDIUM** | Watchlist Flagged (Benign flow on risky node) |
| **Normal** | High | **Private LAN / Clean Public IP** | **LOW** | Benign Baseline Permitted |

### F. SOC Incident Alerting
* Workflow: **DETECT $\rightarrow$ ENRICH $\rightarrow$ ALERT SOC**
* **Non-Destructive Principle**: ThreatLens alerts the SOC analyst with full situational context rather than blindly executing brittle automated packet drops.

---

## 2. API Endpoints

### 1. `GET /api/ip-intelligence/<ip>`
Queries standalone IP intelligence.
```json
{
  "ip": "198.51.100.25",
  "type": "Public/External",
  "vpn": true,
  "proxy": false,
  "tor": false,
  "risk": "medium",
  "provider": "NordSecurity / Commercial VPN Egress",
  "country": "United States",
  "previous_alerts": 3,
  "source": "Demo IP Intelligence"
}
```

### 2. `POST /api/predict`
Evaluates flow features and enriches response with IP intelligence and risk correlation.
```json
{
  "prediction": "Attack",
  "confidence": "98.4%",
  "attack_type": "DDoS SYN Flood (DoS)",
  "attack_category": "DoS",
  "severity": "Critical",
  "overall_risk": "CRITICAL",
  "source_ip": "185.220.101.5",
  "destination_ip": "10.0.0.1:80",
  "source_port": 60231,
  "destination_port": 80,
  "ip_type": "Public/External",
  "ip_intelligence": {
    "ip": "185.220.101.5",
    "vpn": false,
    "proxy": false,
    "tor": true,
    "risk": "high",
    "provider": "Tor Project Exit Relay Node",
    "country": "Germany",
    "previous_alerts": 5,
    "source": "Demo IP Intelligence"
  },
  "risk_correlation": {
    "overall_risk": "CRITICAL",
    "ml_contribution": "Attack (98.4% confidence, DoS)",
    "ip_contribution": "Tor Exit Node, 5 previous alert(s)",
    "correlation_summary": "High-threat intrusion flagged by Random Forest model (DDoS SYN Flood) and corroborated by high-risk network provenance (Tor Exit Node, 5 previous alert(s))."
  }
}
```
