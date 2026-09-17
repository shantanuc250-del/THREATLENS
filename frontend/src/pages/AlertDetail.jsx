import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, Clock, MapPin, Server, Network,
  Brain, FileText, AlertTriangle, CheckCircle, Info, RefreshCw, Save
} from 'lucide-react';
import { getAlert, updateAlert } from '../services/api';

const STATUS_OPTIONS = [
  { id: 'NEW', label: 'NEW', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { id: 'INVESTIGATING', label: 'INVESTIGATING', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { id: 'RESOLVED', label: 'RESOLVED', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { id: 'FALSE_POSITIVE', label: 'FALSE POSITIVE', color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
];

export default function AlertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchAlert = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAlert(id);
      setAlert(res.data);
      setNotes(res.data.analyst_notes || '');
    } catch (err) {
      console.error('Fetch alert error:', err);
      setError(err.response?.data?.error || 'Unable to load alert details from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlert();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (!alert || saving) return;
    setSaving(true);
    try {
      const res = await updateAlert(id, { status: newStatus });
      setAlert(res.data.alert);
      showFeedback(`Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      console.error('Update status error:', err);
      showFeedback('Failed to update status', true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!alert || saving) return;
    setSaving(true);
    try {
      const res = await updateAlert(id, { analyst_notes: notes });
      setAlert(res.data.alert);
      showFeedback('Analyst notes saved successfully');
    } catch (err) {
      console.error('Save notes error:', err);
      showFeedback('Failed to save notes', true);
    } finally {
      setSaving(false);
    }
  };

  const showFeedback = (msg, isError = false) => {
    setFeedback({ msg, isError });
    setTimeout(() => setFeedback(null), 4000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <div className="loader !w-8 !h-8" />
        <p className="text-sm font-medium">Loading security alert #{id}...</p>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="glass-card p-8 max-w-lg mx-auto my-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-lg font-bold text-white">Alert Not Found</h3>
        <p className="text-sm text-slate-400">
          {error || `Alert #${id} could not be retrieved from the database.`}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button onClick={() => navigate('/alerts')} className="btn-secondary">
            <ArrowLeft size={16} /> Back to Alerts
          </button>
          <button onClick={fetchAlert} className="btn-primary">
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const importances = Array.isArray(alert.feature_importances) ? alert.feature_importances : [];
  const rawFeatures = typeof alert.raw_features === 'object' && alert.raw_features ? alert.raw_features : {};
  const prob = typeof alert.probability === 'number' ? alert.probability : (alert.attack_probability || 0);
  const isAttack = prob > 0.5;

  return (
    <div className="animate-fadeIn space-y-6 w-full max-w-full min-w-0">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2a3550] pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/alerts')} className="btn-secondary px-3 py-2 text-slate-300">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Alerts</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Shield size={20} className="text-cyan-400" />
                Security Alert #{alert.id}
              </h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
              <Clock size={13} />
              <span>Timestamp: {new Date(alert.timestamp).toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className={`badge badge-${alert.severity?.toLowerCase()}`}>
            {alert.severity}
          </span>
          <span className={`badge badge-${alert.status?.toLowerCase().replace('_', '-')}`}>
            {alert.status?.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
          feedback.isError ? 'bg-red-500/15 border border-red-500/30 text-red-300' : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
        }`}>
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Responsive Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] lg:grid-cols-[minmax(0,1fr)_320px] gap-6 w-full min-w-0">
        
        {/* Left Main Content Column */}
        <div className="space-y-6 min-w-0">
          
          {/* Alert Summary Card */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 border-b border-[#2a3550] pb-2.5">
              <Brain size={16} className="text-blue-400" /> Alert ML Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#0d1117] rounded-lg p-3.5 border border-[#2a3550]">
                <p className="text-xs text-slate-400">Prediction</p>
                <p className={`text-lg font-bold mt-1 ${isAttack ? 'text-red-400' : 'text-emerald-400'}`}>
                  {isAttack ? 'ATTACK' : 'NORMAL'}
                </p>
              </div>

              <div className="bg-[#0d1117] rounded-lg p-3.5 border border-[#2a3550]">
                <p className="text-xs text-slate-400">Attack Probability</p>
                <p className={`text-lg font-bold mt-1 font-mono ${
                  prob > 0.85 ? 'text-red-400' : prob > 0.6 ? 'text-amber-400' : 'text-blue-400'
                }`}>
                  {(prob * 100).toFixed(1)}%
                </p>
              </div>

              <div className="bg-[#0d1117] rounded-lg p-3.5 border border-[#2a3550]">
                <p className="text-xs text-slate-400">Attack Type</p>
                <p className="text-sm font-semibold text-slate-200 mt-1 truncate">
                  {alert.attack_type || alert.category || 'Attack (Binary)'}
                </p>
              </div>

              <div className="bg-[#0d1117] rounded-lg p-3.5 border border-[#2a3550]">
                <p className="text-xs text-slate-400">Model Version</p>
                <p className="text-sm font-mono text-cyan-400 mt-1">
                  {alert.model_version || 'v1.0'}
                </p>
              </div>
            </div>
          </div>

          {/* Traffic Information Card */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 border-b border-[#2a3550] pb-2.5">
              <Network size={16} className="text-cyan-400" /> Traffic Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0d1117] p-3 rounded-lg border border-[#2a3550]">
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin size={12} className="text-slate-500" /> Source IP
                </p>
                <p className="text-sm text-white font-mono font-medium mt-1 truncate">
                  {alert.source_ip || rawFeatures.src_ip || '192.168.1.105'}
                </p>
              </div>

              <div className="bg-[#0d1117] p-3 rounded-lg border border-[#2a3550]">
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Server size={12} className="text-slate-500" /> Destination IP
                </p>
                <p className="text-sm text-white font-mono font-medium mt-1 truncate">
                  {alert.destination_ip || rawFeatures.dst_ip || '10.0.0.1'}
                </p>
              </div>

              <div className="bg-[#0d1117] p-3 rounded-lg border border-[#2a3550]">
                <p className="text-xs text-slate-400">Protocol</p>
                <p className="text-sm text-cyan-300 font-mono font-semibold mt-1 uppercase">
                  {alert.protocol || rawFeatures.protocol_type || 'tcp'}
                </p>
              </div>

              <div className="bg-[#0d1117] p-3 rounded-lg border border-[#2a3550]">
                <p className="text-xs text-slate-400">Service</p>
                <p className="text-sm text-slate-200 font-mono mt-1">
                  {alert.service || rawFeatures.service || 'http'}
                </p>
              </div>

              <div className="bg-[#0d1117] p-3 rounded-lg border border-[#2a3550]">
                <p className="text-xs text-slate-400">Duration</p>
                <p className="text-sm text-slate-200 font-mono mt-1">
                  {rawFeatures.duration ?? alert.duration ?? 0} s
                </p>
              </div>

              <div className="bg-[#0d1117] p-3 rounded-lg border border-[#2a3550]">
                <p className="text-xs text-slate-400">Source Bytes</p>
                <p className="text-sm text-slate-200 font-mono mt-1">
                  {rawFeatures.src_bytes ?? alert.src_bytes ?? 0} B
                </p>
              </div>

              <div className="bg-[#0d1117] p-3 rounded-lg border border-[#2a3550]">
                <p className="text-xs text-slate-400">Destination Bytes</p>
                <p className="text-sm text-slate-200 font-mono mt-1">
                  {rawFeatures.dst_bytes ?? alert.dst_bytes ?? 0} B
                </p>
              </div>

              <div className="bg-[#0d1117] p-3 rounded-lg border border-[#2a3550]">
                <p className="text-xs text-slate-400">Connection Count</p>
                <p className="text-sm text-slate-200 font-mono mt-1">
                  {rawFeatures.count ?? alert.count ?? 1}
                </p>
              </div>
            </div>
          </div>

          {/* Model Feature Importance / Flag Reason Breakdown */}
          {importances.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Brain size={16} className="text-purple-400" /> Model Feature Importance Breakdown
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Top network traffic features that contributed to this model prediction decision.
              </p>
              <div className="space-y-2.5">
                {importances.slice(0, 8).map((fi, i) => {
                  const pct = Math.min(Math.max((fi.importance || 0) * 100, 1), 100);
                  return (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className="text-slate-300 w-36 sm:w-44 text-right font-mono truncate shrink-0">
                        {fi.feature}
                      </span>
                      <div className="flex-1 bg-[#0d1117] rounded-full h-2 overflow-hidden border border-[#2a3550]">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-slate-400 font-mono w-14 text-right shrink-0">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Disclaimer Banner */}
          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
            <Info size={16} className="mt-0.5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold">Notice on ML Detection Rules:</p>
              <p className="text-slate-400 mt-0.5">
                Machine Learning predictions are probabilistic and provide decision support. Severity is derived from attack probability. All final triage and response decisions remain with the SOC analyst.
              </p>
            </div>
          </div>

          {/* Raw Features Table/Grid */}
          {Object.keys(rawFeatures).length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-3">All Raw Network Features</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {Object.entries(rawFeatures).map(([k, v]) => (
                  <div key={k} className="bg-[#0d1117] p-2.5 rounded border border-[#2a3550]">
                    <p className="text-[0.65rem] text-slate-500 truncate" title={k}>{k}</p>
                    <p className="text-xs font-mono text-slate-200 truncate mt-0.5">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Analyst Workflow Panel */}
        <div className="space-y-6 min-w-0">
          
          {/* Analyst Workflow Container */}
          <div className="glass-card p-5 sticky top-20">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-[#2a3550] pb-2.5">
              <FileText size={16} className="text-blue-400" /> 📄 Analyst Workflow
            </h3>

            {/* Status Selector */}
            <div className="space-y-2 mb-6">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Triage Status
              </label>
              {STATUS_OPTIONS.map(opt => {
                const isSelected = alert.status === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleStatusChange(opt.id)}
                    disabled={saving}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between border ${
                      isSelected
                        ? `${opt.color} shadow-sm`
                        : 'bg-[#0d1117] text-slate-400 border-[#2a3550] hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-current' : 'bg-slate-600'}`} />
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && <CheckCircle size={14} className="shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Recommended Action Card */}
            <div className="bg-[#0d1117] border border-amber-500/30 rounded-lg p-4 mb-6">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Recommended Action
              </h4>
              <p className="text-sm font-bold text-amber-400">
                {prob > 0.85 ? 'Immediate Investigation Required' : prob > 0.5 ? 'Triage & Monitor Connection' : 'No Action Required'}
              </p>
              <p className="text-[0.7rem] text-slate-500 mt-2 leading-relaxed">
                This is an automated recommendation based on attack probability. The final response decision belongs to the SOC analyst.
              </p>
            </div>

            {/* Analyst Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Analyst Notes
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={5}
                className="input-field resize-none text-xs font-sans mb-3 bg-[#0d1117] focus:bg-[#0a0e1a]"
                placeholder="Add investigation notes, findings, or disposition comments..."
              />
              <button
                onClick={handleSaveNotes}
                disabled={saving}
                className="btn-primary w-full justify-center text-xs py-2.5 font-semibold"
              >
                {saving ? (
                  <>
                    <div className="loader !w-3.5 !h-3.5" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save Notes
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
