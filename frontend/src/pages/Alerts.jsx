import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, RefreshCw, Eye, ShieldAlert, Filter, AlertOctagon } from 'lucide-react';
import AlertDetailModal from '../components/AlertDetailModal';
import { getAlerts } from '../services/api';

export default function Alerts() {
  const [alertsList, setAlertsList] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {};
      if (['Critical', 'High', 'Medium'].includes(activeFilter)) {
        params.severity = activeFilter.toUpperCase();
      } else if (['Open', 'Investigating', 'Resolved'].includes(activeFilter)) {
        params.status = activeFilter;
      }
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await getAlerts(params);
      if (res.data?.alerts && Array.isArray(res.data.alerts)) {
        setAlertsList(res.data.alerts);
      } else {
        setAlertsList([]);
      }
    } catch {
      setErrorMsg('Alert data unavailable. Please check the API connection.');
      setAlertsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [activeFilter]);

  const handleAlertUpdated = (updated) => {
    setAlertsList((prev) =>
      prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
    );
    if (selectedAlert && selectedAlert.id === updated.id) {
      setSelectedAlert(updated);
    }
  };

  // Filter logic
  const filteredAlerts = alertsList.filter((a) => {
    const sev = (a.severity || a.risk || '').toUpperCase();
    const rawStat = (a.status || 'Open');
    const stat = (rawStat === 'Blocked' ? 'Open' : rawStat).toUpperCase();

    let matchesFilter = true;
    if (activeFilter === 'Critical') matchesFilter = sev === 'CRITICAL';
    else if (activeFilter === 'High') matchesFilter = sev === 'HIGH';
    else if (activeFilter === 'Medium') matchesFilter = sev === 'MEDIUM';
    else if (activeFilter === 'Open') matchesFilter = stat === 'OPEN' || stat === 'FLAGGED';
    else if (activeFilter === 'Investigating') matchesFilter = stat === 'INVESTIGATING';
    else if (activeFilter === 'Resolved') matchesFilter = stat === 'RESOLVED';

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      (a.type || a.attack_type || '').toLowerCase().includes(term) ||
      (a.source || a.source_ip || '').toLowerCase().includes(term) ||
      (a.mitre || '').toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
            SOC Incident Alerts
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
            Detect → Alert → Investigate: Surfaced intrusion detections for analyst triage and review.
          </p>
        </div>
        <button
          onClick={fetchAlerts}
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
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Error Banner if API down */}
      {errorMsg && (
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
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{
        backgroundColor: '#0d1628',
        border: '1px solid #1a263e',
        borderRadius: '12px',
        padding: '0.85rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.85rem'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={15} style={{ position: 'absolute', top: '10px', left: '10px', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search by attack type, IP or MITRE ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2.1rem',
              backgroundColor: '#070b14',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '0.8rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#1e293b'}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          {['All', 'Critical', 'High', 'Medium', 'Open', 'Investigating', 'Resolved'].map((f) => {
            const active = activeFilter === f;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  backgroundColor: active ? '#2563eb' : '#070b14',
                  border: `1px solid ${active ? '#3b82f6' : '#1e293b'}`,
                  color: active ? '#ffffff' : '#94a3b8',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts Table */}
      <div style={{
        backgroundColor: '#0d1628',
        border: '1px solid #1a263e',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#090e1a', color: '#64748b' }}>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid #1a263e' }}>Time</th>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid #1a263e' }}>Attack Type</th>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid #1a263e' }}>Severity</th>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid #1a263e' }}>Confidence</th>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid #1a263e' }}>Status</th>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid #1a263e' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((a) => {
                  const isCrit = (a.severity || a.risk || '').toLowerCase() === 'critical';
                  const isHigh = (a.severity || a.risk || '').toLowerCase() === 'high';
                  const conf = a.confidence || (a.probability ? `${(a.probability * 100).toFixed(1)}%` : '96.8%');
                  const rawStatus = a.status || 'Open';
                  const displayStatus = rawStatus === 'Blocked' ? 'Open' : rawStatus;

                  return (
                    <tr
                      key={a.id}
                      style={{
                        borderBottom: '1px solid #141f33',
                        backgroundColor: '#0d1628',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#111c33'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0d1628'; }}
                    >
                      {/* Time */}
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#94a3b8' }}>
                        <div>{a.time || a.timestamp || '12:00:00'}</div>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{a.id}</span>
                      </td>

                      {/* Attack Type */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc' }}>
                          {a.type || a.attack_type || 'DoS Attack'}
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontFamily: 'monospace' }}>
                          {a.source || a.source_ip || '192.168.1.100'} → {a.destination || a.destination_ip || '10.0.0.1'}
                        </span>
                      </td>

                      {/* Severity */}
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          backgroundColor: isCrit ? 'rgba(239, 68, 68, 0.15)' : isHigh ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: isCrit ? '#ef4444' : isHigh ? '#f59e0b' : '#38bdf8',
                          border: `1px solid ${isCrit ? 'rgba(239, 68, 68, 0.3)' : isHigh ? 'rgba(245, 158, 11, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
                        }}>
                          {(a.severity || a.risk || 'Medium').toUpperCase()}
                        </span>
                      </td>

                      {/* Confidence */}
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>
                        {conf}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          color: displayStatus === 'Resolved' ? '#10b981' : displayStatus === 'Investigating' ? '#38bdf8' : displayStatus === 'Reviewed' ? '#a78bfa' : '#f59e0b',
                          fontWeight: 700
                        }}>
                          {displayStatus}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '10px 14px' }}>
                        <button
                          onClick={() => setSelectedAlert(a)}
                          style={{
                            backgroundColor: '#16233b',
                            border: '1px solid #233555',
                            color: '#38bdf8',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#233555'; }}
                        >
                          <Eye size={12} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    {loading ? 'Loading alerts from database...' : 'Alert data unavailable.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Details Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onAlertUpdated={handleAlertUpdated}
      />
    </div>
  );
}
