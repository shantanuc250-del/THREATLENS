import { Activity, ShieldAlert, Radio, Cpu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/': 'Security Operations Dashboard',
  '/analyzer': 'Network Traffic Analyzer',
  '/alerts': 'SOC Security Alerts',
  '/model': 'Model Performance Analytics',
  '/health': 'Model Health & Drift Monitor',
  '/settings': 'System Settings & Config',
};

export default function Header({ simulation, modelInfo }) {
  const location = useLocation();
  const currentTitle = PAGE_TITLES[location.pathname] || 'Security Operations Center';

  return (
    <header className="h-16 bg-[#0d1117]/80 backdrop-blur-md border-b border-[#2a3550] px-6 flex items-center justify-between sticky top-0 z-30 min-w-0 w-full shrink-0">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="text-base font-semibold text-white truncate">
          {currentTitle}
        </h2>
        <span className="hidden sm:inline-block text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-medium">
          SOC v1.0
        </span>
      </div>

      {/* System Status & Actions */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Live Simulation Indicator */}
        {simulation?.is_running ? (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
            <Radio size={13} className="animate-spin" />
            <span>LIVE STREAM ACTIVE</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 text-slate-400 px-3 py-1 rounded-full text-xs">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>STREAM IDLE</span>
          </div>
        )}

        {/* Model Status Badge */}
        <div className="hidden md:flex items-center gap-2 bg-[#1a2235] border border-[#2a3550] px-3 py-1 rounded-lg text-xs">
          <Cpu size={14} className="text-cyan-400" />
          <span className="text-slate-400">Model:</span>
          <span className="text-slate-200 font-mono font-medium">
            {modelInfo?.model_version || 'v1.0'}
          </span>
          <span className={`w-2 h-2 rounded-full ml-1 ${
            modelInfo?.status === 'loaded' ? 'bg-emerald-400' : 'bg-red-400'
          }`} />
        </div>
      </div>
    </header>
  );
}
