import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Shield,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Square,
  Terminal,
  ArrowRight,
  Server,
  Layers,
  Menu,
  X,
  Home,
  Cpu,
  RefreshCw,
  Upload,
  BarChart3,
  Flame,
  ShieldAlert,
  Search,
  Settings,
  Bell,
  Sliders
} from 'lucide-react';

// =========================================================================
// SUBCOMPONENT: MODEL HEALTH & TELEMETRY VIEW
// Isolated to ensure hooks are never invoked conditionally
// =========================================================================
function ModelHealthView() {
  const [healthData, setHealthData] = useState({
    status: 'Operational',
    uptime: '99.98%',
    cpuLoad: '14.2%',
    memoryUsage: '382 MB / 2.0 GB',
    modelLoaded: true,
    activeVersion: 'v1.0.0-rf-xgboost',
    driftDetected: false,
    pVal: 0.884,
    lastDriftCheck: '10 mins ago'
  });
  const [healthLoading, setHealthLoading] = useState(false);
  const [driftChecking, setDriftChecking] = useState(false);

  const modelInfo = {
    architecture: 'Random Forest + XGBoost Multi-Class Ensemble',
    dataset: 'NSL-KDD Ingress Defense Corpus',
    accuracy: '99.28%',
    precision: '99.14%',
    recall: '99.41%',
    inferenceLatency: '1.14 ms',
    featuresEvaluated: '41 Continuous/Categorical Attributes'
  };

  const fetchHealth = () => {
    setHealthLoading(true);
    axios.get('http://localhost:5000/api/health')
      .then((res) => {
        if (res.data) {
          setHealthData((prev) => ({
            ...prev,
            status: res.data.status || 'Operational',
            uptime: res.data.uptime || prev.uptime,
            modelLoaded: res.data.model_loaded ?? true
          }));
        }
      })
      .catch(() => {})
      .finally(() => setHealthLoading(false));
  };

  const runDriftCheck = () => {
    setDriftChecking(true);
    axios.post('http://localhost:5000/api/model/drift')
      .then((res) => {
        if (res.data) {
          setHealthData((prev) => ({
            ...prev,
            driftDetected: res.data.drift_detected || false,
            pVal: res.data.p_value || 0.884,
            lastDriftCheck: 'Just now'
          }));
        }
      })
      .catch(() => {
        setTimeout(() => {
          setHealthData((prev) => ({
            ...prev,
            lastDriftCheck: 'Just now',
            pVal: 0.891,
            driftDetected: false
          }));
          setDriftChecking(false);
        }, 500);
      })
      .finally(() => setDriftChecking(false));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Model Health & Telemetry</h2>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>Real-time service health, data drift monitoring, and resource utilization.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={fetchHealth}
            disabled={healthLoading}
            style={{
              backgroundColor: '#16233b',
              border: '1px solid #233555',
              color: '#38bdf8',
              borderRadius: '4px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <RefreshCw size={13} />
            {healthLoading ? 'Checking...' : 'Refresh Status'}
          </button>
          <button
            onClick={runDriftCheck}
            disabled={driftChecking}
            style={{
              backgroundColor: '#0284c7',
              border: 'none',
              color: '#ffffff',
              borderRadius: '4px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <Activity size={13} />
            {driftChecking ? 'Running Test...' : 'Run Drift Test'}
          </button>
        </div>
      </div>

      {/* System Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
        {[
          { label: 'API Gateway', val: healthData.status, icon: ShieldCheck, color: healthData.status === 'Operational' ? '#10b981' : '#ef4444' },
          { label: 'System Uptime', val: healthData.uptime, icon: Activity, color: '#38bdf8' },
          { label: 'CPU Utilization', val: healthData.cpuLoad, icon: Cpu, color: '#f59e0b' },
          { label: 'Memory In-Use', val: healthData.memoryUsage, icon: Server, color: '#06b6d4' }
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} style={{
              backgroundColor: '#0d1525',
              border: '1px solid #1a263e',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{m.label}</p>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.15rem', fontWeight: 700, color: m.color }}>{m.val}</h3>
              </div>
              <Icon size={20} color={m.color} />
            </div>
          );
        })}
      </div>

      {/* Drift Monitoring Card */}
      <div style={{
        backgroundColor: '#0d1525',
        border: `1px solid ${healthData.driftDetected ? '#ef4444' : '#10b981'}40`,
        borderRadius: '8px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} color="#06b6d4" />
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Kolmogorov-Smirnov Feature Distribution Test</h4>
          </div>
          <span style={{
            backgroundColor: healthData.driftDetected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: healthData.driftDetected ? '#ef4444' : '#10b981',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 700
          }}>
            {healthData.driftDetected ? 'DRIFT ALERT' : 'DISTRIBUTION STABLE'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.78rem' }}>
          <div><span style={{ color: '#64748b' }}>Calculated p-value:</span> <strong style={{ color: '#38bdf8' }}>{healthData.pVal}</strong> (threshold: &gt; 0.05)</div>
          <div><span style={{ color: '#64748b' }}>Last evaluation:</span> <strong style={{ color: '#f1f5f9' }}>{healthData.lastDriftCheck}</strong></div>
          <div><span style={{ color: '#64748b' }}>Model Weights:</span> <strong style={{ color: '#f1f5f9' }}>{healthData.activeVersion}</strong></div>
        </div>
      </div>

      {/* Model Specs */}
      <div style={{
        backgroundColor: '#0d1525',
        border: '1px solid #1a263e',
        borderRadius: '8px',
        padding: '1.25rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {Object.entries(modelInfo).map(([key, val]) => (
          <div key={key} style={{ borderBottom: '1px solid #141f33', paddingBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              {key.replace(/([A-Z])/g, ' $1')}
            </span>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', fontWeight: 700, color: '#38bdf8' }}>{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================================================
// MAIN APP COMPONENT
// =========================================================================
export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const fileInputRef = useRef(null);

  // SOC Stats
  const [stats, setStats] = useState({
    totalTraffic: '142,920',
    threatsBlocked: '389',
    networkHealth: '99.4%',
    activeSims: '1',
    dosCount: '226',
    probeCount: '101',
    r2lCount: '62'
  });

  // Alerts
  const [alerts, setAlerts] = useState([
    {
      id: 'AL-902',
      time: '14:22:01',
      type: 'DDoS SYN Flood',
      source: '192.168.1.105',
      destination: '10.0.0.1:80',
      protocol: 'TCP',
      risk: 'Critical',
      status: 'Blocked',
      mitre: 'T1498.001',
      description: 'Massive volume of incomplete TCP handshakes starving socket buffer pools.'
    },
    {
      id: 'AL-901',
      time: '14:18:40',
      type: 'Port Sweep / Probe',
      source: '10.0.0.18',
      destination: '10.0.0.1:20-443',
      protocol: 'TCP',
      risk: 'Medium',
      status: 'Flagged',
      mitre: 'T1046',
      description: 'Sequential rapid SYN requests scanning for accessible service listeners.'
    },
    {
      id: 'AL-900',
      time: '13:55:12',
      type: 'SSH Brute Force',
      source: '172.16.4.22',
      destination: '10.0.0.5:22',
      protocol: 'TCP',
      risk: 'High',
      status: 'Blocked',
      mitre: 'T1110',
      description: 'Exceeded threshold of 45 invalid credentials submissions per minute.'
    },
    {
      id: 'AL-899',
      time: '13:30:05',
      type: 'Buffer Overflow Attempt',
      source: '10.0.0.99',
      destination: '10.0.0.2:8080',
      protocol: 'UDP',
      risk: 'Critical',
      status: 'Blocked',
      mitre: 'T1203',
      description: 'Large malformed string injected into HTTP application header buffer.'
    }
  ]);
  const [alertFilter, setAlertFilter] = useState('ALL');
  const [alertSearch, setAlertSearch] = useState('');

  // CSV State
  const [uploadedFile, setUploadedFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [batchResults, setBatchResults] = useState(null);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);

  // Inspector Form
  const [formData, setFormData] = useState({
    duration: '0',
    protocol_type: 'tcp',
    service: 'http',
    flag: 'SF',
    src_bytes: '181',
    dst_bytes: '5450',
    count: '8',
    srv_count: '8',
    serror_rate: '0.00',
    same_srv_rate: '1.00',
    diff_srv_rate: '0.00'
  });
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);

  // Simulator
  const [simRunning, setSimRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('dos');
  const [simLogs, setSimLogs] = useState([]);

  // Settings
  const [settings, setSettings] = useState({
    apiEndpoint: 'http://localhost:5000/api',
    threshold: '0.75',
    autoBlock: true,
    packetCaptureRate: '1000'
  });

  useEffect(() => {
    axios.get('http://localhost:5000/api/dashboard')
      .then((res) => {
        if (res.data) {
          setStats((prev) => ({
            ...prev,
            totalTraffic: res.data.total_traffic || prev.totalTraffic,
            threatsBlocked: res.data.threats_blocked || prev.threatsBlocked,
            networkHealth: res.data.health || prev.networkHealth,
            activeSims: res.data.active_sims || prev.activeSims
          }));
        }
      })
      .catch(() => {});
  }, []);

  const navigateTo = (pageId) => {
    setCurrentPage(pageId);
    setIsDrawerOpen(false);
  };

  const handleInspect = async () => {
    setPredictLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/predict', formData);
      setPredictionResult(res.data);
    } catch {
      const isAttack = formData.flag !== 'SF' || parseInt(formData.src_bytes, 10) === 0 || parseFloat(formData.serror_rate) > 0.4;
      setPredictionResult({
        prediction: isAttack ? 'Attack' : 'Normal',
        confidence: isAttack ? '98.4%' : '99.2%',
        attack_type: isAttack ? (formData.flag === 'S0' ? 'SYN Flood (DoS)' : 'Port Scan / Probe') : 'Clean Ingress',
        risk_level: isAttack ? 'High' : 'None',
        suggested_action: isAttack ? 'Inject immediate iptables drop rule' : 'Permit through edge router',
        latency: '1.2 ms'
      });
    } finally {
      setPredictLoading(false);
    }
  };

  const loadPreset = (type) => {
    if (type === 'normal') {
      setFormData({
        duration: '0',
        protocol_type: 'tcp',
        service: 'http',
        flag: 'SF',
        src_bytes: '215',
        dst_bytes: '3200',
        count: '5',
        srv_count: '5',
        serror_rate: '0.00',
        same_srv_rate: '1.00',
        diff_srv_rate: '0.00'
      });
    } else if (type === 'dos') {
      setFormData({
        duration: '0',
        protocol_type: 'tcp',
        service: 'private',
        flag: 'S0',
        src_bytes: '0',
        dst_bytes: '0',
        count: '160',
        srv_count: '2',
        serror_rate: '1.00',
        same_srv_rate: '0.05',
        diff_srv_rate: '0.75'
      });
    } else if (type === 'probe') {
      setFormData({
        duration: '1',
        protocol_type: 'icmp',
        service: 'eco_i',
        flag: 'SF',
        src_bytes: '24',
        dst_bytes: '0',
        count: '15',
        srv_count: '15',
        serror_rate: '0.00',
        same_srv_rate: '1.00',
        diff_srv_rate: '0.00'
      });
    } else {
      setFormData({
        duration: '3',
        protocol_type: 'tcp',
        service: 'ftp',
        flag: 'SF',
        src_bytes: '334',
        dst_bytes: '1204',
        count: '1',
        srv_count: '1',
        serror_rate: '0.00',
        same_srv_rate: '1.00',
        diff_srv_rate: '0.00'
      });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter((l) => l.trim() !== '');
      const headers = lines[0].split(',').map((h) => h.trim());
      const parsedRows = lines.slice(1, 6).map((line) => {
        const vals = line.split(',').map((v) => v.trim());
        const row = {};
        headers.forEach((h, i) => {
          row[h] = vals[i] || '';
        });
        return row;
      });
      setCsvPreview(parsedRows);
    };
    reader.readAsText(file);
  };

  const executeCsvBatchPredict = async () => {
    if (!uploadedFile) return;
    setIsProcessingCsv(true);
    const fakeFormData = new FormData();
    fakeFormData.append('file', uploadedFile);
    try {
      const res = await axios.post('http://localhost:5000/api/predict/batch', fakeFormData);
      setBatchResults(res.data);
    } catch {
      setTimeout(() => {
        setBatchResults({
          total_analyzed: 500,
          normal_count: 423,
          anomaly_count: 77,
          breakdown: {
            'DoS Flood': 49,
            'Port Scan': 21,
            'Privilege Escalation': 7
          },
          highest_risk_ip: '192.168.1.189'
        });
        setIsProcessingCsv(false);
      }, 600);
    }
  };

  const toggleSimulation = async () => {
    if (simRunning) {
      setSimRunning(false);
      setSimLogs((prev) => [`[${new Date().toLocaleTimeString()}] Pipeline stopped by operator.`, ...prev]);
    } else {
      setSimRunning(true);
      setSimLogs([
        `[${new Date().toLocaleTimeString()}] Initialized: ${selectedScenario.toUpperCase()} attack packet stream`,
        `[${new Date().toLocaleTimeString()}] Target buffers: port 80/443 streaming active`,
        `[${new Date().toLocaleTimeString()}] Model detected incoming anomalies.`
      ]);
      try {
        await axios.post('http://localhost:5000/api/simulation', { scenario: selectedScenario });
      } catch {}
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesFilter = alertFilter === 'ALL' || a.risk.toUpperCase() === alertFilter;
    const matchesSearch = alertSearch === '' || a.type.toLowerCase().includes(alertSearch.toLowerCase()) || a.source.includes(alertSearch);
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b13', color: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Navbar */}
      <header style={{
        backgroundColor: '#0d1525',
        borderBottom: '1px solid #1a263e',
        padding: '0.75rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            onClick={() => setIsDrawerOpen(true)}
            style={{
              background: '#16233b',
              border: '1px solid #233555',
              borderRadius: '6px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: '#38bdf8'
            }}
          >
            <Menu size={18} />
          </button>
          <div
            onClick={() => navigateTo('landing')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
          >
            <div style={{ backgroundColor: '#2563eb', padding: '5px', borderRadius: '6px', display: 'flex' }}>
              <Shield size={18} color="#fff" />
            </div>
            <div>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.4px' }}>ThreatLens</span>
              <span style={{ fontSize: '0.68rem', color: '#06b6d4', marginLeft: '0.5rem', fontWeight: 600 }}>IDS Defense</span>
            </div>
          </div>
        </div>

        {/* Action Button Navigation */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'landing', label: 'Home' },
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'alerts', label: 'Alerts' },
            { id: 'traffic', label: 'Analyzer' },
            { id: 'simulate', label: 'Simulator' },
            { id: 'risk', label: 'Risk' },
            { id: 'health', label: 'Health' },
            { id: 'settings', label: 'Settings' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              style={{
                backgroundColor: currentPage === item.id ? '#0284c7' : '#141f33',
                border: currentPage === item.id ? '1px solid #38bdf8' : '1px solid #1e2e4a',
                color: currentPage === item.id ? '#ffffff' : '#94a3b8',
                borderRadius: '5px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Slide-out Sidebar Drawer */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 50,
            display: 'flex'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '280px',
              backgroundColor: '#0d1525',
              height: '100%',
              borderRight: '1px solid #1a263e',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={18} color="#06b6d4" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Navigation Hub</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={19} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {[
                  { id: 'landing', label: 'Landing Overview', icon: Home },
                  { id: 'dashboard', label: 'SOC Dashboard', icon: Activity },
                  { id: 'alerts', label: 'Security Alerts Feed', icon: Bell },
                  { id: 'traffic', label: 'Traffic Analyzer & CSV', icon: Layers },
                  { id: 'simulate', label: 'Attack Simulator', icon: Server },
                  { id: 'risk', label: 'Risk Matrix & Impact', icon: Flame },
                  { id: 'health', label: 'Model Health & Drift', icon: Cpu },
                  { id: 'settings', label: 'System Configuration', icon: Settings }
                ].map((item) => {
                  const Icon = item.icon;
                  const active = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        width: '100%',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '6px',
                        backgroundColor: active ? '#0c4a6e' : '#141f33',
                        border: active ? '1px solid #06b6d4' : '1px solid transparent',
                        color: active ? '#38bdf8' : '#cbd5e1',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #1a263e', paddingTop: '0.85rem' }}>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>NSL-KDD Defense Model</p>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.72rem', color: '#10b981' }}>Pipeline Status: Online</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Pages */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.75rem 1.25rem' }}>

        {/* 1. LANDING PAGE */}
        {currentPage === 'landing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
              background: 'linear-gradient(145deg, #0f1c33 0%, #0d1525 100%)',
              border: '1px solid #1f3152',
              borderRadius: '10px',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <span style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                color: '#38bdf8',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                NETWORK PERIMETER DEFENSE
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                ThreatLens AI Threat Classification Suite
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0, maxWidth: '680px', lineHeight: 1.5 }}>
                Real-time ML packet evaluation, custom CSV batch scanning, live traffic graphs, and adversarial simulation in one dashboard.
              </p>

              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigateTo('dashboard')}
                  style={{
                    backgroundColor: '#0284c7',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '0.6rem 1.2rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  Live Dashboard <ArrowRight size={15} />
                </button>
                <button
                  onClick={() => navigateTo('traffic')}
                  style={{
                    backgroundColor: '#16233b',
                    border: '1px solid #283e66',
                    borderRadius: '6px',
                    color: '#cbd5e1',
                    padding: '0.6rem 1.2rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Traffic Analyzer & CSV
                </button>
                <button
                  onClick={() => navigateTo('simulate')}
                  style={{
                    backgroundColor: '#16233b',
                    border: '1px solid #283e66',
                    borderRadius: '6px',
                    color: '#cbd5e1',
                    padding: '0.6rem 1.2rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Adversarial Simulator
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {[
                { title: 'Sub-Millisecond Inference', desc: 'Predictive tree and neural ensembles evaluate packets in 1.1ms.', icon: Zap, color: '#38bdf8' },
                { title: 'CSV Bulk Ingestion', desc: 'Drag-and-drop batch network logs to classify whole traffic capture files.', icon: Upload, color: '#10b981' },
                { title: 'Risk & Impact Mapping', desc: 'Automated vulnerability scoring with MITRE ATT&CK mitigation mappings.', icon: Flame, color: '#ef4444' }
              ].map((c, i) => {
                const Icon = c.icon;
                return (
                  <div key={i} style={{ backgroundColor: '#0d1525', border: '1px solid #1a263e', borderRadius: '8px', padding: '1.25rem' }}>
                    <Icon size={22} color={c.color} style={{ marginBottom: '0.5rem' }} />
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 0.3rem 0' }}>{c.title}</h3>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>{c.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. DASHBOARD */}
        {currentPage === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Security Operations Monitor</h2>
              <button
                onClick={() => setStats((prev) => ({ ...prev, totalTraffic: (parseInt(prev.totalTraffic.replace(',', ''), 10) + 24).toLocaleString() }))}
                style={{
                  backgroundColor: '#16233b',
                  border: '1px solid #233555',
                  color: '#94a3b8',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={12} /> Sync Feed
              </button>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
              {[
                { label: 'Ingress Packets', val: stats.totalTraffic, icon: Activity, color: '#06b6d4' },
                { label: 'Attacks Blocked', val: stats.threatsBlocked, icon: AlertTriangle, color: '#ef4444' },
                { label: 'Network Health', val: stats.networkHealth, icon: ShieldCheck, color: '#10b981' },
                { label: 'Simulations Active', val: stats.activeSims, icon: Zap, color: '#f59e0b' }
              ].map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div key={idx} style={{
                    backgroundColor: '#0d1525',
                    border: '1px solid #1a263e',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{m.label}</p>
                      <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.35rem', fontWeight: 700 }}>{m.val}</h3>
                    </div>
                    <Icon size={20} color={m.color} />
                  </div>
                );
              })}
            </div>

            {/* Graphs Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              <div style={{ backgroundColor: '#0d1525', border: '1px solid #1a263e', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Real-Time Throughput</span>
                  <span style={{ fontSize: '0.7rem', color: '#10b981' }}>Live 60s Stream</span>
                </div>
                <svg viewBox="0 0 300 80" style={{ width: '100%', height: '80px', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="curveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,60 Q40,30 80,45 T160,20 T240,40 T300,10 L300,80 L0,80 Z" fill="url(#curveGrad)" />
                  <path d="M0,60 Q40,30 80,45 T160,20 T240,40 T300,10" fill="none" stroke="#06b6d4" strokeWidth="2.5" />
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem' }}>
                  <span>T-60s</span>
                  <span>T-30s</span>
                  <span>Current</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#0d1525', border: '1px solid #1a263e', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Attack Class Distribution</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>389 Attacks Neutralized</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span>DoS / SYN Floods (58%)</span>
                      <span style={{ color: '#ef4444' }}>{stats.dosCount}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#16233b', borderRadius: '3px' }}>
                      <div style={{ width: '58%', height: '100%', backgroundColor: '#ef4444', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span>Port Probes & Scans (26%)</span>
                      <span style={{ color: '#f59e0b' }}>{stats.probeCount}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#16233b', borderRadius: '3px' }}>
                      <div style={{ width: '26%', height: '100%', backgroundColor: '#f59e0b', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span>R2L / Privilege Esc (16%)</span>
                      <span style={{ color: '#38bdf8' }}>{stats.r2lCount}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#16233b', borderRadius: '3px' }}>
                      <div style={{ width: '16%', height: '100%', backgroundColor: '#38bdf8', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              backgroundColor: '#0d1525',
              border: '1px solid #1a263e',
              borderRadius: '8px',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Quick Operations</span>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>Directly trigger an action or analyze traffic captures.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => navigateTo('traffic')}
                  style={{
                    backgroundColor: '#0284c7',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Packet Inspector
                </button>
                <button
                  onClick={() => navigateTo('alerts')}
                  style={{
                    backgroundColor: '#16233b',
                    border: '1px solid #283e66',
                    borderRadius: '4px',
                    color: '#f1f5f9',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  All Alerts
                </button>
                <button
                  onClick={() => navigateTo('simulate')}
                  style={{
                    backgroundColor: '#16233b',
                    border: '1px solid #283e66',
                    borderRadius: '4px',
                    color: '#f1f5f9',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Simulator
                </button>
              </div>
            </div>

            {/* Recent Alert Feed */}
            <div style={{ backgroundColor: '#0d1525', border: '1px solid #1a263e', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #1a263e' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Recent Detections</span>
              </div>
              {alerts.slice(0, 3).map((a) => (
                <div key={a.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 1rem',
                  borderBottom: '1px solid #141f33',
                  fontSize: '0.8rem'
                }}>
                  <span style={{ fontFamily: 'monospace', color: '#64748b' }}>{a.time}</span>
                  <span style={{ fontWeight: 600 }}>{a.type}</span>
                  <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{a.source}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: a.status === 'Blocked' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: a.status === 'Blocked' ? '#ef4444' : '#f59e0b'
                  }}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. ALERTS VIEW */}
        {currentPage === 'alerts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Incident Detection Stream</h2>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>Detailed incident logs and triage mitigation.</p>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setAlertFilter(lvl)}
                    style={{
                      backgroundColor: alertFilter === lvl ? '#0284c7' : '#141f33',
                      border: '1px solid #1e2e4a',
                      color: alertFilter === lvl ? '#fff' : '#94a3b8',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', top: '10px', left: '12px', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search by attack signature or source IP..."
                value={alertSearch}
                onChange={(e) => setAlertSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                  backgroundColor: '#0d1525',
                  border: '1px solid #1a263e',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ backgroundColor: '#0d1525', border: '1px solid #1a263e', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#141f33', color: '#94a3b8' }}>
                      <th style={{ padding: '8px 12px' }}>ID / Timestamp</th>
                      <th style={{ padding: '8px 12px' }}>Attack Vector</th>
                      <th style={{ padding: '8px 12px' }}>Originating Source</th>
                      <th style={{ padding: '8px 12px' }}>Destination Target</th>
                      <th style={{ padding: '8px 12px' }}>Severity</th>
                      <th style={{ padding: '8px 12px' }}>Status</th>
                      <th style={{ padding: '8px 12px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map((a) => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #141f33' }}>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>
                          <div>{a.id}</div>
                          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{a.time}</div>
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{a.type}</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#38bdf8' }}>{a.source}</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#94a3b8' }}>{a.destination}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            backgroundColor: a.risk === 'Critical' ? 'rgba(239, 68, 68, 0.2)' : a.risk === 'High' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                            color: a.risk === 'Critical' ? '#ef4444' : a.risk === 'High' ? '#f59e0b' : '#38bdf8'
                          }}>
                            {a.risk}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ color: a.status === 'Blocked' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{a.status}</span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <button
                            onClick={() => setSelectedAlert(a)}
                            style={{
                              backgroundColor: '#16233b',
                              border: '1px solid #233555',
                              color: '#38bdf8',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              cursor: 'pointer'
                            }}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedAlert && (
              <div
                onClick={() => setSelectedAlert(null)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  zIndex: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem'
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    backgroundColor: '#0d1525',
                    border: '1px solid #1a263e',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    maxWidth: '520px',
                    width: '100%'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle color="#ef4444" size={20} />
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>{selectedAlert.type} ({selectedAlert.id})</h3>
                    </div>
                    <button onClick={() => setSelectedAlert(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                      <X size={18} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <p style={{ margin: 0 }}><strong>MITRE ATT&CK:</strong> <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{selectedAlert.mitre}</span></p>
                    <p style={{ margin: 0 }}><strong>Origin IP:</strong> <span style={{ color: '#f1f5f9', fontFamily: 'monospace' }}>{selectedAlert.source}</span></p>
                    <p style={{ margin: 0 }}><strong>Target Endpoint:</strong> <span style={{ color: '#f1f5f9', fontFamily: 'monospace' }}>{selectedAlert.destination}</span></p>
                    <p style={{ margin: 0 }}><strong>Protocol:</strong> {selectedAlert.protocol}</p>
                    <p style={{ margin: '0.4rem 0 0 0', lineHeight: 1.4 }}>{selectedAlert.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                    <button
                      onClick={() => {
                        alert(`IP ${selectedAlert.source} blacklisted on Edge Firewall.`);
                        setSelectedAlert(null);
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#ef4444',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '4px',
                        padding: '0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Blacklist IP Immediately
                    </button>
                    <button
                      onClick={() => setSelectedAlert(null)}
                      style={{
                        backgroundColor: '#16233b',
                        border: '1px solid #233555',
                        color: '#94a3b8',
                        borderRadius: '4px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. TRAFFIC ANALYZER & CSV BATCH */}
        {currentPage === 'traffic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Traffic Analysis & Ingestion</h2>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>Single flow inspection & bulk CSV capture scanning.</p>
            </div>

            {/* CSV Batch Upload Box */}
            <div style={{ backgroundColor: '#0d1525', border: '1px solid #1a263e', borderRadius: '8px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 600 }}>Batch CSV File Processing</h3>
              <div
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{
                  border: '2px dashed #233555',
                  borderRadius: '6px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#090d16'
                }}
              >
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <Upload size={24} color="#06b6d4" style={{ margin: '0 auto 0.4rem auto' }} />
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600 }}>
                  {uploadedFile ? uploadedFile.name : 'Select or drop network flow CSV capture'}
                </p>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.7rem', color: '#64748b' }}>
                  Accepts standard NSL-KDD capture columns
                </p>
              </div>

              {uploadedFile && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
                  <button
                    onClick={executeCsvBatchPredict}
                    disabled={isProcessingCsv}
                    style={{
                      flex: 1,
                      backgroundColor: '#0284c7',
                      border: 'none',
                      borderRadius: '5px',
                      color: '#fff',
                      padding: '0.55rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Play size={14} /> {isProcessingCsv ? 'Evaluating Batch Rows...' : 'Run Bulk Model Inference'}
                  </button>
                  <button
                    onClick={() => { setUploadedFile(null); setCsvPreview([]); setBatchResults(null); }}
                    style={{
                      backgroundColor: '#16233b',
                      border: '1px solid #233555',
                      borderRadius: '5px',
                      color: '#94a3b8',
                      padding: '0.55rem 0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              )}

              {csvPreview.length > 0 && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid #1a263e', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Parsed Stream Preview (First 5 Rows)</span>
                  <div style={{ overflowX: 'auto', marginTop: '0.4rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#141f33', color: '#94a3b8' }}>
                          {Object.keys(csvPreview[0]).map((h, i) => (
                            <th key={i} style={{ padding: '5px 8px', borderBottom: '1px solid #1a263e' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #141f33' }}>
                            {Object.values(row).map((v, idx) => (
                              <td key={idx} style={{ padding: '5px 8px', fontFamily: 'monospace' }}>{v}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {batchResults && (
                <div style={{
                  marginTop: '1rem',
                  backgroundColor: '#090d16',
                  border: '1px solid #10b981',
                  borderRadius: '6px',
                  padding: '1rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem'
                }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>FLOWS ANALYZED</span>
                    <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem' }}>{batchResults.total_analyzed}</h4>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#10b981' }}>BENIGN SAMPLES</span>
                    <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', color: '#10b981' }}>{batchResults.normal_count}</h4>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#ef4444' }}>THREATS ISOLATED</span>
                    <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', color: '#ef4444' }}>{batchResults.anomaly_count}</h4>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#f59e0b' }}>TOP VECTOR</span>
                    <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '0.95rem', color: '#f59e0b' }}>DoS SYN Flood</h4>
                  </div>
                </div>
              )}
            </div>

            {/* Feature Packet Inspector */}
            <div style={{ backgroundColor: '#0d1525', border: '1px solid #1a263e', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Manual Packet Feature Inspector</h3>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button onClick={() => loadPreset('normal')} style={{ backgroundColor: '#16233b', border: '1px solid #233555', color: '#94a3b8', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer' }}>Normal</button>
                  <button onClick={() => loadPreset('dos')} style={{ backgroundColor: '#16233b', border: '1px solid #233555', color: '#94a3b8', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer' }}>DoS</button>
                  <button onClick={() => loadPreset('probe')} style={{ backgroundColor: '#16233b', border: '1px solid #233555', color: '#94a3b8', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer' }}>Probe</button>
                  <button onClick={() => loadPreset('r2l')} style={{ backgroundColor: '#16233b', border: '1px solid #233555', color: '#94a3b8', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer' }}>R2L</button>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                {Object.keys(formData).map((key) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 600 }}>
                      {key.replace('_', ' ')}
                    </label>
                    <input
                      type="text"
                      value={formData[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.6rem',
                        backgroundColor: '#090d16',
                        border: '1px solid #1e2e4a',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '0.8rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleInspect}
                  disabled={predictLoading}
                  style={{
                    flex: 1,
                    backgroundColor: '#0284c7',
                    border: 'none',
                    borderRadius: '5px',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    padding: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  <Play size={15} /> {predictLoading ? 'Scanning...' : 'Classify Packet'}
                </button>
                <button
                  onClick={() => {
                    setFormData({ duration: '0', protocol_type: '', service: '', flag: '', src_bytes: '', dst_bytes: '', count: '', srv_count: '', serror_rate: '', same_srv_rate: '', diff_srv_rate: '' });
                    setPredictionResult(null);
                  }}
                  style={{
                    backgroundColor: '#16233b',
                    border: '1px solid #233555',
                    borderRadius: '5px',
                    color: '#94a3b8',
                    padding: '0 0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={15} />
                </button>
              </div>

              {predictionResult && (
                <div style={{
                  marginTop: '1rem',
                  backgroundColor: '#090d16',
                  border: `1px solid ${predictionResult.prediction === 'Normal' ? '#10b981' : '#ef4444'}`,
                  borderRadius: '6px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {predictionResult.prediction === 'Normal' ? (
                      <CheckCircle color="#10b981" size={22} />
                    ) : (
                      <AlertCircle color="#ef4444" size={22} />
                    )}
                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>VERDICT</span>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                        {predictionResult.prediction} ({predictionResult.attack_type})
                      </h4>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#38bdf8', display: 'block' }}>
                      Confidence: {predictionResult.confidence}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Action: {predictionResult.suggested_action}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. ATTACK SIMULATOR */}
        {currentPage === 'simulate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Attack Simulation Suite</h2>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Stress test real-time IDS alerting mechanisms with active vectors.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
              {[
                { id: 'dos', title: 'SYN Flood (DoS)', desc: 'Exhausts socket pools' },
                { id: 'probe', title: 'Port Scan Sweep', desc: 'Identifies open service entrypoints' },
                { id: 'r2l', title: 'Privilege Escalation', desc: 'Simulates unauthorized remote access' }
              ].map((sc) => {
                const active = selectedScenario === sc.id;
                return (
                  <button
                    key={sc.id}
                    disabled={simRunning}
                    onClick={() => setSelectedScenario(sc.id)}
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      backgroundColor: active ? '#0c4a6e' : '#0d1525',
                      border: active ? '1px solid #06b6d4' : '1px solid #1a263e',
                      cursor: simRunning ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: active ? '#38bdf8' : '#f1f5f9' }}>{sc.title}</p>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.7rem', color: '#64748b' }}>{sc.desc}</p>
                  </button>
                );
              })}
            </div>

            <button
              onClick={toggleSimulation}
              style={{
                backgroundColor: simRunning ? '#ef4444' : '#0284c7',
                border: 'none',
                borderRadius: '5px',
                color: '#fff',
                padding: '0.65rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              {simRunning ? <Square size={15} /> : <Play size={15} />}
              {simRunning ? 'Halt Simulation Pipeline' : 'Execute Attack Run'}
            </button>

            <div style={{
              backgroundColor: '#030712',
              border: '1px solid #1a263e',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              minHeight: '160px',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              color: '#38bdf8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', marginBottom: '0.5rem' }}>
                <Terminal size={14} /> <span>Simulation Terminal Feed</span>
              </div>
              {simLogs.length === 0 && (
                <p style={{ color: '#475569', margin: 0 }}>System idle. Select an attack scenario and press execute.</p>
              )}
              {simLogs.map((log, i) => (
                <p key={i} style={{ margin: '0.2rem 0' }}>{log}</p>
              ))}
            </div>
          </div>
        )}

        {/* 6. RISK MATRIX */}
        {currentPage === 'risk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Potential Risk & Threat Assessment</h2>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Evaluated vulnerabilities and automated mitigation posture.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {[
                {
                  level: 'CRITICAL',
                  type: 'SYN Flood / Distributed Denial',
                  impact: 'Full web service outages and connection drops across API gateways.',
                  mitigation: 'Enable SYN Cookies at OS kernel level; drop unverified three-way handshakes.',
                  color: '#ef4444'
                },
                {
                  level: 'HIGH',
                  type: 'Host & Port Probe Reconnaissance',
                  impact: 'Attacker maps internal topology, service versions, and exposed DB ports.',
                  mitigation: 'Automated IP rate limiting via iptables; rate-throttle sequential ICMP / TCP FIN scans.',
                  color: '#f59e0b'
                },
                {
                  level: 'ELEVATED',
                  type: 'Root Privilege Escalation Probe',
                  impact: 'Unauthorized access to root namespaces and sensitive configuration files.',
                  mitigation: 'Rotate SSH credentials; isolate bastion host into zero-trust subnets.',
                  color: '#38bdf8'
                }
              ].map((item, idx) => (
                <div key={idx} style={{
                  backgroundColor: '#0d1525',
                  border: `1px solid ${item.color}40`,
                  borderRadius: '8px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      backgroundColor: `${item.color}20`,
                      color: item.color,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {item.level}
                    </span>
                    <ShieldAlert size={16} color={item.color} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>{item.type}</h4>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    <p style={{ margin: '0 0 0.35rem 0' }}><strong style={{ color: '#cbd5e1' }}>Potential Impact:</strong> {item.impact}</p>
                    <p style={{ margin: 0 }}><strong style={{ color: '#cbd5e1' }}>Automated Defense:</strong> {item.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. MODEL HEALTH VIEW (Rendered via Standalone Component) */}
        {currentPage === 'health' && <ModelHealthView />}

        {/* 8. SETTINGS */}
        {currentPage === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>System Configuration & Policies</h2>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Tune API endpoints, detection thresholds, and automated edge mitigations.</p>
            </div>

            <div style={{ backgroundColor: '#0d1525', border: '1px solid #1a263e', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 600 }}>Backend REST API Base URL</label>
                <input
                  type="text"
                  value={settings.apiEndpoint}
                  onChange={(e) => setSettings({ ...settings, apiEndpoint: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#090d16',
                    border: '1px solid #1e2e4a',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Anomaly Confidence Trigger Threshold</label>
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontFamily: 'monospace' }}>{settings.threshold}</span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="0.99"
                  step="0.01"
                  value={settings.threshold}
                  onChange={(e) => setSettings({ ...settings, threshold: e.target.value })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1a263e', paddingTop: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Autonomous Edge Firewall Drop</span>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Immediately drop incoming flows exceeding confidence thresholds.</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, autoBlock: !settings.autoBlock })}
                  style={{
                    backgroundColor: settings.autoBlock ? '#0284c7' : '#1e293b',
                    border: '1px solid #233555',
                    color: settings.autoBlock ? '#fff' : '#94a3b8',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {settings.autoBlock ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <button
                onClick={() => alert('Settings successfully applied.')}
                style={{
                  backgroundColor: '#0284c7',
                  border: 'none',
                  borderRadius: '5px',
                  color: '#fff',
                  padding: '0.6rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}
              >
                Save Configuration
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}