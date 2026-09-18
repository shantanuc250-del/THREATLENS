import { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { getModelDrift, getModelInfo } from '../services/api';

const STATUS_CONFIG = {
  STABLE: { icon: CheckCircle, color: 'text-ok', bg: 'bg-ok-soft', border: 'border-ok-soft', label: 'Stable' },
  WARNING: { icon: AlertTriangle, color: 'text-warn', bg: 'bg-warn-soft', border: 'border-warn-soft', label: 'Warning' },
  DRIFT_DETECTED: { icon: XCircle, color: 'text-danger', bg: 'bg-danger-soft', border: 'border-danger-soft', label: 'Drift Detected' },
  UNKNOWN: { icon: Activity, color: 'text-muted', bg: 'bg-card-hover', border: 'border-line', label: 'Unknown' },
};

export default function ModelHealth() {
  const [drift, setDrift] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [driftRes, infoRes] = await Promise.all([getModelDrift(), getModelInfo()]);
        setDrift(driftRes.data);
        setModelInfo(infoRes.data);
      } catch (err) {
        console.error('Model health error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="loader" /></div>;

  const status = STATUS_CONFIG[drift?.overall_status] || STATUS_CONFIG.UNKNOWN;
  const StatusIcon = status.icon;

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hi flex items-center gap-2">
          <Activity size={24} /> Model Health
        </h1>
        <p className="text-sm text-muted mt-1">
          Monitor model performance and detect drift over time
        </p>
      </div>

      {/* Status Banner */}
      <div className={`${status.bg} ${status.border} border rounded-xl p-6 flex items-center gap-4`}>
        <StatusIcon size={40} className={status.color} />
        <div>
          <h2 className={`text-xl font-bold ${status.color}`}>
            Model Status: {status.label}
          </h2>
          <p className="text-sm text-muted mt-1">
            {drift?.monitoring_type === 'dataset_based'
              ? 'Simulation / Dataset-based drift monitoring'
              : 'Basic model health monitoring'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Info */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-hi mb-4">Model Information</h3>
          <div className="space-y-3">
            {[
              ['Model Name', modelInfo?.model_name || 'ThreatLens Random Forest'],
              ['Version', modelInfo?.model_version || 'v1.0'],
              ['Dataset', modelInfo?.dataset || 'NSL-KDD'],
              ['Training Date', modelInfo?.training_date ? new Date(modelInfo.training_date).toLocaleString() : 'N/A'],
              ['Training Time', modelInfo?.training_time_seconds ? `${modelInfo.training_time_seconds}s` : 'N/A'],
              ['Features', modelInfo?.n_features || 'N/A'],
              ['Status', modelInfo?.status === 'loaded' ? 'Active' : 'Not Loaded'],
            ].map(([label, value], i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-line">
                <span className="text-xs text-faint">{label}</span>
                <span className="text-sm text-body font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Summary */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-hi mb-4">Current Metrics</h3>
          {modelInfo?.metrics_summary ? (
            <div className="space-y-3">
              {Object.entries(modelInfo.metrics_summary).map(([key, value], i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-line">
                  <span className="text-xs text-faint uppercase">{key.replace('_', ' ')}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-surface rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full ${
                        key === 'fpr'
                          ? value < 0.05 ? 'bg-ok-dot' : value < 0.1 ? 'bg-warn-dot' : 'bg-danger-dot'
                          : value > 0.8 ? 'bg-ok-dot' : value > 0.6 ? 'bg-warn-dot' : 'bg-danger-dot'
                      }`}
                        style={{width: `${Math.min(key === 'fpr' ? (1 - value) * 100 : value * 100, 100)}%`}}
                      />
                    </div>
                    <span className="text-sm text-hi font-mono w-16 text-right">
                      {(value * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-faint">No metrics available</p>
          )}
        </div>

        {/* Drift Details */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-hi mb-4">Feature Distribution Analysis</h3>
          {drift?.feature_details?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>PSI</th>
                    <th>Status</th>
                    <th>Ref. Mean</th>
                    <th>Ref. Std</th>
                  </tr>
                </thead>
                <tbody>
                  {drift.feature_details.map((f, i) => {
                    const fStatus = STATUS_CONFIG[f.status] || STATUS_CONFIG.UNKNOWN;
                    return (
                      <tr key={i}>
                        <td className="font-mono text-xs">{f.feature}</td>
                        <td className="font-mono">{f.psi.toFixed(4)}</td>
                        <td><span className={`badge ${fStatus.bg} ${fStatus.color} border ${fStatus.border}`}>{fStatus.label}</span></td>
                        <td className="font-mono text-xs">{f.reference_mean?.toFixed(4) ?? 'N/A'}</td>
                        <td className="font-mono text-xs">{f.reference_std?.toFixed(4) ?? 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-faint text-center py-8">
              No detailed feature analysis available. Train the model with reference data for drift monitoring.
            </p>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-hi mb-3 flex items-center gap-2">
          <Info size={16} /> Why Monitor Model Health?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted">
          <div>
            <h4 className="text-body font-semibold mb-1">Concept Drift</h4>
            <p>Network behavior changes over time. New attack patterns emerge, traffic patterns shift. A model trained on old data may lose effectiveness.</p>
          </div>
          <div>
            <h4 className="text-body font-semibold mb-1">Data Drift</h4>
            <p>Input feature distributions may change. If incoming traffic differs significantly from training data, predictions become unreliable.</p>
          </div>
          <div>
            <h4 className="text-body font-semibold mb-1">Retraining</h4>
            <p>Regular retraining on recent data helps maintain model accuracy. Monitor metrics and retrain when performance degrades below acceptable thresholds.</p>
          </div>
        </div>
      </div>

      {drift?.note && (
        <div className="bg-warn-soft border border-warn-soft rounded-lg p-3 text-xs text-warn">
          <Info size={14} className="inline mr-2" />
          {drift.note}
        </div>
      )}
    </div>
  );
}
