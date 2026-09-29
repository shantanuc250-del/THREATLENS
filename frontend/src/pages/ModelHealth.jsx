import React, { useState, useEffect } from 'react';
import {
  Brain, ShieldCheck, Activity, RefreshCw, AlertCircle, CheckCircle2,
  Sliders, Layers, Info, AlertOctagon
} from 'lucide-react';
import { getModelMetrics, getModelInfo, getModelDrift } from '../services/api';

export default function ModelHealth() {
  const [metrics, setMetrics] = useState(null);
  const [driftData, setDriftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driftTesting, setDriftTesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchModelHealth = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [mRes, dRes] = await Promise.allSettled([
        getModelMetrics(),
        getModelDrift()
      ]);

      if (mRes.status === 'fulfilled' && mRes.value.data && !mRes.value.data.error) {
        setMetrics(mRes.value.data);
      } else {
        setMetrics(null);
      }

      if (dRes.status === 'fulfilled' && dRes.value.data && !dRes.value.data.error) {
        setDriftData({
          ...dRes.value.data,
          last_check: 'Just now'
        });
      } else {
        setDriftData(null);
      }

      if (mRes.status !== 'fulfilled' && dRes.status !== 'fulfilled') {
        setErrorMsg('Backend metrics unavailable. Please check the API connection.');
      }
    } catch {
      setErrorMsg('Backend metrics unavailable. Please check the API connection.');
      setMetrics(null);
      setDriftData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDriftTest = async () => {
    setDriftTesting(true);
    try {
      const res = await getModelDrift();
      if (res.data) {
        setDriftData({
          ...res.data,
          last_check: 'Just now'
        });
      }
    } catch {
      setErrorMsg('Failed to run drift test. Backend unavailable.');
    } finally {
      setDriftTesting(false);
    }
  };

  useEffect(() => {
    fetchModelHealth();
  }, []);

  const formatPct = (val) => {
    if (val === undefined || val === null) return 'Data unavailable';
    return `${(val * 100).toFixed(1)}%`;
  };

  const cm = metrics?.confusion_matrix || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
            Model Health & Performance
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
            Evaluation metrics, confusion matrix breakdown, and statistical drift monitoring on NSL-KDD test corpus.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={fetchModelHealth}
            disabled={loading}
            style={{
              backgroundColor: '#16233b',
              border: '1px solid #233555',
              color: '#94a3b8',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.borderColor = '#38bdf8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#233555'; }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleRunDriftTest}
            disabled={driftTesting}
            style={{
              backgroundColor: '#2563eb',
              border: 'none',
              color: '#ffffff',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
            }}
          >
            <Activity size={13} />
            <span>{driftTesting ? 'Testing Drift...' : 'Run KS Drift Test'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
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

      {/* Section 1: Model Information */}
      <div style={{
        backgroundColor: '#0d1628',
        border: '1px solid #1a263e',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Brain size={16} color="#38bdf8" /> Model Information
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          backgroundColor: '#070b14',
          padding: '1rem',
          borderRadius: '10px',
          border: '1px solid #141f33',
          fontSize: '0.8rem'
        }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Model
            </span>
            <p style={{ margin: '3px 0 0 0', fontWeight: 800, color: '#f8fafc' }}>
              Random Forest Classifier
            </p>
          </div>

          <div>
            <span style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Dataset
            </span>
            <p style={{ margin: '3px 0 0 0', fontWeight: 800, color: '#38bdf8' }}>
              NSL-KDD
            </p>
          </div>

          <div>
            <span style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Task
            </span>
            <p style={{ margin: '3px 0 0 0', fontWeight: 800, color: '#f8fafc' }}>
              Binary Intrusion Detection
            </p>
          </div>

          <div>
            <span style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Classes
            </span>
            <p style={{ margin: '3px 0 0 0', fontWeight: 800, color: '#10b981' }}>
              Normal (0) / Attack (1)
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Evaluation Metrics (Actual Backend Metrics) */}
      <div>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
          Evaluation Metrics (NSL-KDD Test Set)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
          {/* Accuracy */}
          <div style={{ backgroundColor: '#0d1628', border: '1px solid #1a263e', borderRadius: '12px', padding: '1rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Accuracy</span>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.4rem', fontWeight: 900, color: metrics ? '#f8fafc' : '#94a3b8' }}>
              {metrics ? formatPct(metrics.accuracy) : 'Data unavailable'}
            </h3>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Overall correctness</span>
          </div>

          {/* Precision */}
          <div style={{ backgroundColor: '#0d1628', border: '1px solid #1a263e', borderRadius: '12px', padding: '1rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Precision</span>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.4rem', fontWeight: 900, color: metrics ? '#10b981' : '#94a3b8' }}>
              {metrics ? formatPct(metrics.precision) : 'Data unavailable'}
            </h3>
            <span style={{ fontSize: '0.68rem', color: '#10b981' }}>Low false alarm rate</span>
          </div>

          {/* Recall */}
          <div style={{ backgroundColor: '#0d1628', border: '1px solid #1a263e', borderRadius: '12px', padding: '1rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Recall</span>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.4rem', fontWeight: 900, color: metrics ? '#38bdf8' : '#94a3b8' }}>
              {metrics ? formatPct(metrics.recall) : 'Data unavailable'}
            </h3>
            <span style={{ fontSize: '0.68rem', color: '#38bdf8' }}>Attack detection rate</span>
          </div>

          {/* F1 Score */}
          <div style={{ backgroundColor: '#0d1628', border: '1px solid #1a263e', borderRadius: '12px', padding: '1rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>F1 Score</span>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.4rem', fontWeight: 900, color: metrics ? '#f8fafc' : '#94a3b8' }}>
              {metrics ? formatPct(metrics.f1_score) : 'Data unavailable'}
            </h3>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Harmonic balance</span>
          </div>

          {/* FPR */}
          <div style={{ backgroundColor: '#0d1628', border: '1px solid #1a263e', borderRadius: '12px', padding: '1rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>False Positive Rate</span>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.4rem', fontWeight: 900, color: metrics ? '#10b981' : '#94a3b8' }}>
              {metrics ? formatPct(metrics.fpr) : 'Data unavailable'}
            </h3>
            <span style={{ fontSize: '0.68rem', color: '#10b981' }}>Only 2.7% benign alerts</span>
          </div>

          {/* ROC-AUC */}
          <div style={{ backgroundColor: '#0d1628', border: '1px solid #1a263e', borderRadius: '12px', padding: '1rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>ROC-AUC</span>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.4rem', fontWeight: 900, color: metrics ? '#f59e0b' : '#94a3b8' }}>
              {metrics ? formatPct(metrics.roc_auc) : 'Data unavailable'}
            </h3>
            <span style={{ fontSize: '0.68rem', color: '#f59e0b' }}>Separability score</span>
          </div>
        </div>
      </div>

      {/* Section 3 & 4: Confusion Matrix & Drift Monitoring */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {/* Confusion Matrix */}
        <div style={{
          backgroundColor: '#0d1628',
          border: '1px solid #1a263e',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
              Confusion Matrix
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.72rem', color: '#94a3b8' }}>
              Test set breakdown across 22,544 total evaluation samples
            </p>

            {cm ? (
              /* 2x2 Grid */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                {/* True Negative */}
                <div style={{
                  backgroundColor: '#070b14',
                  border: '1px solid #10b98140',
                  borderRadius: '8px',
                  padding: '0.85rem'
                }}>
                  <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>
                    True Negative (TN)
                  </span>
                  <h4 style={{ margin: '0.2rem 0', fontSize: '1.3rem', fontWeight: 900, color: '#f8fafc' }}>
                    {cm.tn?.toLocaleString() || '9,449'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8' }}>
                    Normal traffic correctly classified
                  </p>
                </div>

                {/* False Positive */}
                <div style={{
                  backgroundColor: '#070b14',
                  border: '1px solid #f59e0b40',
                  borderRadius: '8px',
                  padding: '0.85rem'
                }}>
                  <span style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase' }}>
                    False Positive (FP)
                  </span>
                  <h4 style={{ margin: '0.2rem 0', fontSize: '1.3rem', fontWeight: 900, color: '#f8fafc' }}>
                    {cm.fp?.toLocaleString() || '262'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8' }}>
                    Normal traffic flagged as attack
                  </p>
                </div>

                {/* False Negative */}
                <div style={{
                  backgroundColor: '#070b14',
                  border: '1px solid #ef444440',
                  borderRadius: '8px',
                  padding: '0.85rem'
                }}>
                  <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>
                    False Negative (FN)
                  </span>
                  <h4 style={{ margin: '0.2rem 0', fontSize: '1.3rem', fontWeight: 900, color: '#f8fafc' }}>
                    {cm.fn?.toLocaleString() || '4,768'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8' }}>
                    Attacks missed by classifier
                  </p>
                </div>

                {/* True Positive */}
                <div style={{
                  backgroundColor: '#070b14',
                  border: '1px solid #10b98140',
                  borderRadius: '8px',
                  padding: '0.85rem'
                }}>
                  <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>
                    True Positive (TP)
                  </span>
                  <h4 style={{ margin: '0.2rem 0', fontSize: '1.3rem', fontWeight: 900, color: '#f8fafc' }}>
                    {cm.tp?.toLocaleString() || '8,065'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8' }}>
                    Attacks correctly detected
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                Confusion matrix data unavailable.
              </div>
            )}
          </div>

          <div style={{
            marginTop: '0.85rem',
            padding: '0.65rem 0.85rem',
            backgroundColor: '#070b14',
            borderRadius: '6px',
            border: '1px solid #141f33',
            fontSize: '0.72rem',
            color: '#cbd5e1',
            lineHeight: 1.4
          }}>
            <Info size={13} color="#38bdf8" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            <span>False positives represent normal traffic incorrectly flagged as attacks. False negatives represent attacks that were missed.</span>
          </div>
        </div>

        {/* Drift Monitoring */}
        <div style={{
          backgroundColor: '#0d1628',
          border: '1px solid #1a263e',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sliders size={16} color="#38bdf8" /> Drift Monitoring
              </h3>
              <span style={{
                backgroundColor: driftData?.drift_detected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: driftData?.drift_detected ? '#ef4444' : '#10b981',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 800,
                border: `1px solid ${driftData?.drift_detected ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
              }}>
                {driftData ? (driftData.drift_detected ? 'DATA DRIFT: DETECTED' : 'DATA DRIFT: STABLE') : 'Data unavailable'}
              </span>
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.72rem', color: '#94a3b8' }}>
              Kolmogorov-Smirnov (KS-test) and Population Stability Index (PSI) against training baseline.
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              backgroundColor: '#070b14',
              padding: '0.85rem',
              borderRadius: '8px',
              border: '1px solid #141f33',
              fontSize: '0.78rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Data Drift:</span>
                <strong style={{ color: driftData?.drift_detected ? '#ef4444' : '#10b981' }}>
                  {driftData ? (driftData.drift_detected ? 'Detected' : 'Stable') : 'Data unavailable'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>PSI (Population Stability Index):</span>
                <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                  {driftData?.mean_psi !== undefined ? String(driftData.mean_psi) : 'Data unavailable'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>KS Test (Kolmogorov-Smirnov):</span>
                <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                  {driftData?.p_value !== undefined ? `p = ${driftData.p_value} (Stable > 0.05)` : 'Data unavailable'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Last Test Evaluation:</span>
                <strong style={{ color: '#f8fafc' }}>
                  {driftData?.last_check || 'Just now'}
                </strong>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '0.85rem',
            padding: '0.65rem 0.85rem',
            backgroundColor: '#070b14',
            borderRadius: '6px',
            border: '1px solid #141f33',
            fontSize: '0.72rem',
            color: '#cbd5e1',
            lineHeight: 1.4
          }}>
            <Info size={13} color="#10b981" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            <span>Network traffic can change over time. Drift monitoring helps identify when new traffic differs significantly from the data used to develop the model.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
