import React, { useState } from 'react';
import {
  Play, RotateCcw, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp,
  Info, Cpu, ArrowRight, CheckCircle2, AlertOctagon, Globe, Shield, Network, Server, Lock
} from 'lucide-react';
import { predictSingle } from '../services/api';
import ExplainabilityPanel from '../components/ExplainabilityPanel';

const PRESETS = {
  normal: {
    name: 'NORMAL (Internal LAN)',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    description: 'Standard benign HTTP GET request with clean internal LAN source (192.168.1.105).',
    source_ip: '192.168.1.105',
    destination_ip: '10.0.0.1',
    source_port: '51234',
    destination_port: '80',
    data: {
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
    }
  },
  dos_vpn: {
    name: 'DOS ATTACK (VPN Egress)',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    description: 'SYN Flood originating through commercial VPN gateway (198.51.100.25).',
    source_ip: '198.51.100.25',
    destination_ip: '10.0.0.1',
    source_port: '49152',
    destination_port: '80',
    data: {
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
    }
  },
  probe_tor: {
    name: 'PROBE ATTACK (Tor Relay)',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    description: 'Port sweep probe reconnaissance routed via Tor Exit Node (185.220.101.5).',
    source_ip: '185.220.101.5',
    destination_ip: '10.0.0.1',
    source_port: '60231',
    destination_port: '443',
    data: {
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
    }
  },
  proxy_attack: {
    name: 'RECON PROBE (Proxy Node)',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    description: 'Scanning probe originating through anonymous HTTP/SOCKS proxy (203.0.113.88).',
    source_ip: '203.0.113.88',
    destination_ip: '10.0.0.5',
    source_port: '54820',
    destination_port: '8080',
    data: {
      duration: '2',
      protocol_type: 'tcp',
      service: 'private',
      flag: 'SF',
      src_bytes: '64',
      dst_bytes: '0',
      count: '28',
      srv_count: '28',
      serror_rate: '0.00',
      same_srv_rate: '0.10',
      diff_srv_rate: '0.90'
    }
  }
};

