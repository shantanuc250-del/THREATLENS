import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Search, Bell, BarChart3, Activity,
  Settings, Shield, Radio, ChevronRight, ChevronLeft
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
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
      className={`sticky top-0 h-screen flex flex-col bg-[#0d1117] border-r border-[#2a3550] z-40 select-none transition-all duration-200 ease-in-out ${
        isCollapsed ? 'w-[68px]' : 'w-[250px]'
      }`}
    >
      {/* Header / Logo Section */}
      <div className={`border-b border-[#2a3550] ${isCollapsed ? 'p-3 text-center' : 'p-4 flex items-center justify-between'}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <Shield size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold tracking-wide text-white flex items-center gap-1 leading-none">
                  THREAT<span className="text-cyan-400">LENS</span>
                </h1>
                <p className="text-[0.6rem] text-slate-400 tracking-wider uppercase font-semibold mt-1 truncate">
                  AI Intrusion Detection
                </p>
              </div>
            </div>
            <button
              onClick={onToggle}
              title="Collapse sidebar"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              title="ThreatLens AI NIDS"
              className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 cursor-pointer"
              onClick={onToggle}
            >
              <Shield size={20} className="text-white" />
            </div>
            <button
              onClick={onToggle}
              title="Expand sidebar"
              className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors mt-1"
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
            <div className="p-3 flex justify-center border-b border-[#2a3550] bg-amber-500/10">
              <Radio size={16} className="animate-pulse text-amber-400" />
              {/* Tooltip on Collapsed Simulation */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center px-3 py-1.5 bg-[#1a2235] text-amber-300 text-xs font-bold rounded-md border border-amber-500/30 shadow-xl whitespace-nowrap z-50 pointer-events-none">
                SIMULATION STREAM ACTIVE
              </div>
            </div>
          ) : (
            <div className="simulation-banner flex items-center justify-center gap-2">
              <Radio size={14} className="animate-pulse text-amber-400" />
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
                      ? 'bg-blue-500/20 text-cyan-400 border border-blue-500/40 shadow-sm shadow-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon size={19} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                  {label === 'Alerts' && (
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full absolute top-1 right-1 border border-[#0d1117] animate-pulse" />
                  )}
                </NavLink>

                {/* Collapsed Tooltip */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center gap-2 px-3 py-1.5 bg-[#1a2235] text-slate-100 text-xs font-semibold rounded-lg border border-[#2a3550] shadow-2xl whitespace-nowrap z-50 pointer-events-none">
                  <span>{label}</span>
                  {label === 'Alerts' && (
                    <span className="bg-red-500/20 text-red-400 text-[0.65rem] px-1.5 py-0.5 rounded font-bold border border-red-500/30">
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
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
              <span className="truncate">{label}</span>
              {label === 'Alerts' && (
                <span className="ml-auto bg-red-500/20 text-red-400 text-[0.65rem] font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                  LIVE
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Model Status Footer */}
      <div className="p-3 border-t border-[#2a3550] bg-[#0a0e1a]/50">
        {isCollapsed ? (
          <div className="relative group flex flex-col items-center gap-1 cursor-pointer">
            <span className="text-[0.65rem] text-slate-400 font-mono font-semibold">
              {modelInfo?.model_version || 'v1.0'}
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                modelInfo?.status === 'loaded' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            />

            {/* Collapsed Tooltip for Status */}
            <div className="absolute left-full bottom-2 ml-3 hidden group-hover:flex flex-col gap-0.5 px-3 py-2 bg-[#1a2235] text-slate-200 text-xs font-semibold rounded-lg border border-[#2a3550] shadow-2xl whitespace-nowrap z-50 pointer-events-none">
              <span className="text-slate-400">Model Version: {modelInfo?.model_version || 'v1.0'}</span>
              <span className={modelInfo?.status === 'loaded' ? 'text-emerald-400' : 'text-red-400'}>
                Status: {modelInfo?.status === 'loaded' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Model Engine</span>
              <span className="text-slate-300 font-mono">
                {modelInfo?.model_version || 'v1.0'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1.5">
              <span className="text-slate-500 font-medium">Status</span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className={`w-2 h-2 rounded-full ${
                  modelInfo?.status === 'loaded' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                }`} />
                <span className={modelInfo?.status === 'loaded' ? 'text-emerald-400' : 'text-red-400'}>
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
