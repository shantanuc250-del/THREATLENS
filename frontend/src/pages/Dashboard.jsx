import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Shield, AlertTriangle, CheckCircle, Play, Square,
  RefreshCw, Radio, Flame, Inbox, Target, Percent,
  Cpu, Zap, Network, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import {
  getDashboard, getTimeline, startSimulation, stopSimulation,
  getSimulationStatus, getAlerts,
} from '../services/api';
import { useThemeTokens } from '../theme/ThemeContext';

const TOKENS = ['brand', 'brand-2', 'ok', 'warn', 'danger', 'info', 'line', 'card', 'muted', 'hi', 'faint'];
const SEV_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export default function Dashboard() {
  const nav = useNavigate();
  const t = useThemeTokens(TOKENS);

  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [feed, setFeed] = useState([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [simStatus, setSimStatus] = useState({ is_running: false });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [d, tl, sim, al] = await Promise.all([
        getDashboard(),
        getTimeline(timeRange),
        getSimulationStatus(),
        getAlerts({ per_page: 100, sort_by: 'timestamp', sort_order: 'desc' }).catch(() => ({ data: { alerts: [] } })),
      ]);
      setStats(d.data);
      setTimeline(tl.data?.timeline || []);
      setSimStatus(sim.data);
      setFeed(al.data?.alerts || []);
      setError(null);
    } catch (err) {
      console.warn('Dashboard fetch:', err?.message);
      setError('API disconnected');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const iv = setInterval(fetchData, simStatus.is_running ? 4000 : 12000);
    return () => clearInterval(iv);
  }, [fetchData, simStatus.is_running]);

  const handleSim = async () => {
    try {
      if (simStatus.is_running) await stopSimulation();
      else await startSimulation(50);
      const r = await getSimulationStatus();
      setSimStatus(r.data);
      fetchData();
    } catch (e) { console.error('Sim error:', e); }
  };

  /* ── Derived data ── */
  const sevData = useMemo(() => {
    const d = stats?.severity_distribution || {};
    return SEV_ORDER.filter((k) => d[k]).map((k) => ({ name: k, value: d[k] }));
  }, [stats]);

  const statusData = useMemo(() => {
    const d = stats?.status_distribution || {};
    return Object.entries(d).map(([name, value]) => ({ name, value }));
  }, [stats]);

  const topSources = useMemo(() => {
    const m = new Map();
    feed.forEach((a) => {
      if (!a.source_ip) return;
      const p = m.get(a.source_ip) || { ip: a.source_ip, hits: 0, worst: 0 };
      p.hits += 1;
      p.worst = Math.max(p.worst, a.probability || 0);
      m.set(a.source_ip, p);
    });
    return [...m.values()].sort((a, b) => b.hits - a.hits).slice(0, 5);
  }, [feed]);

  const attackTypes = useMemo(() => {
    const m = new Map();
    feed.forEach((a) => {
      const k = a.attack_type || 'Unknown';
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [feed]);

  const confidence = useMemo(() => {
    if (!feed.length) return null;
    const probs = feed.map((a) => a.probability || 0);
    return {
      avg: probs.reduce((s, p) => s + p, 0) / probs.length,
      high: probs.filter((p) => p >= 0.9).length,
      total: probs.length,
    };
  }, [feed]);

  const sevColor = (n) => ({ CRITICAL: t.danger, HIGH: t.danger, MEDIUM: t.warn, LOW: t.brand }[n] || t.muted);
  const statColor = (n) => ({ NEW: t.info, INVESTIGATING: t.warn, RESOLVED: t.ok, FALSE_POSITIVE: t.muted }[n] || t.muted);
  const ttStyle = { background: t.card, border: `1px solid ${t.line}`, borderRadius: '8px', fontSize: '12px', color: t.hi };

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="loader" />
        <p className="text-xs text-muted">Loading telemetry…</p>
      </div>
    );
  }

  const kpis = [
    { label: 'Traffic',  value: stats?.total_traffic?.toLocaleString() || '0',  icon: Activity,      color: 'blue',   tone: 'brand' },
    { label: 'Normal',   value: stats?.normal_traffic?.toLocaleString() || '0', icon: CheckCircle,   color: 'green',  tone: 'ok' },
    { label: 'Attacks',  value: stats?.attack_traffic?.toLocaleString() || '0', icon: AlertTriangle, color: 'red',    tone: 'danger' },
    { label: 'Alerts',   value: stats?.active_alerts?.toLocaleString() || '0',  icon: Shield,        color: 'purple', tone: 'info' },
  ];

  const toneBg = {
    brand: 'bg-brand-soft border-brand-soft text-brand',
    ok:    'bg-ok-soft border-ok-soft text-ok',
    danger:'bg-danger-soft border-danger-soft text-danger',
    info:  'bg-info-soft border-info-soft text-info',
  };

  return (
    <div className="dash animate-fadeIn">

      {/* ── Toolbar ── */}
      <div className="dash-toolbar">
        <div className="dash-toolbar-left">
          <span className="dash-dot" />
          <span className="dash-toolbar-title">SOC Overview</span>
          {simStatus.is_running && (
            <span className="pill-status bg-warn-soft border-warn-soft text-warn">
              <Radio size={11} className="animate-pulse" /> LIVE
            </span>
          )}
          {error && (
            <span className="pill-status bg-danger-soft border-danger-soft text-danger">
              <AlertCircle size={11} /> Offline
            </span>
          )}
        </div>
        <div className="dash-toolbar-right">
          <button onClick={fetchData} className="btn-secondary btn-sm" title="Refresh">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleSim} className={simStatus.is_running ? 'btn-danger btn-sm' : 'btn-primary btn-sm'}>
            {simStatus.is_running ? <><Square size={13} /> Stop</> : <><Play size={13} /> Simulate</>}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="dash-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className={`kpi-card ${k.color}`}>
            <div className="kpi-body">
              <span className="kpi-label">{k.label}</span>
              <span className="kpi-value">{k.value}</span>
            </div>
            <span className={`kpi-icon ${toneBg[k.tone]}`}>
              <k.icon size={16} />
            </span>
          </div>
        ))}
      </div>

      {/* ── Mini stats ── */}
      <div className="dash-mini-grid">
        <MiniStat icon={Inbox}   label="Total Alerts" value={stats?.total_alerts?.toLocaleString() || '0'} tone="brand" />
        <MiniStat icon={Flame}   label="Critical"     value={stats?.critical_alerts?.toLocaleString() || '0'} tone="danger" />
        <MiniStat icon={Percent} label="Avg Conf"     value={confidence ? `${(confidence.avg * 100).toFixed(1)}%` : '—'} tone="warn" />
        <MiniStat icon={Target}  label="High Conf"    value={confidence ? `${confidence.high}/${confidence.total}` : '—'} tone="info" />
      </div>

      {/* ── Charts Row ── */}
      <div className="dash-charts-row">
        {/* Timeline */}
        <div className="glass-card dash-chart-main">
          <div className="dash-chart-header">
            <h3 className="dash-chart-title"><Zap size={14} className="text-brand" /> Traffic Volume</h3>
            <div className="dash-range-btns">
              {['1h', '24h', '7d', 'all'].map((r) => (
                <button key={r} onClick={() => setTimeRange(r)}
                  className={`dash-range-btn ${timeRange === r ? 'active' : ''}`}>
                  {r === 'all' ? 'All' : r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={timeline} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={t.danger} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={t.danger} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={t.ok} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={t.ok} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={t.line} vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: t.muted }} tickLine={false}
                  axisLine={{ stroke: t.line }} tickFormatter={(v) => v?.split(' ')[1] || v} />
                <YAxis tick={{ fontSize: 10, fill: t.muted }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={ttStyle} cursor={{ stroke: t.line }} />
                <Area type="monotone" dataKey="normal" stroke={t.ok} fill="url(#gN)" strokeWidth={2} name="Normal" />
                <Area type="monotone" dataKey="attacks" stroke={t.danger} fill="url(#gA)" strokeWidth={2} name="Attacks" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyPanel icon={Activity} text="No data yet" action={!simStatus.is_running && handleSim} actionText="Start Simulation" />
          )}
        </div>

        {/* Severity Donut */}
        <div className="glass-card dash-chart-side">
          <h3 className="dash-chart-title"><Shield size={14} className="text-brand-2" /> Severity</h3>
          {sevData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={sevData} cx="50%" cy="50%" innerRadius={42} outerRadius={65}
                    paddingAngle={3} dataKey="value" stroke="none">
                    {sevData.map((s) => <Cell key={s.name} fill={sevColor(s.name)} />)}
                  </Pie>
                  <Tooltip contentStyle={ttStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="dash-sev-legend">
                {sevData.map((s) => (
                  <div key={s.name} className="dash-sev-row">
                    <span className={`badge badge-${s.name.toLowerCase()}`}>{s.name}</span>
                    <span className="dash-sev-count">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyPanel icon={Shield} text="No severity data" action={!simStatus.is_running && handleSim} actionText="Generate Traffic" />
          )}
        </div>
      </div>

      {/* ── Second Row: Attack types, Triage, Top IPs ── */}
      <div className="dash-3col">
        {/* Attack Types */}
        <div className="glass-card dash-panel">
          <h3 className="dash-chart-title">Attack Types</h3>
          {attackTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={attackTypes} layout="vertical" margin={{ top: 8, right: 8, left: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.line} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: t.muted }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={78}
                  tick={{ fontSize: 10, fill: t.muted }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={ttStyle} cursor={{ fill: t.line, opacity: 0.3 }} />
                <Bar dataKey="value" fill={t.brand} radius={[0, 4, 4, 0]} barSize={10} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyPanel icon={Cpu} text="No attacks classified" />
          )}
        </div>

        {/* Triage Queue */}
        <div className="glass-card dash-panel">
          <h3 className="dash-chart-title">Triage Queue</h3>
          {statusData.length > 0 ? (
            <div className="dash-triage-list">
              {statusData.map((s) => {
                const total = statusData.reduce((a, x) => a + x.value, 0) || 1;
                const pct = (s.value / total) * 100;
                return (
                  <div key={s.name} className="dash-triage-item">
                    <div className="dash-triage-row">
                      <span className="dash-triage-name">{s.name.replace('_', ' ')}</span>
                      <span className="dash-triage-val">{s.value}</span>
                    </div>
                    <div className="dash-triage-bar">
                      <div className="dash-triage-fill" style={{ width: `${pct}%`, background: statColor(s.name) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyPanel icon={Inbox} text="Queue empty" />
          )}
        </div>

        {/* Top IPs */}
        <div className="glass-card dash-panel">
          <h3 className="dash-chart-title">Top Source IPs</h3>
          {topSources.length > 0 ? (
            <ul className="dash-ip-list">
              {topSources.map((s, i) => (
                <li key={s.ip} className="dash-ip-row">
                  <span className="dash-ip-rank">{i + 1}</span>
                  <span className="dash-ip-info">
                    <span className="dash-ip-addr">{s.ip}</span>
                    <span className="dash-ip-conf">{(s.worst * 100).toFixed(0)}% peak</span>
                  </span>
                  <span className="badge badge-high">{s.hits}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyPanel icon={Network} text="No repeat offenders" />
          )}
        </div>
      </div>

      {/* ── Alert Table ── */}
      <div className="glass-card dash-panel">
        <div className="dash-table-header">
          <h3 className="dash-chart-title"><Network size={14} className="text-brand" /> Recent Alerts</h3>
          <button onClick={() => nav('/alerts')} className="btn-ghost btn-xs">View All →</button>
        </div>
        {stats?.recent_alerts?.length > 0 ? (
          <div className="dash-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th><th>Source</th><th>Destination</th><th>Protocol</th>
                  <th>Type</th><th>Confidence</th><th>Severity</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_alerts.map((a) => (
                  <tr key={a.id} className="cursor-pointer" onClick={() => nav(`/alerts/${a.id}`)}>
                    <td className="font-mono text-xs text-muted">{new Date(a.timestamp).toLocaleTimeString()}</td>
                    <td className="font-mono text-xs font-semibold text-hi">{a.source_ip}</td>
                    <td className="font-mono text-xs text-body">{a.destination_ip}</td>
                    <td className="text-xs font-bold text-brand-2" style={{ textTransform: 'uppercase' }}>{a.protocol}</td>
                    <td className="text-xs text-body">{a.attack_type || 'Unknown'}</td>
                    <td>
                      <div className="dash-conf-cell">
                        <div className="dash-conf-bar">
                          <div className="dash-conf-fill"
                            style={{ width: `${Math.min(100, (a.probability || 0) * 100)}%`,
                              background: (a.probability || 0) >= 0.9 ? t.danger : t.warn }} />
                        </div>
                        <span className="font-mono text-xs font-bold text-hi">{((a.probability || 0) * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td><span className={`badge badge-${a.severity?.toLowerCase()}`}>{a.severity}</span></td>
                    <td><span className={`badge badge-${a.status?.toLowerCase().replace('_', '-')}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyPanel icon={Shield} text="No alerts recorded" action={!simStatus.is_running && handleSim} actionText="Start Simulation" />
        )}
      </div>
    </div>
  );
}

/* ── Small components ── */

function MiniStat({ icon: Icon, label, value, tone }) {
  const cls = {
    brand: 'bg-brand-soft border-brand-soft text-brand',
    danger: 'bg-danger-soft border-danger-soft text-danger',
    warn: 'bg-warn-soft border-warn-soft text-warn',
    info: 'bg-info-soft border-info-soft text-info',
  }[tone];
  return (
    <div className="glass-card dash-mini">
      <span className={`dash-mini-icon ${cls}`}><Icon size={14} /></span>
      <span className="dash-mini-body">
        <span className="dash-mini-label">{label}</span>
        <span className="dash-mini-value">{value}</span>
      </span>
    </div>
  );
}

function EmptyPanel({ icon: Icon, text, action, actionText }) {
  return (
    <div className="empty-state" style={{ minHeight: 160 }}>
      <div className="empty-state-icon">{Icon && <Icon size={16} />}</div>
      <p className="text-xs text-faint">{text}</p>
      {action && actionText && (
        <button onClick={action} className="btn-primary btn-xs">
          <Play size={11} /> {actionText}
        </button>
      )}
    </div>
  );
}
