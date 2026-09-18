# ThreatLens — AI-Powered Network Intrusion Detection & SOC Alerting Platform

> **"Catch the Attack the Signatures Miss"**

ThreatLens is an enterprise-grade AI-powered Network Intrusion Detection System (NIDS) and Security Operations Center (SOC) alerting platform. It uses machine learning to analyze network traffic patterns, classify anomalies (Normal vs Attack), derive attack probabilities, and surface actionable security alerts to SOC analysts with model feature importances and interactive triage workflows.

---

## 🌟 Key Features

- **AI-Powered Anomaly Detection**: Random Forest model trained on network traffic telemetry (NSL-KDD benchmark dataset) for binary classification and risk scoring.
- **Executive SOC Dashboard**: Real-time traffic KPIs, attack timeline charts, severity breakdowns, and recent alert feeds.
- **Interactive Traffic Analyzer**: Batch CSV upload classification and single connection manual parameter testing.
- **SOC Analyst Workflow**:
  - Triage status tracking (`NEW`, `INVESTIGATING`, `RESOLVED`, `FALSE POSITIVE`).
  - Automated Recommended Actions.
  - Analyst Notes editor with database persistence.
- **Model Performance & Health Monitoring**:
  - Live Confusion Matrix, ROC-AUC curve, Precision, Recall, and F1 Score analytics.
  - Population Stability Index (PSI) drift monitoring and model status tracking.
- **Compact Collapsible Sidebar**: Icon-only navigation rail with tooltips by default (~68px) that expands smoothly (~250px) on toggle.

---

## 🏗️ Technology Stack

- **Frontend**: React, Vite, TailwindCSS v4, Lucide Icons, Recharts, Axios, React Router v7.
- **Backend**: Python, Flask, SQLite / SQLAlchemy, Joblib.
- **Machine Learning**: Scikit-Learn (Random Forest Classifier), Pandas, NumPy.

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- Python 3.9+
- Node.js 18+

### 2. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python run.py
```

The Flask API backend will start at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The React frontend dev server will start at `http://localhost:5173`.

---

## 📊 Machine Learning Model Pipeline

To re-train the Random Forest model on the NSL-KDD dataset:

```bash
cd ml
python train.py
python evaluate.py
```

The trained model binary is saved to `models/threatlens_model_v1.0.joblib`.

---

## 🛡️ Operational Safeguards Notice

ThreatLens is a **decision-support platform** designed for security analysts:
- It **NEVER** automatically blocks IP addresses or terminates active network connections.
- It **NEVER** performs offensive actions against real systems.
- Machine learning predictions are probabilistic indicators to assist SOC analysts in triage.

---

## Interface

### Routes

| Route | Page |
|---|---|
| `/` | Public landing page (no console chrome) |
| `/dashboard` | Executive SOC dashboard |
| `/analyzer` | Network traffic analyzer |
| `/alerts`, `/alerts/:id` | Alert queue and investigation view |
| `/model` | Model performance analytics |
| `/health` | Model health and drift monitor |
| `/settings` | System info and appearance |

### Themes

The UI ships with four themes, switchable from the header dropdown or from
**Settings → Appearance**:

| Theme | Description |
|---|---|
| `midnight` | Default SOC blue, dark |
| `obsidian` | Pure black, green terminal accents |
| `aurora` | Violet night-shift palette |
| `daylight` | Light, high contrast |

The choice is stored in `localStorage` under `threatlens.theme` and falls back to
the OS `prefers-color-scheme` setting on first visit. An inline script in
`index.html` applies it before first paint to avoid a flash of the wrong palette.

Every colour in the app comes from a CSS custom property defined in
`src/index.css`; themes work by swapping those tokens on `<html data-theme>`.
Charts are the one exception — Recharts needs literal colour strings, so
components use the `useThemeTokens` hook from `src/theme/ThemeContext.jsx` to read
the live computed values.

**Adding a theme:** add a `[data-theme="yourname"]` block in `src/index.css`
defining the same token set, then append an entry to the `THEMES` array in
`src/theme/ThemeContext.jsx`. Nothing else needs to change.
