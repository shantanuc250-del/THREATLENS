import React from 'react';
import {
  Activity, AlertTriangle, ShieldCheck, Zap, RefreshCw
} from 'lucide-react';

export default function Dashboard({ stats, setStats, alerts, navigateTo }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Security Operations Monitor</h2>
        <button
          onClick={() => setStats((prev) => ({ ...prev, totalTraffic: (parseInt(prev.totalTraffic.replace(',', ''), 10) + 24).toLocaleString() }))}
          style={{
            backgroundColor: '#16233b',
            border: '1px solid #233555',
            color: '#94a3b8',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={12} /> Sync Feed
        </button>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
        {[
          { label: 'Ingress Packets', val: stats.totalTraffic, icon: Activity, color: '#06b6d4' },
          { label: 'Attacks Blocked', val: stats.threatsBlocked, icon: AlertTriangle, color: '#ef4444' },
          { label: 'Network Health', val: stats.networkHealth, icon: ShieldCheck, color: '#10b981' },
          { label: 'Simulations Active', val: stats.activeSims, icon: Zap, color: '#f59e0b' }
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} style={{
              backgroundColor: '#0d1525',
              border: '1px solid #1a263e',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{m.label}</p>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.35rem', fontWeight: 700 }}>{m.val}</h3>
              </div>
              <Icon size={20} color={m.color} />
            </div>
          );
        })}
      </div>

      {/* Graphs Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#0d1525', border: '1px solid #1a263e', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Real-Time Throughput</span>
            <span style={{ fontSize: '0.7rem', color: '#10b981' }}>Live 60s Stream</span>
          </div>
          <svg viewBox="0 0 300 80" style={{ width: '100%', height: '80px', overflow: 'visible' }}>
            <defs>
              <linearGradient id="curveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d="M0,60 Q40,30 80,45 T160,20 T240,40 T300,10 L300,80 L0,80 Z" fill="url(#curveGrad)" />
            <path d="M0,60 Q40,30 80,45 T160,20 T240,40 T300,10" fill="none" stroke="#06b6d4" strokeWidth="2.5" />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem' }}>
            <span>T-60s</span>
            <span>T-30s</span>
            <span>Current</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#0d1525', border: '1px solid #1a263e', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Attack Class Distribution</span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>389 Attacks Neutralized</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>DoS / SYN Floods (58%)</span>
                <span style={{ color: '#ef4444' }}>{stats.dosCount}</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#16233b', borderRadius: '3px' }}>
                <div style={{ width: '58%', height: '100%', backgroundColor: '#ef4444', borderRadius: '3px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Port Probes & Scans (26%)</span>
                <span style={{ color: '#f59e0b' }}>{stats.probeCount}</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#16233b', borderRadius: '3px' }}>
                <div style={{ width: '26%', height: '100%', backgroundColor: '#f59e0b', borderRadius: '3px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>R2L / Privilege Esc (16%)</span>
                <span style={{ color: '#38bdf8' }}>{stats.r2lCount}</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#16233b', borderRadius: '3px' }}>
                <div style={{ width: '16%', height: '100%', backgroundColor: '#38bdf8', borderRadius: '3px' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: '#0d1525',
        border: '1px solid #1a263e',
        borderRadius: '8px',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Quick Operations</span>
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>Directly trigger an action or analyze traffic captures.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => navigateTo('traffic')}
            style={{
              backgroundColor: '#0284c7',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              padding: '0.45rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Packet Inspector
          </button>
          <button
            onClick={() => navigateTo('alerts')}
            style={{
              backgroundColor: '#16233b',
              border: '1px solid #283e66',
              borderRadius: '4px',
              color: '#f1f5f9',
              padding: '0.45rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            All Alerts
          </button>
          <button
            onClick={() => navigateTo('simulate')}
            style={{
              backgroundColor: '#16233b',
              border: '1px solid #283e66',
              borderRadius: '4px',
              color: '#f1f5f9',
              padding: '0.45rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Simulator
          </button>
        </div>
      </div>

      {/* Recent Alert Feed */}
      <div style={{ backgroundColor: '#0d1525', border: '1px solid #1a263e', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #1a263e' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Recent Detections</span>
        </div>
        {alerts.slice(0, 3).map((a) => (
          <div key={a.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 1rem',
            borderBottom: '1px solid #141f33',
            fontSize: '0.8rem'
          }}>
            <span style={{ fontFamily: 'monospace', color: '#64748b' }}>{a.time}</span>
            <span style={{ fontWeight: 600 }}>{a.type}</span>
            <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{a.source}</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 700,
              backgroundColor: a.status === 'Blocked' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: a.status === 'Blocked' ? '#ef4444' : '#f59e0b'
            }}>
              {a.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
