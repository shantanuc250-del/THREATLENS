import React from 'react';
import { Shield, LayoutDashboard, Radio, Activity, AlertTriangle, Cpu } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'traffic', label: 'Analyze Traffic', icon: Activity },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'health', label: 'Model Health', icon: Cpu },
];

export default function Navbar({ currentPage = 'dashboard', navigateTo = () => {} }) {
  return (
    <header style={{
      backgroundColor: 'rgba(11, 15, 25, 0.95)',
      borderBottom: '1px solid #1e293b',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Brand */}
      <div
        onClick={() => navigateTo('dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
      >
        <div style={{
          backgroundColor: '#2563eb',
          padding: '6px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(37,99,235,0.35)'
        }}>
          <Shield size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              THREATLENS
            </span>
            <span style={{
              fontSize: '0.65rem',
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              color: '#60a5fa',
              padding: '1px 6px',
              borderRadius: '4px',
              fontWeight: 700
            }}>
              AI SOC
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
            ML Network Intrusion Detection
          </p>
        </div>
      </div>

      {/* 4 Main Nav Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        {NAV_ITEMS.map((item) => {
          const active = currentPage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: active ? '#2563eb' : 'transparent',
                border: active ? '1px solid #3b82f6' : '1px solid transparent',
                color: active ? '#ffffff' : '#94a3b8',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.82rem',
                fontWeight: active ? 700 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = '#1e293b';
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
              <Icon size={15} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System Online Status Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '9999px',
        padding: '0.35rem 0.85rem',
        fontSize: '0.74rem',
        fontWeight: 700,
        color: '#10b981'
      }}>
        <div style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: '#10b981',
          boxShadow: '0 0 8px #10b981'
        }} />
        <span>System Online</span>
      </div>
    </header>
  );
}
