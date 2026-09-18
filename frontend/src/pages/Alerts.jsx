import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAlerts } from '../services/api';

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '', severity: '', search: '', sort_by: 'timestamp', sort_order: 'desc',
  });

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 20, ...filters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const res = await getAlerts(params);
      setAlerts(res.data.alerts || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      console.error('Fetch alerts error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, [page, filters]);

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hi flex items-center gap-2">
            <Bell size={24} /> Alerts
          </h1>
          <p className="text-sm text-muted mt-1">{total} total alerts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="text"
              placeholder="Search by IP, attack type..."
              className="input-field pl-10"
              value={filters.search}
              onChange={e => { setFilters(f => ({...f, search: e.target.value})); setPage(1); }}
            />
          </div>
          <select className="input-field w-40" value={filters.status}
            onChange={e => { setFilters(f => ({...f, status: e.target.value})); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="NEW">New</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="FALSE_POSITIVE">False Positive</option>
          </select>
          <select className="input-field w-40" value={filters.severity}
            onChange={e => { setFilters(f => ({...f, severity: e.target.value})); setPage(1); }}
          >
            <option value="">All Severity</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="loader" /></div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16 text-faint">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p>No alerts found</p>
            <p className="text-xs mt-1">Upload traffic or start a simulation to generate alerts</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Time</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Protocol</th>
                  <th>Probability</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(alert => (
                  <tr key={alert.id} className="cursor-pointer" onClick={() => navigate(`/alerts/${alert.id}`)}>
                    <td className="font-mono text-xs text-faint">#{alert.id}</td>
                    <td className="font-mono text-xs">{new Date(alert.timestamp).toLocaleString()}</td>
                    <td className="font-mono text-sm">{alert.source_ip}</td>
                    <td className="font-mono text-sm">{alert.destination_ip}</td>
                    <td className="uppercase">{alert.protocol}</td>
                    <td className="font-mono">
                      <span className={alert.probability > 0.9 ? 'text-danger' : alert.probability > 0.7 ? 'text-warn' : 'text-brand'}>
                        {(alert.probability * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td><span className={`badge badge-${alert.severity?.toLowerCase()}`}>{alert.severity}</span></td>
                    <td><span className={`badge badge-${alert.status?.toLowerCase().replace('_', '-')}`}>{alert.status?.replace('_', ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-line">
            <p className="text-xs text-faint">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="btn-secondary text-xs disabled:opacity-30"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="btn-secondary text-xs disabled:opacity-30"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
