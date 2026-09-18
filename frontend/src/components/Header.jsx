import { Radio, Cpu, Home } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import ThemeSwitcher from './ThemeSwitcher';

const PAGE_TITLES = {
  '/dashboard': 'Security Operations Dashboard',
  '/analyzer': 'Network Traffic Analyzer',
  '/alerts': 'SOC Security Alerts',
  '/model': 'Model Performance Analytics',
  '/health': 'Model Health & Drift Monitor',
  '/settings': 'System Settings & Config',
};

export default function Header({ simulation, modelInfo }) {
  const location = useLocation();
  const currentTitle =
    PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/alerts/') ? 'Alert Investigation' : 'Security Operations Center');

  return (
    <header className="h-16 bg-surface-blur backdrop-blur-md border-b border-line px-5 lg:px-7 flex items-center justify-between gap-4 sticky top-0 z-30 min-w-0 w-full shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="text-base font-semibold text-hi truncate">{currentTitle}</h2>
        <span className="hidden sm:inline-block text-[0.68rem] bg-brand-soft text-brand border border-brand-soft px-2.5 py-0.5 rounded-full font-semibold">
          SOC v1.0
        </span>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {simulation?.is_running ? (
          <div className="flex items-center gap-2 bg-warn-soft border border-warn-soft text-warn px-3 py-1.5 rounded-lg text-xs font-semibold">
            <Radio size={13} className="animate-pulse" />
            <span className="hidden sm:inline">LIVE STREAM</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 bg-card border border-line text-muted px-3 py-1.5 rounded-lg text-xs">
            <span className="w-2 h-2 rounded-full bg-card-hover border border-line-strong" />
            <span>STREAM IDLE</span>
          </div>
        )}

        <div className="hidden lg:flex items-center gap-2 bg-card border border-line px-3 py-1.5 rounded-lg text-xs">
          <Cpu size={14} className="text-brand-2" />
          <span className="text-muted">Model:</span>
          <span className="text-hi font-mono font-semibold">
            {modelInfo?.model_version || 'v1.0'}
          </span>
          <span
            className="w-2 h-2 rounded-full ml-0.5"
            style={{ background: modelInfo?.status === 'loaded' ? 'var(--ok)' : 'var(--danger)' }}
          />
        </div>

        <ThemeSwitcher />

        <Link
          to="/"
          title="Back to landing page"
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-card border border-line text-muted hover:text-hi hover:border-line-strong transition-colors"
        >
          <Home size={15} />
        </Link>
      </div>
    </header>
  );
}
