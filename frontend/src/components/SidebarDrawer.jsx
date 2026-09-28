import React from 'react';
import {
  Shield, X, Home, Activity, Bell, Layers,
  Server, Flame, Cpu, Settings
} from 'lucide-react';
import themeColors from '../utils/themeColors';

const DRAWER_ITEMS = [
  { id: 'landing', label: 'Landing Overview', icon: Home },
  { id: 'dashboard', label: 'SOC Dashboard', icon: Activity },
  { id: 'alerts', label: 'Security Alerts Feed', icon: Bell },
  { id: 'traffic', label: 'Traffic Analyzer & CSV', icon: Layers },
  { id: 'simulate', label: 'Attack Simulator', icon: Server },
  { id: 'risk', label: 'Risk Matrix & Impact', icon: Flame },
  { id: 'health', label: 'Model Health & Drift', icon: Cpu },
  { id: 'settings', label: 'System Configuration', icon: Settings }
];

export default function SidebarDrawer({ isOpen = false, onClose = () => {}, currentPage = 'dashboard', navigateTo = () => {}, theme = 'dark' }) {
  if (!isOpen) return null;
  const c = themeColors(theme);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 50,
        display: 'flex'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-up"
        style={{
          width: '290px',
          backgroundColor: c.isDark ? '#0d1525' : '#ffffff',
          height: '100%',
          borderRight: `1px solid ${c.border}`,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '10px 0 30px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ backgroundColor: '#2563eb', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                <Shield size={16} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: c.textPrimary }}>Navigation Hub</span>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: c.textMuted, cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {DRAWER_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.65rem 0.95rem',
                    borderRadius: '10px',
                    backgroundColor: active
                      ? (c.isDark ? '#0c4a6e' : '#e0f2fe')
                      : 'transparent',
                    border: active
                      ? `1px solid ${c.isDark ? '#0284c7' : '#38bdf8'}`
                      : '1px solid transparent',
                    color: active
                      ? (c.isDark ? '#38bdf8' : '#0369a1')
                      : c.textSecondary,
                    fontSize: '0.85rem',
                    fontWeight: active ? 700 : 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = c.btnSecondaryBg;
                      e.currentTarget.style.color = c.textPrimary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = c.textSecondary;
                    }
                  }}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${c.borderLight}`, paddingTop: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.72rem', color: c.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>NSL-KDD Defense Model</p>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.74rem', color: '#10b981', fontWeight: 700 }}>● Pipeline Status: Online</p>
        </div>
      </div>
    </div>
  );
}
