import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function AlertDetailModal({ alert, onClose }) {
  if (!alert) return null;

  return (
    <div
      onClick={onClose}
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
            <h3 style={{ margin: 0, fontSize: '1rem' }}>{alert.type} ({alert.id})</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          <p style={{ margin: 0 }}><strong>MITRE ATT&CK:</strong> <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{alert.mitre}</span></p>
          <p style={{ margin: 0 }}><strong>Origin IP:</strong> <span style={{ color: '#f1f5f9', fontFamily: 'monospace' }}>{alert.source}</span></p>
          <p style={{ margin: 0 }}><strong>Target Endpoint:</strong> <span style={{ color: '#f1f5f9', fontFamily: 'monospace' }}>{alert.destination}</span></p>
          <p style={{ margin: 0 }}><strong>Protocol:</strong> {alert.protocol}</p>
          <p style={{ margin: '0.4rem 0 0 0', lineHeight: 1.4 }}>{alert.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button
            onClick={() => {
              window.alert(`IP ${alert.source} blacklisted on Edge Firewall.`);
              onClose();
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
            onClick={onClose}
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
  );
}
