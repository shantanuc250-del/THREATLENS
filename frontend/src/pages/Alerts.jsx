import React, { useState } from 'react';
import { Search } from 'lucide-react';
import AlertDetailModal from '../components/AlertDetailModal';
import themeColors from '../utils/themeColors';

export default function Alerts({ alerts = [], theme = 'dark' }) {
  const c = themeColors(theme);
  const [alertFilter, setAlertFilter] = useState('ALL');
  const [alertSearch, setAlertSearch] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const filteredAlerts = safeAlerts.filter((a) => {
    const risk = (a.risk || a.severity || '').toUpperCase();
    const matchesFilter = alertFilter === 'ALL' || risk === alertFilter;
    const matchesSearch = alertSearch === '' || (a.type || a.attack_type || '').toLowerCase().includes(alertSearch.toLowerCase()) || (a.source || a.source_ip || '').includes(alertSearch);
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: c.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Incident Detection Stream</h2>
          <p style={{ fontSize: '0.78rem', color: c.textSecondary, margin: '0.2rem 0 0 0' }}>Detailed incident logs and triage mitigation.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((lvl) => {
            const active = alertFilter === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setAlertFilter(lvl)}
                style={{
                  backgroundColor: active ? '#2563eb' : c.btnSecondaryBg,
                  border: `1px solid ${active ? '#3b82f6' : c.border}`,
                  color: active ? '#fff' : c.textSecondary,
                  borderRadius: '9999px',
                  padding: '4px 12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', top: '11px', left: '12px', color: c.textMuted }} />
        <input
          type="text"
          placeholder="Search by attack signature or source IP..."
          value={alertSearch}
          onChange={(e) => setAlertSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '0.55rem 0.75rem 0.55rem 2.3rem',
            backgroundColor: c.cardBg,
            border: `1px solid ${c.border}`,
            borderRadius: '10px',
            color: c.textPrimary,
            fontSize: '0.82rem',
            outline: 'none',
            boxSizing: 'border-box',
            boxShadow: c.shadowSm,
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
          onBlur={(e) => e.currentTarget.style.borderColor = c.border}
        />
      </div>

      <div style={{
        backgroundColor: c.cardBg,
        border: `1px solid ${c.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: c.shadowSm,
        transition: c.transition
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: c.tableHeaderBg, color: c.textSecondary }}>
                <th style={{ padding: '10px 14px', borderBottom: `1px solid ${c.borderLight}` }}>ID / Timestamp</th>
                <th style={{ padding: '10px 14px', borderBottom: `1px solid ${c.borderLight}` }}>Attack Vector</th>
                <th style={{ padding: '10px 14px', borderBottom: `1px solid ${c.borderLight}` }}>Originating Source</th>
                <th style={{ padding: '10px 14px', borderBottom: `1px solid ${c.borderLight}` }}>Destination Target</th>
                <th style={{ padding: '10px 14px', borderBottom: `1px solid ${c.borderLight}` }}>Severity</th>
                <th style={{ padding: '10px 14px', borderBottom: `1px solid ${c.borderLight}` }}>Status</th>
                <th style={{ padding: '10px 14px', borderBottom: `1px solid ${c.borderLight}` }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((a) => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${c.rowDivider}`, backgroundColor: c.cardBg }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>
                    <div style={{ fontWeight: 700, color: c.textPrimary }}>{a.id}</div>
                    <div style={{ color: c.textMuted, fontSize: '0.7rem' }}>{a.time}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: c.textPrimary }}>{a.type}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: c.accentCyan, fontWeight: 600 }}>{a.source}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: c.textSecondary }}>{a.destination}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      backgroundColor: a.risk === 'Critical' ? c.dangerBgSoft : a.risk === 'High' ? c.warnBgSoft : c.infoBgSoft,
                      color: a.risk === 'Critical' ? '#ef4444' : a.risk === 'High' ? '#f59e0b' : c.accentCyan,
                      border: `1px solid ${a.risk === 'Critical' ? 'rgba(239, 68, 68, 0.3)' : a.risk === 'High' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
                    }}>
                      {a.risk}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ color: a.status === 'Blocked' ? '#10b981' : '#f59e0b', fontWeight: 700 }}>{a.status}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      onClick={() => setSelectedAlert(a)}
                      style={{
                        backgroundColor: c.btnSecondaryBg,
                        border: `1px solid ${c.border}`,
                        color: c.accentCyan,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; }}
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

      <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} theme={theme} />
    </div>
  );
}
