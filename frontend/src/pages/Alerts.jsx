import React, { useState } from 'react';
import { Search } from 'lucide-react';
import AlertDetailModal from '../components/AlertDetailModal';

export default function Alerts({ alerts }) {
  const [alertFilter, setAlertFilter] = useState('ALL');
  const [alertSearch, setAlertSearch] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const filteredAlerts = alerts.filter((a) => {
    const matchesFilter = alertFilter === 'ALL' || a.risk.toUpperCase() === alertFilter;
    const matchesSearch = alertSearch === '' || a.type.toLowerCase().includes(alertSearch.toLowerCase()) || a.source.includes(alertSearch);
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Incident Detection Stream</h2>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>Detailed incident logs and triage mitigation.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setAlertFilter(lvl)}
              style={{
                backgroundColor: alertFilter === lvl ? '#0284c7' : '#141f33',
                border: '1px solid #1e2e4a',
                color: alertFilter === lvl ? '#fff' : '#94a3b8',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', top: '10px', left: '12px', color: '#64748b' }} />
        <input
          type="text"
          placeholder="Search by attack signature or source IP..."
          value={alertSearch}
          onChange={(e) => setAlertSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem 0.5rem 2.2rem',
            backgroundColor: '#0d1525',
            border: '1px solid #1a263e',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '0.82rem',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ backgroundColor: '#0d1525', border: '1px solid #1a263e', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#141f33', color: '#94a3b8' }}>
                <th style={{ padding: '8px 12px' }}>ID / Timestamp</th>
                <th style={{ padding: '8px 12px' }}>Attack Vector</th>
                <th style={{ padding: '8px 12px' }}>Originating Source</th>
                <th style={{ padding: '8px 12px' }}>Destination Target</th>
                <th style={{ padding: '8px 12px' }}>Severity</th>
                <th style={{ padding: '8px 12px' }}>Status</th>
                <th style={{ padding: '8px 12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #141f33' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>
                    <div>{a.id}</div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{a.time}</div>
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{a.type}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#38bdf8' }}>{a.source}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#94a3b8' }}>{a.destination}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      backgroundColor: a.risk === 'Critical' ? 'rgba(239, 68, 68, 0.2)' : a.risk === 'High' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      color: a.risk === 'Critical' ? '#ef4444' : a.risk === 'High' ? '#f59e0b' : '#38bdf8'
                    }}>
                      {a.risk}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ color: a.status === 'Blocked' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{a.status}</span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <button
                      onClick={() => setSelectedAlert(a)}
                      style={{
                        backgroundColor: '#16233b',
                        border: '1px solid #233555',
                        color: '#38bdf8',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        cursor: 'pointer'
                      }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </div>
  );
}
