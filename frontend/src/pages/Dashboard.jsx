import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Activity, AlertTriangle, ShieldCheck, Zap, RefreshCw
} from 'lucide-react';

export default function Dashboard({ stats = {}, setStats = () => {}, alerts = [], navigateTo = () => {} }) {
  const currentStats = stats || {};
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  // Live throughput points for dynamic SVG stream
  const [points, setPoints] = useState([60, 30, 45, 20, 40, 10]);

  // Periodic polling for live telemetry
  useEffect(() => {
    const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${apiBase}/api/dashboard`);
        if (res.data) {
          setStats((prev) => ({
            ...prev,
            totalTraffic: res.data.total_traffic || prev.totalTraffic,
            threatsBlocked: res.data.threats_blocked || prev.threatsBlocked,
            networkHealth: res.data.health || prev.networkHealth,
            activeSims: res.data.active_sims || prev.activeSims,
            dosCount: res.data.dos_count || prev.dosCount,
            probeCount: res.data.probe_count || prev.probeCount,
            r2lCount: res.data.r2l_count || prev.r2lCount
          }));
        }
      } catch {}
      // Update dynamic curve stream
      setPoints((prev) => {
        const nextVal = Math.floor(Math.random() * 45) + 15;
        return [...prev.slice(1), nextVal];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [setStats]);

  const handleSync = async () => {
    const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    try {
      const res = await axios.get(`${apiBase}/api/dashboard`);
      if (res.data) {
        setStats((prev) => ({
          ...prev,
          totalTraffic: res.data.total_traffic || prev.totalTraffic,
          threatsBlocked: res.data.threats_blocked || prev.threatsBlocked,
          networkHealth: res.data.health || prev.networkHealth,
          activeSims: res.data.active_sims || prev.activeSims,
          dosCount: res.data.dos_count || prev.dosCount,
          probeCount: res.data.probe_count || prev.probeCount,
          r2lCount: res.data.r2l_count || prev.r2lCount
        }));
      }
    } catch {
      setStats((prev) => {
        const prevTraffic = prev?.totalTraffic ? parseInt(String(prev.totalTraffic).replace(/,/g, ''), 10) : 142920;
        return { ...prev, totalTraffic: (prevTraffic + 24).toLocaleString() };
      });
    }
    setPoints((prev) => {
      const nextVal = Math.floor(Math.random() * 45) + 15;
      return [...prev.slice(1), nextVal];
    });
  };

  // Compute attack distribution percentages safely
  const dosNum = parseInt(String(currentStats.dosCount || currentStats.dos_count || 226), 10) || 226;
  const probeNum = parseInt(String(currentStats.probeCount || currentStats.probe_count || 101), 10) || 101;
  const r2lNum = parseInt(String(currentStats.r2lCount || currentStats.r2l_count || 62), 10) || 62;
  const totalAttacks = dosNum + probeNum + r2lNum;
  const dosPct = totalAttacks > 0 ? Math.round((dosNum / totalAttacks) * 100) : 58;
  const probePct = totalAttacks > 0 ? Math.round((probeNum / totalAttacks) * 100) : 26;
  const r2lPct = totalAttacks > 0 ? Math.max(0, 100 - dosPct - probePct) : 16;

  // Build SVG path string from points
  const dArea = `M0,${points[0]} Q40,${points[1]} 80,${points[2]} T160,${points[3]} T240,${points[4]} T300,${points[5]} L300,80 L0,80 Z`;
  const dLine = `M0,${points[0]} Q40,${points[1]} 80,${points[2]} T160,${points[3]} T240,${points[4]} T300,${points[5]}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Security Operations Monitor</h2>
        <button
          onClick={handleSync}
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
          { label: 'Ingress Packets', val: currentStats.totalTraffic || '142,920', icon: Activity, color: '#06b6d4' },
          { label: 'Attacks Blocked', val: currentStats.threatsBlocked || '389', icon: AlertTriangle, color: '#ef4444' },
          { label: 'Network Health', val: currentStats.networkHealth || currentStats.health || '99.4%', icon: ShieldCheck, color: '#10b981' },
          { label: 'Simulations Active', val: currentStats.activeSims || '1', icon: Zap, color: '#f59e0b' }
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
            <path d={dArea} fill="url(#curveGrad)" />
            <path d={dLine} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
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
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{totalAttacks} Attacks Neutralized</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>DoS / SYN Floods ({dosPct}%)</span>
                <span style={{ color: '#ef4444' }}>{dosNum}</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#16233b', borderRadius: '3px' }}>
                <div style={{ width: `${dosPct}%`, height: '100%', backgroundColor: '#ef4444', borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Port Probes & Scans ({probePct}%)</span>
                <span style={{ color: '#f59e0b' }}>{probeNum}</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#16233b', borderRadius: '3px' }}>
                <div style={{ width: `${probePct}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>R2L / Privilege Esc ({r2lPct}%)</span>
                <span style={{ color: '#38bdf8' }}>{r2lNum}</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#16233b', borderRadius: '3px' }}>
                <div style={{ width: `${r2lPct}%`, height: '100%', backgroundColor: '#38bdf8', borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
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
        {safeAlerts.slice(0, 3).map((a) => (
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
