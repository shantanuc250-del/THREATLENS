import React from 'react';
import { Shield, Menu } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'landing', label: 'Home' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'traffic', label: 'Analyzer' },
  { id: 'simulate', label: 'Simulator' },
  { id: 'risk', label: 'Risk' },
  { id: 'health', label: 'Health' },
  { id: 'settings', label: 'Settings' }
];

export default function Navbar({ currentPage = 'dashboard', navigateTo = () => {}, onOpenDrawer = () => {} }) {
  return (
    <header style={{
      backgroundColor: '#0d1525',
      borderBottom: '1px solid #1a263e',
      padding: '0.75rem 1.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          onClick={onOpenDrawer}
          style={{
            background: '#16233b',
            border: '1px solid #233555',
            borderRadius: '6px',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            color: '#38bdf8'
          }}
        >
          <Menu size={18} />
        </button>
        <div
          onClick={() => navigateTo('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
        >
          <div style={{ backgroundColor: '#2563eb', padding: '5px', borderRadius: '6px', display: 'flex' }}>
            <Shield size={18} color="#fff" />
          </div>
          <div>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.4px' }}>ThreatLens</span>
            <span style={{ fontSize: '0.68rem', color: '#06b6d4', marginLeft: '0.5rem', fontWeight: 600 }}>IDS Defense</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id)}
            style={{
              backgroundColor: currentPage === item.id ? '#0284c7' : '#141f33',
              border: currentPage === item.id ? '1px solid #38bdf8' : '1px solid #1e2e4a',
              color: currentPage === item.id ? '#ffffff' : '#94a3b8',
              borderRadius: '5px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
