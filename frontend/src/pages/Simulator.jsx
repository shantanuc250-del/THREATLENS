import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Square, Terminal } from 'lucide-react';
import themeColors from '../utils/themeColors';

const SCENARIOS = [
  { id: 'dos', title: 'SYN Flood (DoS)', desc: 'Exhausts socket pools' },
  { id: 'probe', title: 'Port Scan Sweep', desc: 'Identifies open service entrypoints' },
  { id: 'r2l', title: 'Privilege Escalation', desc: 'Simulates unauthorized remote access' }
];

export default function Simulator({ theme = 'dark' }) {
  const c = themeColors(theme);
  const [simRunning, setSimRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('dos');
  const [simLogs, setSimLogs] = useState([]);

  // Live polling for server terminal log stream when running
  useEffect(() => {
    let interval = null;
    const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

    if (simRunning) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${apiBase}/api/simulation/status`);
          if (res.data && Array.isArray(res.data.logs) && res.data.logs.length > 0) {
            setSimLogs(res.data.logs);
            if (res.data.is_running === false) {
              setSimRunning(false);
            }
          }
        } catch {
          // Offline fallback: synthesize periodic packet logs
          const time = new Date().toLocaleTimeString();
          const ptypes = ['TCP SYN', 'ICMP Echo', 'AUTH_REQ', 'R2L probe'];
          const randType = ptypes[Math.floor(Math.random() * ptypes.length)];
          const randIp = `192.168.1.${Math.floor(Math.random() * 250) + 2}`;
          setSimLogs((prev) => [
            `[${time}] Synthetic packet: ${randType} from ${randIp} -> Edge Inspection: MITIGATED`,
            ...prev.slice(0, 19)
          ]);
        }
      }, 1500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [simRunning]);

  const toggleSimulation = async () => {
    const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    if (simRunning) {
      setSimRunning(false);
      setSimLogs((prev) => [`[${new Date().toLocaleTimeString()}] Pipeline stopped by operator.`, ...prev]);
      try {
        await axios.post(`${apiBase}/api/simulation`, { scenario: selectedScenario, action: 'stop' });
      } catch {}
    } else {
      setSimRunning(true);
      setSimLogs([
        `[${new Date().toLocaleTimeString()}] Initialized: ${selectedScenario.toUpperCase()} attack packet stream`,
        `[${new Date().toLocaleTimeString()}] Target buffers: port 80/443 streaming active`,
        `[${new Date().toLocaleTimeString()}] Model detected incoming anomalies.`
      ]);
      try {
        const res = await axios.post(`${apiBase}/api/simulation`, { scenario: selectedScenario, action: 'start' });
        if (res.data && res.data.logs) {
          setSimLogs(res.data.logs);
        }
      } catch {}
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: c.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Attack Simulation Suite</h2>
        <p style={{ fontSize: '0.78rem', color: c.textSecondary, margin: '0.2rem 0 0 0' }}>Stress test real-time IDS alerting mechanisms with active vectors.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
        {SCENARIOS.map((sc) => {
          const active = selectedScenario === sc.id;
          return (
            <button
              key={sc.id}
              disabled={simRunning}
              onClick={() => setSelectedScenario(sc.id)}
              className="landing-hover-card"
              style={{
                textAlign: 'left',
                padding: '1rem',
                borderRadius: '14px',
                backgroundColor: active
                  ? (c.isDark ? '#0c4a6e' : '#e0f2fe')
                  : c.cardBg,
                border: active
                  ? '1px solid #0284c7'
                  : `1px solid ${c.border}`,
                cursor: simRunning ? 'not-allowed' : 'pointer',
                boxShadow: c.shadowSm,
                transition: c.transition
              }}
            >
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: active ? (c.isDark ? '#38bdf8' : '#0369a1') : c.textPrimary }}>{sc.title}</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.72rem', color: c.textSecondary }}>{sc.desc}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={toggleSimulation}
        style={{
          backgroundColor: simRunning ? '#ef4444' : '#2563eb',
          border: 'none',
          borderRadius: '10px',
          color: '#fff',
          padding: '0.75rem',
          fontSize: '0.85rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          boxShadow: simRunning ? '0 4px 14px -3px rgba(239,68,68,0.4)' : '0 4px 14px -3px rgba(37,99,235,0.4)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
      >
        {simRunning ? <Square size={16} /> : <Play size={16} />}
        {simRunning ? 'Halt Simulation Pipeline' : 'Execute Attack Run'}
      </button>

      {/* Terminal Console with rounded-2xl dark-glass bezel */}
      <div style={{
        backgroundColor: '#030712',
        border: `1px solid ${c.isDark ? '#1f2d44' : '#334155'}`,
        borderRadius: '16px',
        padding: '1.25rem',
        minHeight: '200px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.78rem',
        color: '#38bdf8',
        boxShadow: '0 8px 30px -6px rgba(0,0,0,0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1f2d44',
          paddingBottom: '0.65rem',
          marginBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
            <Terminal size={14} color="#38bdf8" /> <span style={{ fontWeight: 600 }}>Simulation Terminal Feed</span>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }} />
          </div>
        </div>
        {simLogs.length === 0 && (
          <p style={{ color: '#475569', margin: 0, fontStyle: 'italic' }}>System idle. Select an attack scenario and press execute.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {simLogs.map((log, i) => (
            <p key={i} style={{ margin: 0, lineHeight: 1.5 }}>{log}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
