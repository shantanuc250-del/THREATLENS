import React, { useState } from 'react';
import themeColors from '../utils/themeColors';

export default function SettingsPage({ theme = 'dark' }) {
  const c = themeColors(theme);
  const [settings, setSettings] = useState({
    apiEndpoint: (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api',
    threshold: '0.75',
    autoBlock: true,
    packetCaptureRate: '1000'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: c.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>System Configuration & Policies</h2>
        <p style={{ fontSize: '0.78rem', color: c.textSecondary, margin: '0.2rem 0 0 0' }}>Tune API endpoints, detection thresholds, and automated edge mitigations.</p>
      </div>

      <div style={{
        backgroundColor: c.cardBg,
        border: `1px solid ${c.border}`,
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: c.shadowSm,
        transition: c.transition
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: c.textPrimary, marginBottom: '0.4rem', fontWeight: 700 }}>Backend REST API Base URL</label>
          <input
            type="text"
            value={settings.apiEndpoint}
            onChange={(e) => setSettings({ ...settings, apiEndpoint: e.target.value })}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              backgroundColor: c.inputBg,
              border: `1px solid ${c.border}`,
              borderRadius: '8px',
              color: c.textPrimary,
              fontSize: '0.82rem',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
            onBlur={(e) => e.currentTarget.style.borderColor = c.border}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.78rem', color: c.textPrimary, fontWeight: 700 }}>Anomaly Confidence Trigger Threshold</label>
            <span style={{ fontSize: '0.8rem', color: c.accentCyan, fontFamily: 'monospace', fontWeight: 800 }}>{settings.threshold}</span>
          </div>
          <input
            type="range"
            min="0.50"
            max="0.99"
            step="0.01"
            value={settings.threshold}
            onChange={(e) => setSettings({ ...settings, threshold: e.target.value })}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#2563eb' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${c.borderLight}`, paddingTop: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: c.textPrimary }}>Autonomous Edge Firewall Drop</span>
            <p style={{ margin: 0, fontSize: '0.72rem', color: c.textSecondary }}>Immediately drop incoming flows exceeding confidence thresholds.</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, autoBlock: !settings.autoBlock })}
            style={{
              backgroundColor: settings.autoBlock ? '#2563eb' : c.btnSecondaryBg,
              border: `1px solid ${settings.autoBlock ? '#3b82f6' : c.border}`,
              color: settings.autoBlock ? '#fff' : c.textSecondary,
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {settings.autoBlock ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        <button
          onClick={() => alert('Settings successfully applied.')}
          style={{
            backgroundColor: '#2563eb',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            padding: '0.65rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: '0.25rem',
            boxShadow: '0 4px 14px -3px rgba(37,99,235,0.4)',
            transition: 'filter 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}