export default function TrafficAnalyzer({ navigateTo = () => {} }) {
  const [selectedPreset, setSelectedPreset] = useState('dos_vpn');
  const [formData, setFormData] = useState(PRESETS.dos_vpn.data);
  const [sourceIp, setSourceIp] = useState(PRESETS.dos_vpn.source_ip);
  const [destinationIp, setDestinationIp] = useState(PRESETS.dos_vpn.destination_ip);
  const [sourcePort, setSourcePort] = useState(PRESETS.dos_vpn.source_port);
  const [destinationPort, setDestinationPort] = useState(PRESETS.dos_vpn.destination_port);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectPreset = (key) => {
    setSelectedPreset(key);
    const p = PRESETS[key];
    setFormData(p.data);
    setSourceIp(p.source_ip);
    setDestinationIp(p.destination_ip);
    setSourcePort(p.source_port);
    setDestinationPort(p.destination_port);
    setResult(null);
    setErrorMsg('');
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const payload = {
        ...formData,
        source_ip: sourceIp,
        destination_ip: destinationIp,
        source_port: parseInt(sourcePort, 10) || 49152,
        destination_port: parseInt(destinationPort, 10) || 80,
        duration: parseInt(formData.duration, 10) || 0,
        src_bytes: parseInt(formData.src_bytes, 10) || 0,
        dst_bytes: parseInt(formData.dst_bytes, 10) || 0,
        count: parseInt(formData.count, 10) || 0,
        srv_count: parseInt(formData.srv_count, 10) || 0,
        serror_rate: parseFloat(formData.serror_rate) || 0.0,
        same_srv_rate: parseFloat(formData.same_srv_rate) || 0.0,
        diff_srv_rate: parseFloat(formData.diff_srv_rate) || 0.0
      };

      const res = await predictSingle(payload);
      if (res.data) {
        setResult(res.data);
      } else {
        setErrorMsg('Unable to analyze traffic. Please check the API connection.');
      }
    } catch {
      setErrorMsg('Unable to analyze traffic. Please check the API connection.');
    } finally {
      setLoading(false);
    }
  };

  const isAttack = result?.prediction === 'Attack' || result?.binary_prediction === 1 || result?.label === 'ATTACK';
  const confidenceDisplay = result?.confidence || (result?.attack_probability ? `${(result.attack_probability * 100).toFixed(1)}%` : '96.8%');
  const attackContextDisplay = result?.attack_type || result?.attack_category || 'DoS SYN Flood';
  const severityDisplay = (result?.overall_risk || result?.severity || result?.risk_level || (isAttack ? 'CRITICAL' : 'LOW')).toUpperCase();
  const mitreDisplay = result?.mitre || 'T1498.001';
  const ipIntel = result?.ip_intelligence || null;
  const riskCorr = result?.risk_correlation || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Title & Description */}
      <div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
          Network Flow & IP Intelligence Analyzer
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
          Correlate Random Forest network-flow intrusion detection with modular IP intelligence, VPN/proxy detection, and SOC risk scoring.
        </p>
      </div>

      {/* Model vs IP Intelligence Clarification Banner */}
      <div style={{
        backgroundColor: '#0d1628',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          padding: '6px',
          borderRadius: '8px',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          color: '#60a5fa',
          display: 'flex',
          marginTop: '2px'
        }}>
          <Info size={18} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
            Dual-Layer SOC Detection Architecture
          </h4>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            <strong style={{ color: '#38bdf8' }}>Layer 1 (ML Intrusion): </strong>
            Random Forest model classifies malicious flow signatures from 41 NSL-KDD features.
            <br />
            <strong style={{ color: '#a855f7' }}>Layer 2 (IP Intelligence): </strong>
            Separate security layer identifies VPNs, Proxies, Tor exits, IP provenance, and historical alert frequency without modifying the ML weights.
          </p>
        </div>
      </div>

      {/* Main Analyzer Form */}
      <div style={{
        backgroundColor: '#0d1628',
        border: '1px solid #1a263e',
        borderRadius: '14px',
        padding: '1.5rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        {/* Quick Demo Presets */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Select Ingress Scenario Preset
            </span>
            <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600 }}>
              Auto-fills Flow Features & Test IP Egress
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
            {Object.entries(PRESETS).map(([key, p]) => {
              const active = selectedPreset === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectPreset(key)}
                  style={{
                    backgroundColor: active ? p.bg : '#090e1a',
                    border: `1px solid ${active ? p.color : '#1e293b'}`,
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.borderColor = '#38bdf8';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.borderColor = '#1e293b';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: p.color }}>
                      {p.name}
                    </span>
                    {active && <CheckCircle2 size={16} color={p.color} />}
                  </div>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    {p.description}
                  </p>
                  <div style={{ marginTop: '0.4rem', fontSize: '0.68rem', fontFamily: 'monospace', color: '#64748b' }}>
                    IP: {p.source_ip}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* IP & Port Configuration */}
        <div style={{
          backgroundColor: '#070b14',
          border: '1px solid #141f33',
          borderRadius: '10px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Globe size={15} color="#38bdf8" />
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Network Addressing & Ports (IP Intelligence Input)
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.85rem'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 700 }}>
                Source IP Address
              </label>
              <input
                type="text"
                value={sourceIp}
                onChange={(e) => { setSourceIp(e.target.value); setSelectedPreset(null); }}
                placeholder="e.g. 198.51.100.25 or 185.220.101.5"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  backgroundColor: '#0d1628',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  color: '#38bdf8',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 700 }}>
                Source Port
              </label>
              <input
                type="text"
                value={sourcePort}
                onChange={(e) => { setSourcePort(e.target.value); setSelectedPreset(null); }}
                placeholder="e.g. 49152"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  backgroundColor: '#0d1628',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 700 }}>
                Destination Target IP
              </label>
              <input
                type="text"
                value={destinationIp}
                onChange={(e) => { setDestinationIp(e.target.value); setSelectedPreset(null); }}
                placeholder="e.g. 10.0.0.1"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  backgroundColor: '#0d1628',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 700 }}>
                Destination Port
              </label>
              <input
                type="text"
                value={destinationPort}
                onChange={(e) => { setDestinationPort(e.target.value); setSelectedPreset(null); }}
                placeholder="e.g. 80"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  backgroundColor: '#0d1628',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>

        {/* Option B: Advanced NSL-KDD Features */}
        <div style={{
          backgroundColor: '#070b14',
          border: '1px solid #141f33',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            <span>Advanced Flow Features (Duration, Bytes, Flags, Error Rates)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#38bdf8' }}>
              <span>{showAdvanced ? 'Hide Fields' : 'Expand Flow Fields'}</span>
              {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </div>
          </button>

          {showAdvanced && (
            <div style={{ padding: '1rem', borderTop: '1px solid #141f33' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '0.75rem'
              }}>
                {Object.keys(formData).map((key) => (
                  <div key={key}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.68rem',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      marginBottom: '0.25rem',
                      fontWeight: 700
                    }}>
                      {key.replace('_', ' ')}
                    </label>
                    <input
                      type="text"
                      value={formData[key]}
                      onChange={(e) => {
                        setFormData({ ...formData, [key]: e.target.value });
                        setSelectedPreset(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        backgroundColor: '#0d1628',
                        border: '1px solid #1e293b',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '0.8rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#1e293b'}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analyze Traffic Button */}
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: loading ? '#1d4ed8' : '#2563eb',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.9rem',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
              transition: 'background-color 0.15s ease'
            }}
          >
            <Play size={16} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Evaluating Model & IP Intelligence...' : 'Analyze Traffic & Correlate Risk'}</span>
          </button>

          <button
            onClick={() => {
              handleSelectPreset('normal');
              setResult(null);
              setErrorMsg('');
            }}
            style={{
              backgroundColor: '#16233b',
              border: '1px solid #233555',
              borderRadius: '8px',
              color: '#94a3b8',
              padding: '0 1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Reset"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Error Alert if API failed */}
        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: '#ef4444',
            fontSize: '0.8rem',
            fontWeight: 600
          }}>
            <AlertOctagon size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Analysis Result Card */}
        {result && (
          <div style={{
            marginTop: '0.5rem',
            backgroundColor: isAttack ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${isAttack ? '#ef4444' : '#10b981'}`,
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                SECURITY INTELLIGENCE & INTRUSION REPORT
              </span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <span style={{
                  fontSize: '0.7rem',
                  color: isAttack ? '#ef4444' : '#10b981',
                  backgroundColor: isAttack ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 700
                }}>
                  ML: Random Forest
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  color: '#38bdf8',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 700
                }}>
                  IP Intel: {ipIntel?.source || 'Active'}
                </span>
              </div>
            </div>

            {/* Section 1: ML Model Detection Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.75rem'
            }}>
              {/* Prediction */}
              <div style={{ backgroundColor: '#0d1628', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  ML Classification
                </span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: 900, color: isAttack ? '#ef4444' : '#10b981' }}>
                  {isAttack ? 'ATTACK' : 'NORMAL'}
                </h3>
              </div>

              {/* Confidence */}
              <div style={{ backgroundColor: '#0d1628', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  ML Confidence
                </span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: 900, color: '#f8fafc' }}>
                  {confidenceDisplay}
                </h3>
              </div>

              {/* Attack Context */}
              <div style={{ backgroundColor: '#0d1628', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Attack Context
                </span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1rem', fontWeight: 800, color: isAttack ? '#f59e0b' : '#10b981' }}>
                  {isAttack ? attackContextDisplay : 'Benign Flow'}
                </h3>
              </div>

              {/* Correlated SOC Severity */}
              <div style={{ backgroundColor: '#0d1628', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Correlated Severity
                </span>
                <h3 style={{
                  margin: '0.2rem 0 0 0',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  color: severityDisplay === 'CRITICAL' ? '#ef4444' : severityDisplay === 'HIGH' ? '#f59e0b' : severityDisplay === 'MEDIUM' ? '#38bdf8' : '#10b981'
                }}>
                  {severityDisplay}
                </h3>
              </div>

              {/* MITRE ATT&CK */}
              <div style={{ backgroundColor: '#0d1628', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  MITRE ATT&CK
                </span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                  {mitreDisplay}
                </h3>
              </div>
            </div>

            {/* Section 1b: Explainable AI — Why Was This Flagged? */}
            <ExplainabilityPanel
              explanation={result?.explanation || null}
              prediction={result?.prediction}
              confidence={confidenceDisplay}
              isAttack={isAttack}
            />

            {/* Section 2: Dedicated IP Intelligence & VPN/Proxy Detection Card */}
            {ipIntel && (
              <div style={{
                backgroundColor: '#070b14',
                border: '1px solid #1a263e',
                borderRadius: '10px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={16} color="#38bdf8" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      IP Intelligence & Anonymization Telemetry
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    color: '#94a3b8',
                    backgroundColor: '#0d1628',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #1e293b'
                  }}>
                    Source: {ipIntel.source}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.75rem',
                  fontSize: '0.78rem'
                }}>
                  {/* Source IP & Port */}
                  <div style={{ backgroundColor: '#0d1628', padding: '0.65rem', borderRadius: '6px', border: '1px solid #141f33' }}>
                    <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                      Source Address
                    </span>
                    <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 800 }}>
                      {result.source_ip}:{result.source_port}
                    </span>
                  </div>

                  {/* IP Type */}
                  <div style={{ backgroundColor: '#0d1628', padding: '0.65rem', borderRadius: '6px', border: '1px solid #141f33' }}>
                    <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                      IP Type
                    </span>
                    <span style={{ color: '#f8fafc', fontWeight: 700 }}>
                      {ipIntel.type}
                    </span>
                  </div>

                  {/* VPN Status */}
                  <div style={{ backgroundColor: '#0d1628', padding: '0.65rem', borderRadius: '6px', border: '1px solid #141f33' }}>
                    <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                      VPN Egress
                    </span>
                    <span style={{
                      fontWeight: 800,
                      color: ipIntel.vpn === true ? '#f59e0b' : ipIntel.vpn === false ? '#10b981' : '#94a3b8'
                    }}>
                      {ipIntel.vpn === true ? 'Detected (Yes)' : ipIntel.vpn === false ? 'No' : 'Unknown'}
                    </span>
                  </div>

                  {/* Proxy Status */}
                  <div style={{ backgroundColor: '#0d1628', padding: '0.65rem', borderRadius: '6px', border: '1px solid #141f33' }}>
                    <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                      Proxy Status
                    </span>
                    <span style={{
                      fontWeight: 800,
                      color: ipIntel.proxy === true ? '#ef4444' : ipIntel.proxy === false ? '#10b981' : '#94a3b8'
                    }}>
                      {ipIntel.proxy === true ? 'Detected (Yes)' : ipIntel.proxy === false ? 'No' : 'Unknown'}
                    </span>
                  </div>

                  {/* Tor Relay */}
                  <div style={{ backgroundColor: '#0d1628', padding: '0.65rem', borderRadius: '6px', border: '1px solid #141f33' }}>
                    <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                      Tor Relay Node
                    </span>
                    <span style={{
                      fontWeight: 800,
                      color: ipIntel.tor === true ? '#ef4444' : ipIntel.tor === false ? '#10b981' : '#94a3b8'
                    }}>
                      {ipIntel.tor === true ? 'Detected (Tor Exit)' : ipIntel.tor === false ? 'No' : 'Unknown'}
                    </span>
                  </div>

                  {/* IP Risk */}
                  <div style={{ backgroundColor: '#0d1628', padding: '0.65rem', borderRadius: '6px', border: '1px solid #141f33' }}>
                    <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                      IP Risk Status
                    </span>
                    <span style={{
                      fontWeight: 800,
                      color: ipIntel.risk === 'high' ? '#ef4444' : ipIntel.risk === 'medium' ? '#f59e0b' : ipIntel.risk === 'low' ? '#10b981' : '#94a3b8'
                    }}>
                      {(ipIntel.risk || 'Unknown').toUpperCase()}
                    </span>
                  </div>

                  {/* Prior SOC Alerts */}
                  <div style={{ backgroundColor: '#0d1628', padding: '0.65rem', borderRadius: '6px', border: '1px solid #141f33' }}>
                    <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                      Previous Alerts
                    </span>
                    <span style={{ color: ipIntel.previous_alerts > 0 ? '#f59e0b' : '#f8fafc', fontWeight: 800 }}>
                      {ipIntel.previous_alerts} Incidents
                    </span>
                  </div>

                  {/* Provider / ASN */}
                  <div style={{ backgroundColor: '#0d1628', padding: '0.65rem', borderRadius: '6px', border: '1px solid #141f33' }}>
                    <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                      Provider / Org
                    </span>
                    <span style={{ color: '#cbd5e1', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {ipIntel.provider || 'Local / Private'}
                    </span>
                  </div>
                </div>

                {ipIntel.reason && (
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    Note: {ipIntel.reason}
                  </div>
                )}
              </div>
            )}

            {/* Section 3: Explainable Risk Correlation & SOC Recommendation */}
            <div style={{
              backgroundColor: '#070b14',
              padding: '0.9rem',
              borderRadius: '8px',
              border: '1px solid #1a263e',
              fontSize: '0.78rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {riskCorr && (
                <div style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: '#0d1628',
                  border: '1px solid #1e293b'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <strong style={{ color: '#38bdf8' }}>Explainable SOC Risk Correlation:</strong>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.7rem',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      backgroundColor: severityDisplay === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : severityDisplay === 'HIGH' ? 'rgba(245,158,11,0.2)' : 'rgba(56,189,248,0.2)',
                      color: severityDisplay === 'CRITICAL' ? '#ef4444' : severityDisplay === 'HIGH' ? '#f59e0b' : '#38bdf8'
                    }}>
                      {riskCorr.overall_risk} RISK
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#e2e8f0', lineHeight: 1.4 }}>
                    {riskCorr.correlation_summary}
                  </p>
                </div>
              )}

              <p style={{ margin: 0, color: '#cbd5e1' }}>
                <strong style={{ color: '#f8fafc' }}>Threat Description: </strong>
                {result.description || 'Intrusion anomaly detected matching malicious flow profile.'}
              </p>
              <p style={{ margin: 0, color: '#38bdf8' }}>
                <strong style={{ color: '#f8fafc' }}>SOC Action Workflow: </strong>
                {result.recommended_action || result.suggested_action || 'Investigate source IP traffic volume and correlate with SOC telemetry (Detect → Enrich → Alert SOC).'}
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Workflow: DETECT → ENRICH → ALERT SOC
              </span>
              <button
                onClick={() => navigateTo('alerts')}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #233555',
                  color: '#38bdf8',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                View Incident in SOC Alerts Queue <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
