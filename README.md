# 🛡️ ThreatLens — Intelligent Cyber Threat Detection & Simulation Platform

**ThreatLens** is an end-to-end network intrusion detection, real-time traffic analysis, and adversarial simulation dashboard. Powered by machine learning models trained on network flow benchmarks (NSL-KDD), ThreatLens classifies malicious network packets, assesses risk against the MITRE ATT&CK framework, and simulates real-world attack vectors in an interactive security operations center (SOC) dashboard.

---

## 🚀 Key Features

* **Real-Time Packet Flow & Traffic Inspection:**
  * Evaluate ingress network flow features (`protocol_type`, `service`, `flag`, `src_bytes`, `dst_bytes`, error rates, and packet rates).
  * Instant classification into **Normal** traffic or specific threat classes (**DoS**, **Probe**, **R2L**, **U2R**) with confidence percentages.
  * Direct triage and mitigation workflows (e.g., automated firewall drop rules).
  * Graceful fallback mechanisms for mock inferences when backend services are offline.

* **Adversarial Attack Simulator:**
  * Interactive synthetic attack vector generator simulating:
    * **DoS SYN Flood**
    * **Port Sweep & Reconnaissance Probes**
    * **Privilege Escalation**
  * Real-time streaming terminal view displaying timestamps, spoofed IPs, and mitigation actions.

* **Live Telemetry & Performance Analytics:**
  * Dynamic network throughput curves (packets/sec) updating in real time.
  * Multi-class threat distribution breakdown and severity monitoring.
  * Model health and drift telemetry tracking data-drift indices and inference latency.

* **CSV Batch Capture Scanner (Traffic Analyzer):**
  * Client-side multi-row packet capture file upload and parsing.
  * Interactive data preview table.
  * Bulk prediction submission returning threat counts, clean traffic percentages, and breakdown metrics.

* **Security Operations Center (SOC) Navigation:**
  * Responsive, cyber-defense dark-mode theme.
  * Slide-out hamburger navigation drawer alongside top navigation.
  * Dedicated views: **Dashboard**, **Live Alerts Feed**, **Traffic Analyzer**, **Attack Simulator**, **MITRE ATT&CK Risk Matrix**, and **Model Health & Telemetry**.

---

## 🛠️ Tech Stack & Architecture

* **Frontend:** React, Vite, TailwindCSS / Custom Cyber Theme CSS, SVG / Canvas Telemetry Visualizations
* **Backend:** Python, Flask / FastAPI, REST API endpoints (`/api/predict`, `/api/simulation`, `/api/health`)
* **Machine Learning:** Scikit-learn, NumPy, Pandas, Joblib (Models trained on NSL-KDD flow records)
* **Deployment & CI:** Configured for Vercel deployment with serverless route wrappers (`api/index.py`, `vercel.json`)

---

## 📂 Project Structure

```text
THREATLENS/
├── api/                        # Serverless entry points for deployment
│   ├── index.py                # Serverless Python wrapper
│   └── requirements.txt        # Serverless backend dependencies
├── backend/                    # Core Python backend
│   ├── app/
│   │   ├── routes/             # API routes (predict, alerts, health, simulation)
│   │   ├── services/           # Prediction & simulation services
│   │   └── utils/              # Validators and helpers
│   ├── requirements.txt        # Backend dependencies
│   └── run.py                  # Local development backend server
├── data/                       # Benchmark flow datasets (NSL-KDD)
├── frontend/                   # React + Vite frontend application
│   ├── src/
│   │   ├── components/         # Modals, Navbar, Sidebar drawer, UI elements
│   │   ├── pages/              # Dashboard, Analyzer, Alerts, Simulator, Health
│   │   ├── services/           # Frontend API clients
│   │   ├── App.jsx             # Main router and view manager
│   │   └── index.css           # Theme & cyber design tokens
│   ├── package.json
│   └── vite.config.js
├── ml/                         # Training, preprocessing & drift analysis scripts
├── models/                     # Serialized scikit-learn models & metadata
├── vercel.json                 # Vercel deployment configuration
└── README.md
