import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Activity, AlertTriangle, ShieldCheck, Zap, RefreshCw
} from 'lucide-react';
import themeColors from '../utils/themeColors';

export default function Dashboard({ stats = {}, setStats = () => {}, alerts = [], navigateTo = () => {}, theme = 'dark' }) {
  const c = themeColors(theme);
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
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: c.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Security Operations Monitor</h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: c.textSecondary }}>Live telemetry streaming, automated vector containment, and ingress flow rates.</p>
        </div>
        <button
          onClick={handleSync}
          style={{
            backgroundColor: c.btnSecondaryBg,
            border: `1px solid ${c.border}`,
            color: c.textSecondary,
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = c.textPrimary; e.currentTarget.style.borderColor = c.borderStrong; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = c.textSecondary; e.currentTarget.style.borderColor = c.border; }}
        >
          <RefreshCw size={13} /> Sync Feed
        </button>
      </div>

      {/* Metrics Row (Rounded-2xl glass-cards with subtle lift) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.9rem' }}>
        {[
          { label: 'Ingress Packets', val: currentStats.totalTraffic || '142,920', icon: Activity, color: '#06b6d4', iconBg: 'rgba(6, 182, 212, 0.12)' },
          { label: 'Attacks Blocked', val: currentStats.threatsBlocked || '389', icon: AlertTriangle, color: '#ef4444', iconBg: 'rgba(239, 68, 68, 0.12)' },
          { label: 'Network Health', val: currentStats.networkHealth || currentStats.health || '99.4%', icon: ShieldCheck, color: '#10b981', iconBg: 'rgba(16, 185, 129, 0.12)' },
          { label: 'Simulations Active', val: currentStats.activeSims || '1', icon: Zap, color: '#f59e0b', iconBg: 'rgba(245, 158, 11, 0.12)' }
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="landing-hover-card"
              style={{
                backgroundColor: c.cardBg,
                border: `1px solid ${c.border}`,
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: c.shadowSm,
                transition: c.transition
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: c.textMuted, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>{m.label}</p>
                <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.45rem', fontWeight: 800, color: c.textPrimary, fontVariantNumeric: 'tabular-nums' }}>{m.val}</h3>
              </div>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                backgroundColor: m.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: m.color
              }}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphs Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <div className="landing-hover-card" style={{
          backgroundColor: c.cardBg,
          border: `1px solid ${c.border}`,
          borderRadius: '16px',
          padding: '1.25rem',
          boxShadow: c.shadowSm,
          transition: c.transition
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: c.textPrimary }}>Real-Time Throughput</span>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, color: '#10b981',
              backgroundColor: c.okBgSoft, padding: '2px 8px', borderRadius: '9999px',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              ● Live 60s Stream
            </span>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: c.textMuted, marginTop: '0.5rem', fontWeight: 600 }}>
            <span>T-60s</span>
            <span>T-30s</span>
            <span>Current</span>
          </div>
        </div>

        <div className="landing-hover-card" style={{
          backgroundColor: c.cardBg,
          border: `1px solid ${c.border}`,
          borderRadius: '16px',
          padding: '1.25rem',
          boxShadow: c.shadowSm,
          transition: c.transition
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: c.textPrimary }}>Attack Class Distribution</span>
            <span style={{ fontSize: '0.72rem', color: c.textSecondary, fontWeight: 600 }}>{totalAttacks} Attacks Neutralized</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontWeight: 600, color: c.textBody }}>DoS / SYN Floods ({dosPct}%)</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>{dosNum}</span>
              </div>
              <div style={{ height: '7px', backgroundColor: c.barTrack, borderRadius: '4px' }}>
                <div style={{ width: `${dosPct}%`, height: '100%', backgroundColor: '#ef4444', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontWeight: 600, color: c.textBody }}>Port Probes & Scans ({probePct}%)</span>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>{probeNum}</span>
              </div>
              <div style={{ height: '7px', backgroundColor: c.barTrack, borderRadius: '4px' }}>
                <div style={{ width: `${probePct}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontWeight: 600, color: c.textBody }}>R2L / Privilege Esc ({r2lPct}%)</span>
                <span style={{ color: '#0284c7', fontWeight: 700 }}>{r2lNum}</span>
              </div>
              <div style={{ height: '7px', backgroundColor: c.barTrack, borderRadius: '4px' }}>
                <div style={{ width: `${r2lPct}%`, height: '100%', backgroundColor: '#0284c7', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: c.cardBg,
        border: `1px solid ${c.border}`,
        borderRadius: '16px',
        padding: '1rem 1.4rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: c.shadowSm,
        transition: c.transition
      }}>
        <div>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: c.textPrimary }}>Quick Operations</span>
          <p style={{ margin: 0, fontSize: '0.74rem', color: c.textSecondary }}>Directly trigger an action or analyze traffic captures.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => navigateTo('traffic')}
            style={{
              backgroundColor: '#2563eb',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              padding: '0.5rem 1rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            Packet Inspector
          </button>
          <button
            onClick={() => navigateTo('alerts')}
            style={{
              backgroundColor: c.btnSecondaryBg,
              border: `1px solid ${c.border}`,
              borderRadius: '8px',
              color: c.textPrimary,
              padding: '0.5rem 1rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.borderStrong; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; }}
          >
            All Alerts
          </button>
          <button
            onClick={() => navigateTo('simulate')}
            style={{
              backgroundColor: c.btnSecondaryBg,
              border: `1px solid ${c.border}`,
              borderRadius: '8px',
              color: c.textPrimary,
              padding: '0.5rem 1rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.borderStrong; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; }}
          >
            Simulator
          </button>
        </div>
      </div>

      {/* Recent Alert Feed */}
      <div style={{
        backgroundColor: c.cardBg,
        border: `1px solid ${c.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: c.shadowSm,
        transition: c.transition
      }}>
        <div style={{
          padding: '0.85rem 1.25rem',
          borderBottom: `1px solid ${c.borderLight}`,
          backgroundColor: c.tableHeaderBg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: c.textPrimary }}>Recent Detections</span>
          <span style={{ fontSize: '0.7rem', color: c.textMuted }}>Latest 3 events</span>
        </div>
        {safeAlerts.slice(0, 3).map((a) => (
          <div key={a.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            borderBottom: `1px solid ${c.rowDivider}`,
            fontSize: '0.8rem',
            transition: 'background-color 0.15s ease'
          }}>
            <span style={{ fontFamily: 'monospace', color: c.textMuted }}>{a.time}</span>
            <span style={{ fontWeight: 700, color: c.textPrimary }}>{a.type}</span>
            <span style={{ fontFamily: 'monospace', color: c.accentCyan, fontWeight: 600 }}>{a.source}</span>
            <span style={{
              padding: '3px 9px',
              borderRadius: '9999px',
              fontSize: '0.68rem',
              fontWeight: 700,
              backgroundColor: a.status === 'Blocked' ? c.dangerBgSoft : c.warnBgSoft,
              color: a.status === 'Blocked' ? '#ef4444' : '#f59e0b',
              border: `1px solid ${a.status === 'Blocked' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
            }}>
              {a.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
