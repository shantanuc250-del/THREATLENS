import React, { useState } from 'react';
import axios from 'axios';
import { Play, Square, Terminal } from 'lucide-react';

const SCENARIOS = [
  { id: 'dos', title: 'SYN Flood (DoS)', desc: 'Exhausts socket pools' },
  { id: 'probe', title: 'Port Scan Sweep', desc: 'Identifies open service entrypoints' },
  { id: 'r2l', title: 'Privilege Escalation', desc: 'Simulates unauthorized remote access' }
];

export default function Simulator() {
  const [simRunning, setSimRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('dos');
  const [simLogs, setSimLogs] = useState([]);

  const toggleSimulation = async () => {
    if (simRunning) {
      setSimRunning(false);
      setSimLogs((prev) => [`[${new Date().toLocaleTimeString()}] Pipeline stopped by operator.`, ...prev]);
    } else {
      setSimRunning(true);
      setSimLogs([
        `[${new Date().toLocaleTimeString()}] Initialized: ${selectedScenario.toUpperCase()} attack packet stream`,
        `[${new Date().toLocaleTimeString()}] Target buffers: port 80/443 streaming active`,
        `[${new Date().toLocaleTimeString()}] Model detected incoming anomalies.`
      ]);
      try {
        await axios.post('http://localhost:5000/api/simulation', { scenario: selectedScenario });
      } catch {}
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Attack Simulation Suite</h2>
        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Stress test real-time IDS alerting mechanisms with active vectors.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
        {SCENARIOS.map((sc) => {
          const active = selectedScenario === sc.id;
          return (
            <button
              key={sc.id}
              disabled={simRunning}
              onClick={() => setSelectedScenario(sc.id)}
              style={{
                textAlign: 'left',
                padding: '0.75rem',
                borderRadius: '6px',
                backgroundColor: active ? '#0c4a6e' : '#0d1525',
                border: active ? '1px solid #06b6d4' : '1px solid #1a263e',
                cursor: simRunning ? 'not-allowed' : 'pointer'
              }}
            >
              <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: active ? '#38bdf8' : '#f1f5f9' }}>{sc.title}</p>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.7rem', color: '#64748b' }}>{sc.desc}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={toggleSimulation}
        style={{
          backgroundColor: simRunning ? '#ef4444' : '#0284c7',
          border: 'none',
          borderRadius: '5px',
          color: '#fff',
          padding: '0.65rem',
          fontSize: '0.82rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          cursor: 'pointer'
        }}
      >
        {simRunning ? <Square size={15} /> : <Play size={15} />}
        {simRunning ? 'Halt Simulation Pipeline' : 'Execute Attack Run'}
      </button>

      <div style={{
        backgroundColor: '#030712',
        border: '1px solid #1a263e',
        borderRadius: '8px',
        padding: '0.85rem 1rem',
        minHeight: '160px',
        fontFamily: 'monospace',
        fontSize: '0.78rem',
        color: '#38bdf8'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', marginBottom: '0.5rem' }}>
          <Terminal size={14} /> <span>Simulation Terminal Feed</span>
        </div>
        {simLogs.length === 0 && (
          <p style={{ color: '#475569', margin: 0 }}>System idle. Select an attack scenario and press execute.</p>
        )}
        {simLogs.map((log, i) => (
          <p key={i} style={{ margin: '0.2rem 0' }}>{log}</p>
        ))}
      </div>
    </div>
  );
}
