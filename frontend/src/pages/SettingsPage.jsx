import React, { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    apiEndpoint: 'http://localhost:5000/api',
    threshold: '0.75',
    autoBlock: true,
    packetCaptureRate: '1000'
  });

  return (
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
  );
}
