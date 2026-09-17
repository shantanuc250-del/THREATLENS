import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Shield, AlertTriangle, CheckCircle,
  TrendingUp, Clock, Radio, Play, Square
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { getDashboard, getTimeline, startSimulation, stopSimulation, getSimulationStatus } from '../services/api';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [simStatus, setSimStatus] = useState({ is_running: false });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [dashRes, timeRes, simRes] = await Promise.all([
        getDashboard(),
        getTimeline(timeRange),
        getSimulationStatus(),
      ]);
      setStats(dashRes.data);
      setTimeline(timeRes.data.timeline || []);
      setSimStatus(simRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [timeRange]);
  useEffect(() => {
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const handleSimulation = async () => {
    try {
      if (simStatus.is_running) {
        await stopSimulation();
      } else {
        await startSimulation(50);
      }
      const res = await getSimulationStatus();
      setSimStatus(res.data);
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="loader" />
    </div>
  );

  const kpiCards = [
    {
      title: 'Total Traffic',
      value: stats?.total_traffic?.toLocaleString() || '0',
      icon: Activity,
      color: 'blue',
      subtitle: 'Records processed',
    },
    {
      title: 'Normal Traffic',
      value: stats?.normal_traffic?.toLocaleString() || '0',
      icon: CheckCircle,
      color: 'green',
      subtitle: `${(100 - (stats?.attack_percentage || 0)).toFixed(1)}% of total`,
    },
    {
      title: 'Detected Attacks',
      value: stats?.attack_traffic?.toLocaleString() || '0',
      icon: AlertTriangle,
      color: 'red',
      subtitle: `${stats?.attack_percentage || 0}% of total`,
    },
    {
      title: 'Active Alerts',
      value: stats?.active_alerts?.toLocaleString() || '0',
      icon: Shield,
      color: 'purple',
      subtitle: `${stats?.critical_alerts || 0} critical`,
    },
  ];

  const severityData = stats?.severity_distribution
    ? Object.entries(stats.severity_distribution).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="animate-fadeIn space-y-6 w-full max-w-full min-w-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2a3550] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield size={22} className="text-blue-400" /> Executive SOC Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Threat Monitoring & AI Anomaly Detection Engine
            {simStatus.is_running && (
              <span className="ml-2 text-amber-400 font-semibold">
                [SIMULATION STREAM ACTIVE]
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulation}
            className={simStatus.is_running ? 'btn-danger' : 'btn-primary'}
          >
            {simStatus.is_running ? (
              <><Square size={15}/> Stop Simulation</>
            ) : (
              <><Play size={15}/> Start Live Simulation</>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {kpiCards.map((kpi, i) => (
          <div key={i} className={`kpi-card ${kpi.color}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{kpi.title}</p>
                <p className="text-2xl font-bold text-white mt-1.5">{kpi.value}</p>
                <p className="text-xs text-slate-500 mt-1">{kpi.subtitle}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <kpi.icon size={20} className="text-cyan-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* Timeline Chart */}
        <div className="lg:col-span-2 glass-card p-5 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-semibold text-white">Attack Timeline Volume</h3>
            <div className="flex gap-1">
              {['1h', '24h', '7d', 'all'].map(r => (
                <button key={r} onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                    timeRange === r
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {r === 'all' ? 'All' : r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="gradAttack" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="period" tick={{fontSize: 10, fill: '#64748b'}} tickFormatter={v => v?.split(' ')[1] || v} />
                <YAxis tick={{fontSize: 10, fill: '#64748b'}} />
                <Tooltip
                  contentStyle={{ background: '#1a2235', border: '1px solid #2a3550', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="normal" stroke="#10b981" fill="url(#gradNormal)" strokeWidth={2} name="Normal Traffic" />
                <Area type="monotone" dataKey="attacks" stroke="#ef4444" fill="url(#gradAttack)" strokeWidth={2} name="Attack Traffic" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-slate-500 text-sm">
              No timeline data recorded.
            </div>
          )}
        </div>

        {/* Severity Distribution */}
        <div className="glass-card p-5 min-w-0">
          <h3 className="text-sm font-semibold text-white mb-4">Severity Breakdown</h3>
          {severityData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={severityData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={3} dataKey="value"
                  >
                    {severityData.map((_, i) => (
                      <Cell key={i} fill={
                        severityData[i]?.name === 'CRITICAL' ? '#dc2626' :
                        severityData[i]?.name === 'HIGH' ? '#ef4444' :
                        severityData[i]?.name === 'MEDIUM' ? '#f59e0b' : '#3b82f6'
                      } />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid #2a3550', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {severityData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className={`badge badge-${s.name.toLowerCase()}`}>{s.name}</span>
                    <span className="text-slate-300 font-mono font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-60 text-slate-500 text-sm">
              No alerts recorded
            </div>
          )}
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="glass-card p-5 w-full min-w-0">
        <div className="flex items-center justify-between mb-4 border-b border-[#2a3550] pb-2.5">
          <h3 className="text-sm font-semibold text-white">Recent SOC Alerts</h3>
          <button onClick={() => navigate('/alerts')} className="text-xs text-blue-400 hover:text-blue-300 font-medium">
            View All Alerts →
          </button>
        </div>
        {stats?.recent_alerts?.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="data-table w-full min-w-[600px]">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Source IP</th>
                  <th>Destination IP</th>
                  <th>Protocol</th>
                  <th>Attack Probability</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="cursor-pointer hover:bg-slate-800/50 transition-colors"
                    onClick={() => navigate(`/alerts/${alert.id}`)}
                  >
                    <td className="font-mono text-xs text-slate-400">{new Date(alert.timestamp).toLocaleString()}</td>
                    <td className="font-mono text-sm text-slate-200">{alert.source_ip}</td>
                    <td className="font-mono text-sm text-slate-200">{alert.destination_ip}</td>
                    <td className="uppercase text-xs font-semibold text-cyan-400">{alert.protocol}</td>
                    <td className="font-mono text-xs font-bold text-red-400">
                      {(alert.probability * 100).toFixed(1)}%
                    </td>
                    <td><span className={`badge badge-${alert.severity?.toLowerCase()}`}>{alert.severity}</span></td>
                    <td><span className={`badge badge-${alert.status?.toLowerCase().replace('_', '-')}`}>{alert.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">
            No active alerts recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}
