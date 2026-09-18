import React, { useState } from 'react';
import axios from 'axios';
import { Play, Square, Activity } from 'lucide-react';

export default function SimulationView() {
  const [running, setRunning] = useState(false);
  const [scenario, setScenario] = useState('ddos');
  const [logs, setLogs] = useState([]);

  const scenarios = [
    { id: 'ddos', name: 'SYN Flood', desc: 'Saturates TCP buffers' },
    { id: 'probe', name: 'Port Scan', desc: 'Sweeps ports 20-443' },
    { id: 'r2l', name: 'Unauthorized Access', desc: 'Simulates payload injection' }
  ];

  const handleToggle = async () => {
    if (running) {
      setRunning(false);
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] Simulation stopped by user.`, ...prev]);
    } else {
      setRunning(true);
      setLogs([`[${new Date().toLocaleTimeString()}] Injecting ${scenario.toUpperCase()} scenario packets...`]);
      try {
        await axios.post('/api/simulation', { scenario });
      } catch {}
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Attack Simulator</h2>

      {/* Scenario Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {scenarios.map(sc => (
          <button
            key={sc.id}
            onClick={() => !running && setScenario(sc.id)}
            style={{
              padding: '0.85rem',
              backgroundColor: scenario === sc.id ? 'rgba(6, 182, 212, 0.1)' : 'var(--bg-card)',
              border: `1px solid ${scenario === sc.id ? 'var(--accent-cyan)' : 'var(--border)'}`,
              borderRadius: '6px',
              textAlign: 'left'
            }}
          >
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: scenario === sc.id ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>{sc.name}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{sc.desc}</p>
          </button>
        ))}
      </div>

      {/* Controls */}
      <button
        onClick={handleToggle}
        style={{
          padding: '0.75rem',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: running ? 'var(--status-alert)' : 'var(--accent-blue)',
          color: '#fff',
          fontWeight: 600,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem'
        }}
      >
        {running ? <Square size={16} /> : <Play size={16} />}
        {running ? 'Stop Simulation' : 'Execute Attack Run'}
      </button>

      {/* Terminal Output */}
      <div style={{
        backgroundColor: '#070a0f',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '1rem',
        minHeight: '160px',
        fontFamily: 'JetBrains Mono',
        fontSize: '0.78rem',
        color: 'var(--accent-cyan)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          <Activity size={14} /> <span>Simulation Output Stream</span>
        </div>
        {logs.length === 0 && <p style={{ color: '#475569' }}>Awaiting trigger...</p>}
        {logs.map((log, i) => (
          <p key={i} style={{ margin: '0.2rem 0' }}>{log}</p>
        ))}
      </div>
    </div>
  );
}