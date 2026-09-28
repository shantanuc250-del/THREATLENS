import React from 'react';
import { Shield, Menu, Radio } from 'lucide-react';

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

export default function Navbar({ currentPage = 'landing', navigateTo = () => {}, onOpenDrawer = () => {} }) {
  return (
    <header style={{
      backgroundColor: 'rgba(7, 11, 20, 0.94)',
      borderBottom: '1px solid #1a263e',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
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
            background: '#0d1628',
            border: '1px solid #233555',
            borderRadius: '8px',
            padding: '7px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            color: '#38bdf8',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#233555'; }}
        >
          <Menu size={18} />
        </button>
        <div
          onClick={() => navigateTo('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
        >
          <div style={{ backgroundColor: '#2563eb', padding: '6px', borderRadius: '8px', display: 'flex', boxShadow: '0 2px 10px rgba(37,99,235,0.45)' }}>
            <Shield size={18} color="#fff" />
          </div>
          <div>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.3px', color: '#f8fafc' }}>ThreatLens</span>
            <span style={{ fontSize: '0.68rem', color: '#06b6d4', marginLeft: '0.5rem', fontWeight: 700 }}>SOC Defense</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
        {NAV_ITEMS.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              style={{
                backgroundColor: active ? '#2563eb' : 'transparent',
                border: active ? '1px solid #3b82f6' : '1px solid transparent',
                color: active ? '#ffffff' : '#94a3b8',
                borderRadius: '8px',
                padding: '0.4rem 0.8rem',
                fontSize: '0.78rem',
                fontWeight: active ? 700 : 600,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = '#141f33';
                  e.currentTarget.style.color = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
            >
              {item.label}
            </button>
          );
        })}

        {/* Live SOC Status Pill Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '9999px',
          padding: '0.32rem 0.75rem',
          marginLeft: '0.35rem',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#10b981'
        }}>
          <Radio size={12} className="animate-pulse" />
          <span>SOC LIVE</span>
        </div>

        {/* Launch SOC Console pill */}
        <button
          onClick={() => navigateTo('dashboard')}
          style={{
            background: 'linear-gradient(135deg, #2563eb, #0891b2)',
            border: 'none',
            borderRadius: '9999px',
            color: '#fff',
            padding: '0.45rem 1.15rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginLeft: '0.35rem',
            boxShadow: '0 4px 14px -3px rgba(37,99,235,0.4)',
            transition: 'transform 0.2s ease, filter 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.15)'}
          onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
        >
          Launch SOC Console
        </button>
      </div>
    </header>
  );
}
