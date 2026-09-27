import React from 'react';
import {
  Shield, X, Home, Activity, Bell, Layers,
  Server, Flame, Cpu, Settings
} from 'lucide-react';

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

export default function SidebarDrawer({ isOpen = false, onClose = () => {}, currentPage = 'dashboard', navigateTo = () => {} }) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 50,
        display: 'flex'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '280px',
          backgroundColor: '#0d1525',
          height: '100%',
          borderRight: '1px solid #1a263e',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="#06b6d4" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Navigation Hub</span>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={19} />
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
                    gap: '0.65rem',
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '6px',
                    backgroundColor: active ? '#0c4a6e' : '#141f33',
                    border: active ? '1px solid #06b6d4' : '1px solid transparent',
                    color: active ? '#38bdf8' : '#cbd5e1',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1a263e', paddingTop: '0.85rem' }}>
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>NSL-KDD Defense Model</p>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.72rem', color: '#10b981' }}>Pipeline Status: Online</p>
        </div>
      </div>
    </div>
  );
}
