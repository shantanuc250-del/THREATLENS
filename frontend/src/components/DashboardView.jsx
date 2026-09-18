import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, ShieldCheck, Zap, ArrowUpRight } from 'lucide-react';
import axios from 'axios';

export default function DashboardView({ onNavigate }) {
  const [stats, setStats] = useState({
    totalTraffic: '124,890',
    threatsBlocked: '412',
    networkHealth: '99.4%',
    activeSimulations: '2'
  });

  const [alerts, setAlerts] = useState([
    { id: 'AL-102', time: '10:42:15', type: 'DDoS SYN Flood', source: '192.168.1.104', status: 'Blocked' },
    { id: 'AL-101', time: '10:39:02', type: 'Port Scan (Recon)', source: '10.0.0.45', status: 'Flagged' },
    { id: 'AL-100', time: '10:21:44', type: 'SSH Brute Force', source: '172.16.0.88', status: 'Blocked' },
  ]);

  useEffect(() => {
    axios.get('/api/dashboard').then(res => {
      if (res.data) setStats(res.data);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Scanned Packets', value: stats.totalTraffic, icon: Activity, color: 'var(--accent-cyan)' },
          { label: 'Threats Neutralized', value: stats.threatsBlocked, icon: AlertTriangle, color: 'var(--status-alert)' },
          { label: 'Health Score', value: stats.networkHealth, icon: ShieldCheck, color: 'var(--status-normal)' },
          { label: 'Active Sims', value: stats.activeSimulations, icon: Zap, color: 'var(--status-warn)' },
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{m.label}</p>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.2rem' }}>{m.value}</h3>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                <Icon size={22} color={m.color} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Prompt */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Inspect Network Payload</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Analyze packet attributes or simulate ingress traffic.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => onNavigate('predict')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--accent-blue)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            Packet Inspector <ArrowUpRight size={14} />
          </button>
          <button
            onClick={() => onNavigate('simulate')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 500
            }}
          >
            Launch Sim
          </button>
        </div>
      </div>

      {/* Recent Alerts Feed */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Active Detections</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {alerts.map(item => (
            <div key={item.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1.25rem',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              fontSize: '0.82rem'
            }}>
              <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)' }}>{item.time}</span>
              <span style={{ fontWeight: 600 }}>{item.type}</span>
              <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent-cyan)' }}>{item.source}</span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                backgroundColor: item.status === 'Blocked' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                color: item.status === 'Blocked' ? 'var(--status-alert)' : 'var(--status-warn)'
              }}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}