import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Info, Shield, Database, Cpu, ExternalLink } from 'lucide-react';
import { getHealth, getModelInfo } from '../services/api';

export default function Settings() {
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
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon size={24} /> System Information
        </h1>
        <p className="text-sm text-slate-400 mt-1">Configuration and system status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Cpu size={16} /> System Status
          </h3>
          <div className="space-y-3">
            {[
              ['API Status', health ? 'Online' : 'Offline', health ? 'text-emerald-400' : 'text-red-400'],
              ['Model Loaded', health?.model_loaded ? 'Yes' : 'No', health?.model_loaded ? 'text-emerald-400' : 'text-red-400'],
              ['API Timestamp', health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A', 'text-slate-300'],
            ].map(([label, value, color], i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#1e293b]">
                <span className="text-xs text-slate-500">{label}</span>
                <span className={`text-sm font-mono ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Model Config */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={16} /> Model Configuration
          </h3>
          <div className="space-y-3">
            {modelInfo?.model_params && Object.entries(modelInfo.model_params).map(([key, val], i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#1e293b]">
                <span className="text-xs text-slate-500">{key}</span>
                <span className="text-sm text-slate-300 font-mono">{val}</span>
              </div>
            ))}
          </div>
          {modelInfo?.notes && (
            <p className="text-[0.65rem] text-slate-600 mt-3 italic">{modelInfo.notes}</p>
          )}
        </div>

        {/* About */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Info size={16} /> About ThreatLens
          </h3>
          <div className="text-sm text-slate-400 space-y-3">
            <p>
              <strong className="text-white">ThreatLens</strong> is an AI-powered Network Intrusion Detection & SOC Alerting Platform.
              It uses machine learning to analyze network traffic patterns and surface potential threats to SOC analysts.
            </p>
            <p className="text-xs italic">
              "See the threats signatures miss."
            </p>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300">
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
                <div key={i} className="bg-[#0d1117] rounded-lg p-3">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-sm text-white font-mono mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
