import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import themeColors from '../utils/themeColors';

export default function AlertDetailModal({ alert = null, onClose = () => {}, theme = 'dark' }) {
  if (!alert) return null;
  const c = themeColors(theme);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-up"
        style={{
          backgroundColor: c.cardBg,
          border: `1px solid ${c.border}`,
          borderRadius: '16px',
          padding: '1.75rem',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              backgroundColor: c.dangerBgSoft, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <AlertTriangle color="#ef4444" size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: c.textPrimary }}>{alert.type} ({alert.id})</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: c.textMuted, cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem', color: c.textSecondary }}>
          <p style={{ margin: 0 }}><strong>MITRE ATT&CK:</strong> <span style={{ color: c.accentCyan, fontFamily: 'monospace', fontWeight: 700 }}>{alert.mitre}</span></p>
          <p style={{ margin: 0 }}><strong>Origin IP:</strong> <span style={{ color: c.textPrimary, fontFamily: 'monospace', fontWeight: 700 }}>{alert.source}</span></p>
          <p style={{ margin: 0 }}><strong>Target Endpoint:</strong> <span style={{ color: c.textPrimary, fontFamily: 'monospace', fontWeight: 700 }}>{alert.destination}</span></p>
          <p style={{ margin: 0 }}><strong>Protocol:</strong> <span style={{ color: c.textPrimary, fontWeight: 600 }}>{alert.protocol}</span></p>
          <p style={{ margin: '0.4rem 0 0 0', lineHeight: 1.5, color: c.textBody }}>{alert.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem' }}>
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
              borderRadius: '8px',
              padding: '0.65rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px -3px rgba(239,68,68,0.4)',
              transition: 'filter 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
          >
            Blacklist IP Immediately
          </button>
          <button
            onClick={onClose}
            style={{
              backgroundColor: c.btnSecondaryBg,
              border: `1px solid ${c.border}`,
              color: c.textSecondary,
              borderRadius: '8px',
              padding: '0.65rem 1.25rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = c.textPrimary; e.currentTarget.style.borderColor = c.borderStrong; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = c.textSecondary; e.currentTarget.style.borderColor = c.border; }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
