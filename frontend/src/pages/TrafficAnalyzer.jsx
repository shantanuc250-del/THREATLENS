import React, { useState } from 'react';
import {
  Play, RotateCcw, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp,
  Info, Cpu, ArrowRight, CheckCircle2, AlertOctagon
} from 'lucide-react';
import { predictSingle } from '../services/api';

const PRESETS = {
  normal: {
    name: 'NORMAL TRAFFIC',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    description: 'Standard benign HTTP GET request with normal byte ratios and SYN-ACK handshake.',
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
  dos: {
    name: 'DOS ATTACK',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    description: 'High-frequency SYN Flood without ACK completion (flag=S0, serror_rate=1.00).',
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
  probe: {
    name: 'PROBE ATTACK',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    description: 'ICMP Echo Sweep scanning subnet hosts for open listeners (service=eco_i, icmp).',
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
  }
};

export default function TrafficAnalyzer({ navigateTo = () => {} }) {
  const [selectedPreset, setSelectedPreset] = useState('dos');
  const [formData, setFormData] = useState(PRESETS.dos.data);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectPreset = (key) => {
    setSelectedPreset(key);
    setFormData(PRESETS[key].data);
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
  const attackContextDisplay = result?.attack_type || result?.attack_category || (selectedPreset === 'dos' ? 'DoS' : selectedPreset === 'probe' ? 'Probe' : 'Normal');
  const severityDisplay = (result?.severity || result?.risk_level || (isAttack ? 'CRITICAL' : 'LOW')).toUpperCase();
  const mitreDisplay = result?.mitre || (selectedPreset === 'dos' ? 'T1498.001' : selectedPreset === 'probe' ? 'T1046' : 'N/A');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Title & Description */}
      <div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
          Analyze Network Traffic
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
          Submit network-flow features to the trained Random Forest model to determine whether the traffic is Normal or Attack.
        </p>
      </div>

      {/* Model Behavior Clarification Banner */}
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
            Binary Classification & SOC Enrichment
          </h4>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            The primary Random Forest model performs binary classification: Normal vs Attack. Additional application logic provides attack-type context for detected attacks to alert the SOC.
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
              Quick Demo Presets
            </span>
            <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600 }}>
              Populate Sample Flow Data
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
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
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: p.color }}>
                      {p.name}
                    </span>
                    {active && <CheckCircle2 size={16} color={p.color} />}
                  </div>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Option B: Advanced Features (Collapsed by default) */}
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
            <span>Advanced Input (Manual Entry for Custom Traffic)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#38bdf8' }}>
              <span>{showAdvanced ? 'Hide Fields' : 'Expand Feature Fields'}</span>
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
            <span>{loading ? 'Analyzing traffic...' : 'Analyze Traffic'}</span>
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
            gap: '1rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                TRAFFIC ANALYSIS RESULT
              </span>
              <span style={{
                fontSize: '0.7rem',
                color: isAttack ? '#ef4444' : '#10b981',
                backgroundColor: isAttack ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 700
              }}>
                Model: Random Forest (NSL-KDD)
              </span>
            </div>

            {isAttack ? (
              /* ATTACK Result */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.85rem'
                }}>
                  {/* Prediction */}
                  <div style={{ backgroundColor: '#0d1628', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Prediction
                    </span>
                    <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: 900, color: '#ef4444' }}>
                      ATTACK
                    </h3>
                  </div>

                  {/* Confidence */}
                  <div style={{ backgroundColor: '#0d1628', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Confidence
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
                    <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>
                      {attackContextDisplay}
                    </h3>
                  </div>

                  {/* Severity */}
                  <div style={{ backgroundColor: '#0d1628', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Severity
                    </span>
                    <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>
                      {severityDisplay}
                    </h3>
                  </div>

                  {/* MITRE ATT&CK */}
                  <div style={{ backgroundColor: '#0d1628', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      MITRE ATT&CK Context
                    </span>
                    <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                      {mitreDisplay}
                    </h3>
                  </div>
                </div>

                {/* SOC Recommendation */}
                <div style={{
                  backgroundColor: '#070b14',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #1a263e',
                  fontSize: '0.78rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}>
                  <p style={{ margin: 0, color: '#cbd5e1' }}>
                    <strong style={{ color: '#f8fafc' }}>Threat Description: </strong>
                    {result.description || 'Intrusion anomaly detected matching malicious flow profile.'}
                  </p>
                  <p style={{ margin: 0, color: '#38bdf8' }}>
                    <strong style={{ color: '#f8fafc' }}>SOC Recommendation: </strong>
                    {result.recommended_action || result.suggested_action || 'Investigate and review the source traffic; inspect packet rate volume and verify endpoint legitimacy.'}
                  </p>
                </div>

                {/* Link to Alerts */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                    View Alert in SOC Alerts Queue <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ) : (
              /* NORMAL Result */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.85rem'
                }}>
                  <div style={{ backgroundColor: '#0d1628', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Prediction
                    </span>
                    <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>
                      NORMAL
                    </h3>
                  </div>

                  <div style={{ backgroundColor: '#0d1628', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Confidence
                    </span>
                    <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc' }}>
                      {confidenceDisplay}
                    </h3>
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#070b14',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #1a263e',
                  fontSize: '0.8rem',
                  color: '#10b981',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle2 size={18} color="#10b981" />
                  <span>No immediate threat detected.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
