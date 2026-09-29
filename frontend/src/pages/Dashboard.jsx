import React, { useState, useEffect } from 'react';
import {
  Activity, AlertTriangle, ShieldCheck, AlertCircle,
  RefreshCw, CheckCircle2, Server, Database, Brain, ArrowRight, Play, Square, Radio, AlertOctagon
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { getDashboard, getTimeline, getHealth, startSimulation, stopSimulation } from '../services/api';

export default function Dashboard({ navigateTo = () => {} }) {
  const [stats, setStats] = useState({
    totalTraffic: null,
    threatsDetected: null,
    normalTraffic: null,
    highPriorityAlerts: null,
    dosCount: null,
    probeCount: null,
    r2lCount: null,
    recentAlerts: []
  });

  const [systemStatus, setSystemStatus] = useState({
    model: 'Online',
    modelVersion: 'v1.0 (Random Forest)',
    api: 'Online',
    database: 'Online'
  });

  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState('');
  const [simRunning, setSimRunning] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simMessage, setSimMessage] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setErrorBanner('');
      const [dashRes, timeRes, healthRes] = await Promise.allSettled([
        getDashboard(),
        getTimeline('24h'),
        getHealth()
      ]);

      let hasSuccess = false;

      if (dashRes.status === 'fulfilled' && dashRes.value.data) {
        const data = dashRes.value.data;
        hasSuccess = true;
        const totalNum = parseInt(String(data.total_traffic || '0').replace(/,/g, ''), 10);
        const threatNum = parseInt(String(data.threats_blocked || data.threats_detected || '0').replace(/,/g, ''), 10);
        const normalNum = Math.max(0, totalNum - threatNum);

        setStats({
          totalTraffic: totalNum > 0 ? totalNum.toLocaleString() : '0',
          threatsDetected: threatNum > 0 ? threatNum.toLocaleString() : '0',
          normalTraffic: normalNum > 0 ? normalNum.toLocaleString() : '0',
          highPriorityAlerts: String(data.dos_count || '0'),
          dosCount: String(data.dos_count || '0'),
          probeCount: String(data.probe_count || '0'),
          r2lCount: String(data.r2l_count || '0'),
          recentAlerts: Array.isArray(data.recent_alerts) ? data.recent_alerts : []
        });

        // Sync simulation status strictly from backend state
        if (data.simulation && typeof data.simulation.is_running === 'boolean') {
          setSimRunning(data.simulation.is_running);
        }

        if (data.model) {
          setSystemStatus((prev) => ({
            ...prev,
            model: data.model.status === 'online' || data.model.loaded ? 'Online' : 'Offline',
            modelVersion: `v${data.model.version || '1.0'} (Random Forest)`
          }));
        }
      } else {
        setStats({
          totalTraffic: null,
          threatsDetected: null,
          normalTraffic: null,
          highPriorityAlerts: null,
          dosCount: null,
          probeCount: null,
          r2lCount: null,
          recentAlerts: []
        });
      }

      if (timeRes.status === 'fulfilled' && timeRes.value.data?.timeline) {
        const rawTimeline = timeRes.value.data.timeline;
        if (Array.isArray(rawTimeline) && rawTimeline.length > 0) {
          const formatted = rawTimeline.map((item, idx) => ({
            time: item.period ? item.period.split(' ')[1]?.slice(0, 5) || `T-${idx}` : `T-${idx}`,
            Normal: item.normal || 0,
            Attacks: item.attacks || 0
          }));
          setTimelineData(formatted);
        } else {
          setTimelineData([]);
        }
      } else {
        setTimelineData([]);
      }

      if (healthRes.status === 'fulfilled' && healthRes.value.data) {
        const h = healthRes.value.data;
        hasSuccess = true;
        setSystemStatus((prev) => ({
          ...prev,
          api: h.status === 'Operational' || h.status === 'online' ? 'Online' : 'Degraded',
          database: h.database_healthy ? 'Online' : 'Offline',
          model: h.model_loaded ? 'Online' : 'Offline'
        }));
      }

      if (!hasSuccess) {
        setErrorBanner('Backend unavailable. Please check the API connection.');
      }
    } catch {
      setErrorBanner('Backend unavailable. Please check the API connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStartSimulation = async () => {
    try {
      setSimLoading(true);
      setSimMessage('Starting synthetic demo traffic...');
      await startSimulation(20);
      setSimRunning(true);
      setSimMessage('Synthetic demo traffic running (background thread).');
      setTimeout(() => {
        fetchDashboardData();
        setSimMessage('');
      }, 1500);
    } catch {
      setSimMessage('Simulation service unreachable.');
      setTimeout(() => setSimMessage(''), 2500);
    } finally {
      setSimLoading(false);
    }
  };

  const handleStopSimulation = async () => {
    try {
      setSimLoading(true);
      setSimMessage('Stopping simulation...');
      await stopSimulation();
      setSimRunning(false);
      setSimMessage('Simulation stopped.');
      setTimeout(() => {
        fetchDashboardData();
        setSimMessage('');
      }, 1500);
    } catch {
      setSimMessage('Failed to stop simulation.');
      setTimeout(() => setSimMessage(''), 2500);
    } finally {
      setSimLoading(false);
    }
  };

  const dosNum = stats.dosCount !== null ? parseInt(stats.dosCount, 10) : null;
  const probeNum = stats.probeCount !== null ? parseInt(stats.probeCount, 10) : null;
  const r2lNum = stats.r2lCount !== null ? parseInt(stats.r2lCount, 10) : null;
  const hasAttackCounts = dosNum !== null && probeNum !== null && r2lNum !== null;
  const totalAttacksCount = hasAttackCounts ? dosNum + probeNum + r2lNum : 0;
  const dosPct = totalAttacksCount > 0 ? Math.round((dosNum / totalAttacksCount) * 100) : 0;
  const probePct = totalAttacksCount > 0 ? Math.round((probeNum / totalAttacksCount) * 100) : 0;
  const r2lPct = totalAttacksCount > 0 ? Math.max(0, 100 - dosPct - probePct) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
            SOC Operations Dashboard
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
            What is happening in the network: real-time traffic volume, detected threats, and classification status.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            style={{
              backgroundColor: '#16233b',
              border: '1px solid #233555',
              color: '#94a3b8',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.borderColor = '#38bdf8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#233555'; }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* Traffic Simulation Status & Control Bar */}
      <div style={{
        backgroundColor: '#0d1628',
        border: simRunning ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #1a263e',
        borderRadius: '12px',
        padding: '0.9rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: simRunning ? '0 0 15px rgba(16, 185, 129, 0.1)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Status Indicator Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Simulation Status:
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              backgroundColor: simRunning ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
              color: simRunning ? '#10b981' : '#94a3b8',
              border: simRunning ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(100, 116, 139, 0.3)'
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: simRunning ? '#10b981' : '#64748b',
                boxShadow: simRunning ? '0 0 8px #10b981' : 'none'
              }} className={simRunning ? 'animate-pulse' : ''} />
              {simRunning ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>

          {/* Synthetic Demo Label */}
          <div style={{
            fontSize: '0.74rem',
            color: '#64748b',
            borderLeft: '1px solid #1e293b',
            paddingLeft: '0.85rem'
          }}>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>Synthetic / Demo Traffic</span>
            <span style={{ marginLeft: '0.35rem' }}>(In-memory test bursts for demonstration — not real physical network traffic)</span>
          </div>
        </div>

        {/* Start / Stop Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {simMessage && (
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600 }}>
              {simMessage}
            </span>
          )}

          <button
            id="start-simulation-btn"
            onClick={handleStartSimulation}
            disabled={simRunning || simLoading}
            style={{
              backgroundColor: simRunning ? '#0f172a' : 'rgba(16, 185, 129, 0.15)',
              border: simRunning ? '1px solid #1e293b' : '1px solid rgba(16, 185, 129, 0.4)',
              color: simRunning ? '#475569' : '#10b981',
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: simRunning || simLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              opacity: simRunning ? 0.5 : 1
            }}
          >
            <Play size={13} />
            <span>{simLoading && !simRunning ? 'Starting...' : 'Start Simulation'}</span>
          </button>

          <button
            id="stop-simulation-btn"
            onClick={handleStopSimulation}
            disabled={!simRunning || simLoading}
            style={{
              backgroundColor: !simRunning ? '#0f172a' : 'rgba(239, 68, 68, 0.15)',
              border: !simRunning ? '1px solid #1e293b' : '1px solid rgba(239, 68, 68, 0.4)',
              color: !simRunning ? '#475569' : '#ef4444',
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: !simRunning || simLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              opacity: !simRunning ? 0.5 : 1
            }}
          >
            <Square size={13} />
            <span>{simLoading && simRunning ? 'Stopping...' : 'Stop Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner if API down */}
      {errorBanner && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          color: '#ef4444',
          fontSize: '0.8rem',
          fontWeight: 600
        }}>
          <AlertOctagon size={16} />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Top 4 Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
        {/* Traffic Analyzed */}
        <div style={{
          backgroundColor: '#0d1628',
          border: '1px solid #1a263e',
          borderRadius: '12px',
          padding: '1.15rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Traffic Analyzed
            </p>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.45rem', fontWeight: 800, color: stats.totalTraffic ? '#f8fafc' : '#94a3b8' }}>
              {stats.totalTraffic || 'Data unavailable'}
            </h3>
            <span style={{ fontSize: '0.68rem', color: '#38bdf8' }}>Ingress packets evaluated</span>
          </div>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            backgroundColor: 'rgba(56, 189, 248, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <Activity size={22} />
          </div>
        </div>

        {/* Threats Detected */}
        <div style={{
          backgroundColor: '#0d1628',
          border: '1px solid #1a263e',
          borderRadius: '12px',
          padding: '1.15rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Threats Detected
            </p>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.45rem', fontWeight: 800, color: stats.threatsDetected ? '#ef4444' : '#94a3b8' }}>
              {stats.threatsDetected || 'Data unavailable'}
            </h3>
            <span style={{ fontSize: '0.68rem', color: '#ef4444' }}>Anomalous flows flagged</span>
          </div>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ef4444'
          }}>
            <AlertTriangle size={22} />
          </div>
        </div>

        {/* Normal Traffic */}
        <div style={{
          backgroundColor: '#0d1628',
          border: '1px solid #1a263e',
          borderRadius: '12px',
          padding: '1.15rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Normal Traffic
            </p>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.45rem', fontWeight: 800, color: stats.normalTraffic ? '#10b981' : '#94a3b8' }}>
              {stats.normalTraffic || 'Data unavailable'}
            </h3>
            <span style={{ fontSize: '0.68rem', color: '#10b981' }}>Benign traffic baseline</span>
          </div>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#10b981'
          }}>
            <ShieldCheck size={22} />
          </div>
        </div>

        {/* High-Priority Alerts */}
        <div style={{
          backgroundColor: '#0d1628',
          border: '1px solid #1a263e',
          borderRadius: '12px',
          padding: '1.15rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              High-Priority Alerts
            </p>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.45rem', fontWeight: 800, color: stats.highPriorityAlerts ? '#f59e0b' : '#94a3b8' }}>
              {stats.highPriorityAlerts || 'Data unavailable'}
            </h3>
            <span style={{ fontSize: '0.68rem', color: '#f59e0b' }}>Critical / High triage</span>
          </div>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#f59e0b'
          }}>
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {/* Main Section: Normal vs Attack Chart & Threat Severity Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {/* Normal vs Attack Timeline */}
        <div style={{
          backgroundColor: '#0d1628',
          border: '1px solid #1a263e',
          borderRadius: '14px',
          padding: '1.25rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                Normal vs Attack Ingress Timeline
              </h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                Time-series classification stream evaluated by Random Forest model
              </p>
            </div>
            <span style={{
              fontSize: '0.68rem',
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              color: '#60a5fa',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 700
            }}>
              24h Window
            </span>
          </div>

          <div style={{ height: '220px', width: '100%' }}>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="100%">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="100%">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '0.75rem', color: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="Normal" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorNormal)" />
                  <Area type="monotone" dataKey="Attacks" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAttacks)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                Timeline data unavailable.
              </div>
            )}
          </div>
        </div>

        {/* Threat Severity Distribution */}
        <div style={{
          backgroundColor: '#0d1628',
          border: '1px solid #1a263e',
          borderRadius: '14px',
          padding: '1.25rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                  Threat Severity Distribution
                </h3>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                  Intrusion anomaly breakdown across NSL-KDD categories
                </p>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#f8fafc', fontWeight: 700 }}>
                {hasAttackCounts ? `${totalAttacksCount} Flagged` : 'Data unavailable'}
              </span>
            </div>

            {hasAttackCounts && totalAttacksCount > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '0.85rem' }}>
                {/* DoS */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                      Critical — Denial of Service / SYN Flood ({dosPct}%)
                    </span>
                    <span style={{ color: '#ef4444', fontWeight: 700 }}>{dosNum}</span>
                  </div>
                  <div style={{ height: '7px', backgroundColor: '#16233b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${dosPct}%`, height: '100%', backgroundColor: '#ef4444', borderRadius: '4px' }} />
                  </div>
                </div>

                {/* Probe */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                      High — Port Probes & Recon Scans ({probePct}%)
                    </span>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>{probeNum}</span>
                  </div>
                  <div style={{ height: '7px', backgroundColor: '#16233b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${probePct}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '4px' }} />
                  </div>
                </div>

                {/* R2L / U2R */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                      Medium — Unauthorized Access / R2L ({r2lPct}%)
                    </span>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>{r2lNum}</span>
                  </div>
                  <div style={{ height: '7px', backgroundColor: '#16233b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${r2lPct}%`, height: '100%', backgroundColor: '#38bdf8', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                Distribution data unavailable.
              </div>
            )}
          </div>

          <div style={{
            marginTop: '1.15rem',
            padding: '0.75rem',
            backgroundColor: '#060a12',
            borderRadius: '8px',
            border: '1px solid #141f33',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Test custom network traffic samples:
            </span>
            <button
              onClick={() => navigateTo('traffic')}
              style={{
                backgroundColor: '#2563eb',
                border: 'none',
                color: '#fff',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              Analyze Traffic <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Security Alerts Table */}
      <div style={{
        backgroundColor: '#0d1628',
        border: '1px solid #1a263e',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid #1a263e',
          backgroundColor: '#111c33',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
              Recent Security Alerts
            </h3>
            <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>
              Latest detections surfaced by the ML model for analyst triage
            </p>
          </div>
          <button
            onClick={() => navigateTo('alerts')}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #233555',
              color: '#38bdf8',
              borderRadius: '6px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            View All Alerts <ArrowRight size={13} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#090e1a', color: '#64748b' }}>
                <th style={{ padding: '8px 14px', borderBottom: '1px solid #1a263e' }}>Time</th>
                <th style={{ padding: '8px 14px', borderBottom: '1px solid #1a263e' }}>Attack Type</th>
                <th style={{ padding: '8px 14px', borderBottom: '1px solid #1a263e' }}>Severity</th>
                <th style={{ padding: '8px 14px', borderBottom: '1px solid #1a263e' }}>Source IP</th>
                <th style={{ padding: '8px 14px', borderBottom: '1px solid #1a263e' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentAlerts && stats.recentAlerts.length > 0 ? (
                stats.recentAlerts.slice(0, 4).map((a, idx) => {
                  const isCrit = (a.risk || a.severity || '').toLowerCase() === 'critical';
                  const isHigh = (a.risk || a.severity || '').toLowerCase() === 'high';
                  const rawStatus = a.status || 'Open';
                  const displayStatus = rawStatus === 'Blocked' ? 'Open' : rawStatus;

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #141f33', backgroundColor: '#0d1628' }}>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: '#94a3b8' }}>
                        {a.time || a.timestamp || '12:00:00'}
                      </td>
                      <td style={{ padding: '9px 14px', fontWeight: 700, color: '#f8fafc' }}>
                        {a.type || a.attack_type || 'Unknown Attack'}
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          backgroundColor: isCrit ? 'rgba(239, 68, 68, 0.15)' : isHigh ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: isCrit ? '#ef4444' : isHigh ? '#f59e0b' : '#38bdf8',
                          border: `1px solid ${isCrit ? 'rgba(239, 68, 68, 0.3)' : isHigh ? 'rgba(245, 158, 11, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
                        }}>
                          {a.risk || a.severity || 'Medium'}
                        </span>
                      </td>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: '#38bdf8' }}>
                        {a.source || a.source_ip || '192.168.1.100'}
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{
                          color: displayStatus === 'Resolved' ? '#10b981' : displayStatus === 'Investigating' ? '#38bdf8' : '#f59e0b',
                          fontWeight: 700
                        }}>
                          {displayStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '1.25rem', textAlign: 'center', color: '#64748b' }}>
                    Alert data unavailable.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Status Section */}
      <div style={{
        backgroundColor: '#0d1628',
        border: '1px solid #1a263e',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* ML Model */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={16} color="#38bdf8" />
            <div>
              <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                ML Model:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={13} color={systemStatus.model === 'Online' ? '#10b981' : '#ef4444'} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                  {systemStatus.model} ({systemStatus.modelVersion})
                </span>
              </div>
            </div>
          </div>

          {/* API */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={16} color="#10b981" />
            <div>
              <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                API Gateway:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={13} color={systemStatus.api === 'Online' ? '#10b981' : '#ef4444'} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                  {systemStatus.api} (Flask Port 5000)
                </span>
              </div>
            </div>
          </div>

          {/* Database */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={16} color="#f59e0b" />
            <div>
              <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Database:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={13} color={systemStatus.database === 'Online' ? '#10b981' : '#ef4444'} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                  {systemStatus.database} (SQLite WAL)
                </span>
              </div>
            </div>
          </div>

          {/* Simulation Engine */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Radio size={16} color={simRunning ? '#10b981' : '#64748b'} />
            <div>
              <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Demo Traffic Stream:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: simRunning ? '#10b981' : '#64748b'
                }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: simRunning ? '#10b981' : '#94a3b8' }}>
                  {simRunning ? 'Active (Generating Bursts)' : 'Idle (Stopped)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security / Model Notice */}
        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
          ThreatLens IDS Platform • ML Inference & Security Operations
        </div>
      </div>
    </div>
  );
}
