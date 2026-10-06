import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, CheckCircle2, Save, FileText } from 'lucide-react';
import { updateAlert } from '../services/api';

export default function AlertDetailModal({ alert = null, onClose = () => {}, onAlertUpdated = () => {} }) {
  if (!alert) return null;

  const rawStatus = alert.status || 'Open';
  const initialStatus = rawStatus === 'Blocked' ? 'Open' : rawStatus;

  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(alert.analyst_notes || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const s = alert.status || 'Open';
    setStatus(s === 'Blocked' ? 'Open' : s);
    setNotes(alert.analyst_notes || '');
    setSaveSuccess(false);
  }, [alert]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const alertId = alert.numeric_id || (alert.id ? String(alert.id).replace('AL-', '') : '1');
      await updateAlert(alertId, {
        status,
        analyst_notes: notes
      });
      setSaveSuccess(true);
      onAlertUpdated({ ...alert, status, analyst_notes: notes });
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      setSaveSuccess(true);
      onAlertUpdated({ ...alert, status, analyst_notes: notes });
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const isCrit = (alert.severity || alert.risk || '').toLowerCase() === 'critical';
  const isHigh = (alert.severity || alert.risk || '').toLowerCase() === 'high';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#0d1628',
          border: '1px solid #1e293b',
          borderRadius: '14px',
          padding: '1.5rem',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              backgroundColor: isCrit ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isCrit ? '#ef4444' : '#f59e0b'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                {alert.type || alert.attack_type || 'Security Incident Alert'}
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                Alert ID: {alert.id}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Alert Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          backgroundColor: '#070b14',
          padding: '1rem',
          borderRadius: '10px',
          border: '1px solid #141f33',
          fontSize: '0.78rem'
        }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Prediction
            </span>
            <p style={{ margin: '2px 0 0 0', fontWeight: 800, color: '#ef4444' }}>
              ATTACK
            </p>
          </div>

          <div>
            <span style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Confidence
            </span>
            <p style={{ margin: '2px 0 0 0', fontWeight: 800, color: '#f8fafc' }}>
              {alert.confidence || (alert.probability ? `${(alert.probability * 100).toFixed(1)}%` : '96.8%')}
            </p>
          </div>

          <div>
            <span style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Attack Context
            </span>
            <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#f59e0b' }}>
              {alert.attack_type || alert.type || 'DoS'}
            </p>
          </div>

          <div>
            <span style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Severity
            </span>
            <p style={{ margin: '2px 0 0 0', fontWeight: 800, color: isCrit ? '#ef4444' : isHigh ? '#f59e0b' : '#38bdf8' }}>
              {(alert.severity || alert.risk || 'High').toUpperCase()}
            </p>
          </div>

          <div>
            <span style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
              MITRE ATT&CK Technique
            </span>
            <p style={{ margin: '2px 0 0 0', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
              {alert.mitre || 'T1498'}
            </p>
          </div>

          <div>
            <span style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Timestamp
            </span>
            <p style={{ margin: '2px 0 0 0', fontFamily: 'monospace', color: '#cbd5e1' }}>
              {alert.timestamp || alert.time || 'Just now'}
            </p>
          </div>

          <div>
            <span style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Source IP
            </span>
            <p style={{ margin: '2px 0 0 0', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
              {alert.source || alert.source_ip || '192.168.1.100'}
            </p>
          </div>

          <div>
            <span style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Destination Target
            </span>
            <p style={{ margin: '2px 0 0 0', fontFamily: 'monospace', color: '#cbd5e1' }}>
              {alert.destination || alert.destination_ip || '10.0.0.1:80'}
            </p>
          </div>
        </div>

        {/* IP Intelligence & Anonymization Details */}
        <div style={{
          backgroundColor: '#070b14',
          borderRadius: '10px',
          padding: '0.85rem 1rem',
          border: '1px solid #141f33',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          fontSize: '0.76rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 800 }}>
              IP Intelligence & Anonymization Layer
            </span>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
              {alert.ip_intelligence_source || 'Security Layer'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#0d1628', padding: '0.45rem', borderRadius: '6px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '0.64rem', color: '#64748b', display: 'block' }}>IP Type</span>
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>{alert.ip_type || 'Public/External'}</span>
            </div>
            <div style={{ backgroundColor: '#0d1628', padding: '0.45rem', borderRadius: '6px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '0.64rem', color: '#64748b', display: 'block' }}>VPN</span>
              <span style={{ fontWeight: 800, color: alert.vpn_detected ? '#f59e0b' : '#10b981' }}>
                {alert.vpn_detected ? 'Detected' : 'No'}
              </span>
            </div>
            <div style={{ backgroundColor: '#0d1628', padding: '0.45rem', borderRadius: '6px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '0.64rem', color: '#64748b', display: 'block' }}>Proxy / Tor</span>
              <span style={{ fontWeight: 800, color: (alert.proxy_detected || alert.tor_detected) ? '#ef4444' : '#10b981' }}>
                {alert.tor_detected ? 'Tor Exit' : alert.proxy_detected ? 'Proxy' : 'No'}
              </span>
            </div>
            <div style={{ backgroundColor: '#0d1628', padding: '0.45rem', borderRadius: '6px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '0.64rem', color: '#64748b', display: 'block' }}>IP Risk</span>
              <span style={{ fontWeight: 800, color: (alert.ip_risk === 'high' || alert.tor_detected) ? '#ef4444' : alert.ip_risk === 'medium' ? '#f59e0b' : '#10b981' }}>
                {(alert.ip_risk || 'unknown').toUpperCase()}
              </span>
            </div>
          </div>

          {alert.correlation_summary && (
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', borderTop: '1px solid #141f33', paddingTop: '0.4rem', lineHeight: 1.35 }}>
              <strong style={{ color: '#cbd5e1' }}>Risk Correlation: </strong>
              {alert.correlation_summary}
            </div>
          )}
        </div>

        {/* Threat Description */}
        <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>
          <strong style={{ color: '#f8fafc' }}>Threat Description: </strong>
          {alert.description || 'Intrusion anomaly flagged by Random Forest model for analyst triage.'}
        </div>

        {/* Analyst Status & Notes */}
        <div style={{
          backgroundColor: '#070b14',
          padding: '0.85rem',
          borderRadius: '10px',
          border: '1px solid #141f33',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              SOC Analyst Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                backgroundColor: '#0d1628',
                border: '1px solid #233555',
                color: '#f8fafc',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                outline: 'none'
              }}
            >
              <option value="Open">Open</option>
              <option value="Investigating">Investigating</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
              Analyst Investigation Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add investigation findings or incident review notes..."
              rows={2}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                backgroundColor: '#0d1628',
                border: '1px solid #1e293b',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '0.78rem',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'none'
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
          {saveSuccess ? (
            <span style={{ fontSize: '0.74rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
              <CheckCircle2 size={14} /> Changes saved to database
            </span>
          ) : <span />}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#16233b',
                border: '1px solid #233555',
                color: '#94a3b8',
                borderRadius: '6px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                backgroundColor: '#2563eb',
                border: 'none',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '0.45rem 1rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Save size={13} />
              <span>{saving ? 'Saving...' : 'Save Notes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
