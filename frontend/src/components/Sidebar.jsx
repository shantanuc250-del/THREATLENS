import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Search, Bell, BarChart3, Activity,
  Settings, Shield, Radio, ChevronRight, ChevronLeft
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/analyzer', icon: Search, label: 'Traffic Analyzer' },
  { path: '/alerts', icon: Bell, label: 'Alerts' },
  { path: '/model', icon: BarChart3, label: 'Model Performance' },
  { path: '/health', icon: Activity, label: 'Model Health' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isCollapsed, onToggle, modelInfo, simulation }) {
  const location = useLocation();

  return (
    <aside
      className={`sticky top-0 h-screen flex flex-col bg-surface border-r border-line z-40 select-none transition-all duration-200 ease-in-out ${
        isCollapsed ? 'w-[68px]' : 'w-[250px]'
      }`}
    >
      {/* Header / Logo Section */}
      <div className={`border-b border-line ${isCollapsed ? 'p-3 text-center' : 'p-4 flex items-center justify-between'}`}>
        {!isCollapsed ? (
          <>
            <Link to="/" title="Back to landing page" className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-lg shrink-0">
                <Shield size={18} style={{ color: 'var(--brand-fg)' }} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold tracking-wide text-hi flex items-center gap-1 leading-none">
                  THREAT<span className="text-brand-2">LENS</span>
                </h1>
                <p className="text-[0.6rem] text-muted tracking-wider uppercase font-semibold mt-1 truncate">
                  AI Intrusion Detection
                </p>
              </div>
            </Link>
            <button
              onClick={onToggle}
              title="Collapse sidebar"
              className="p-1.5 rounded-lg bg-card hover:bg-card-hover text-muted hover:text-hi border border-line transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              title="ThreatLens AI NIDS"
              className="w-9 h-9 rounded-lg bg-brand-gradient flex items-center justify-center shadow-lg  cursor-pointer"
              onClick={onToggle}
            >
              <Shield size={20} style={{ color: 'var(--brand-fg)' }} />
            </div>
            <button
              onClick={onToggle}
              title="Expand sidebar"
              className="p-1 rounded-md bg-card hover:bg-card-hover text-muted hover:text-hi border border-line transition-colors mt-1"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Simulation Banner / Indicator */}
      {simulation?.is_running && (
        <div className="relative group">
          {isCollapsed ? (
            <div className="p-3 flex justify-center border-b border-line bg-warn-soft">
              <Radio size={16} className="animate-pulse text-warn" />
              {/* Tooltip on Collapsed Simulation */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center px-3 py-1.5 bg-card text-warn text-xs font-bold rounded-md border border-warn-soft shadow-xl whitespace-nowrap z-50 pointer-events-none">
                SIMULATION STREAM ACTIVE
              </div>
            </div>
          ) : (
            <div className="simulation-banner flex items-center justify-center gap-2">
              <Radio size={14} className="animate-pulse text-warn" />
              <span>SIMULATION MODE</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto space-y-1.5">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || (path === '/alerts' && location.pathname.startsWith('/alerts/'));
          
          if (isCollapsed) {
            return (
              <div key={path} className="relative group flex justify-center">
                <NavLink
                  to={path}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center relative transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-soft text-brand-2 border border-brand-soft shadow-sm '
                      : 'text-muted hover:text-body hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon size={19} className={isActive ? 'text-brand-2' : 'text-muted'} />
                  {label === 'Alerts' && (
                    <span className="w-2.5 h-2.5 bg-danger-dot rounded-full absolute top-1 right-1 border border-surface animate-pulse" />
                  )}
                </NavLink>

                {/* Collapsed Tooltip */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center gap-2 px-3 py-1.5 bg-card text-hi text-xs font-semibold rounded-lg border border-line shadow-2xl whitespace-nowrap z-50 pointer-events-none">
                  <span>{label}</span>
                  {label === 'Alerts' && (
                    <span className="bg-danger-soft text-danger text-[0.65rem] px-1.5 py-0.5 rounded font-bold border border-danger-soft">
                      LIVE
                    </span>
                  )}
                </div>
              </div>
            );
          }

          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-soft text-brand border border-brand-soft shadow-sm '
                  : 'text-muted hover:text-body hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-brand-2' : 'text-muted'} />
              <span className="truncate">{label}</span>
              {label === 'Alerts' && (
                <span className="ml-auto bg-danger-soft text-danger text-[0.65rem] font-bold px-2 py-0.5 rounded-full border border-danger-soft">
                  LIVE
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Model Status Footer */}
      <div className="p-3 border-t border-line bg-app-2">
        {isCollapsed ? (
          <div className="relative group flex flex-col items-center gap-1 cursor-pointer">
            <span className="text-[0.65rem] text-muted font-mono font-semibold">
              {modelInfo?.model_version || 'v1.0'}
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                modelInfo?.status === 'loaded' ? 'bg-ok-dot animate-pulse' : 'bg-danger-dot'
              }`}
            />

            {/* Collapsed Tooltip for Status */}
            <div className="absolute left-full bottom-2 ml-3 hidden group-hover:flex flex-col gap-0.5 px-3 py-2 bg-card text-body text-xs font-semibold rounded-lg border border-line shadow-2xl whitespace-nowrap z-50 pointer-events-none">
              <span className="text-muted">Model Version: {modelInfo?.model_version || 'v1.0'}</span>
              <span className={modelInfo?.status === 'loaded' ? 'text-ok' : 'text-danger'}>
                Status: {modelInfo?.status === 'loaded' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-faint font-medium">Model Engine</span>
              <span className="text-body font-mono">
                {modelInfo?.model_version || 'v1.0'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1.5">
              <span className="text-faint font-medium">Status</span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className={`w-2 h-2 rounded-full ${
                  modelInfo?.status === 'loaded' ? 'bg-ok-dot animate-pulse' : 'bg-danger-dot'
                }`} />
                <span className={modelInfo?.status === 'loaded' ? 'text-ok' : 'text-danger'}>
                  {modelInfo?.status === 'loaded' ? 'Online' : 'Offline'}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
