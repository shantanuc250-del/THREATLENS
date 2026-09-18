import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Info, Shield, Database, Cpu, ExternalLink, Palette, Check } from 'lucide-react';
import { getHealth, getModelInfo } from '../services/api';
import { useTheme } from '../theme/ThemeContext';

export default function Settings() {
  const { theme, setTheme, themes } = useTheme();
  const [health, setHealth] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [h, m] = await Promise.all([getHealth(), getModelInfo()]);
        setHealth(h.data);
        setModelInfo(m.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, []);

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hi flex items-center gap-2">
          <SettingsIcon size={24} /> System Information
        </h1>
        <p className="text-sm text-muted mt-1">Configuration and system status</p>
      </div>

      {/* Appearance */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-hi mb-1 flex items-center gap-2">
          <Palette size={16} /> Appearance
        </h3>
        <p className="text-xs text-muted mb-4">
          Pick the console palette. Your choice is stored in this browser and applies everywhere, including charts.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {themes.map((th) => {
            const isActive = th.id === theme;
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => setTheme(th.id)}
                aria-pressed={isActive}
                className={`text-left rounded-xl border p-3.5 transition-all ${
                  isActive
                    ? 'border-brand-soft bg-brand-soft'
                    : 'border-line bg-card hover:border-line-strong'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex -space-x-1.5">
                    {th.swatch.map((c, i) => (
                      <span key={i} className="w-5 h-5 rounded-full border border-line" style={{ background: c }} />
                    ))}
                  </span>
                  {isActive && <Check size={15} className="text-brand" />}
                </span>
                <span className={`block mt-2.5 text-sm font-semibold ${isActive ? 'text-brand' : 'text-hi'}`}>
                  {th.label}
                </span>
                <span className="block text-xs text-faint mt-0.5">{th.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-hi mb-4 flex items-center gap-2">
            <Cpu size={16} /> System Status
          </h3>
          <div className="space-y-3">
            {[
              ['API Status', health ? 'Online' : 'Offline', health ? 'text-ok' : 'text-danger'],
              ['Model Loaded', health?.model_loaded ? 'Yes' : 'No', health?.model_loaded ? 'text-ok' : 'text-danger'],
              ['API Timestamp', health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A', 'text-body'],
            ].map(([label, value, color], i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-line">
                <span className="text-xs text-faint">{label}</span>
                <span className={`text-sm font-mono ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Model Config */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-hi mb-4 flex items-center gap-2">
            <Shield size={16} /> Model Configuration
          </h3>
          <div className="space-y-3">
            {modelInfo?.model_params && Object.entries(modelInfo.model_params).map(([key, val], i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-line">
                <span className="text-xs text-faint">{key}</span>
                <span className="text-sm text-body font-mono">{val}</span>
              </div>
            ))}
          </div>
          {modelInfo?.notes && (
            <p className="text-[0.65rem] text-faint mt-3 italic">{modelInfo.notes}</p>
          )}
        </div>

        {/* About */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-hi mb-4 flex items-center gap-2">
            <Info size={16} /> About ThreatLens
          </h3>
          <div className="text-sm text-muted space-y-3">
            <p>
              <strong className="text-hi">ThreatLens</strong> is an AI-powered Network Intrusion Detection & SOC Alerting Platform.
              It uses machine learning to analyze network traffic patterns and surface potential threats to SOC analysts.
            </p>
            <p className="text-xs italic">
              "See the threats signatures miss."
            </p>
            <div className="bg-warn-soft border border-warn-soft rounded-lg p-3 text-xs text-warn">
              <strong>Important:</strong> ThreatLens is a decision-support system. It generates alerts and recommendations.
              It does NOT automatically block traffic, terminate connections, or take offensive actions.
              The final security decision belongs to the human SOC analyst.
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {[
                ['Dataset', 'NSL-KDD'],
                ['Algorithm', 'Random Forest'],
                ['Classification', 'Binary (Normal/Attack)'],
                ['Storage', 'SQLite'],
              ].map(([label, val], i) => (
                <div key={i} className="bg-surface rounded-lg p-3">
                  <p className="text-xs text-faint">{label}</p>
                  <p className="text-sm text-hi font-mono mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
