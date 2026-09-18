import { useState, useRef } from 'react';
import {
  Upload, FileText, Search, Download, AlertTriangle, CheckCircle, Send, RefreshCw
} from 'lucide-react';
import { analyzeCSV, predictSingle } from '../services/api';

const QUICK_FILL_PRESETS = {
  normal: {
    duration: 0, protocol_type: 'tcp', service: 'http', flag: 'SF',
    src_bytes: 215, dst_bytes: 45076, land: 0, wrong_fragment: 0,
    urgent: 0, hot: 0, num_failed_logins: 0, logged_in: 1,
    num_compromised: 0, root_shell: 0, su_attempted: 0, num_root: 0,
    num_file_creations: 0, num_shells: 0, num_access_files: 0,
    num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0,
    count: 8, srv_count: 8, serror_rate: 0, srv_serror_rate: 0,
    rerror_rate: 0, srv_rerror_rate: 0, same_srv_rate: 1, diff_srv_rate: 0,
    srv_diff_host_rate: 0, dst_host_count: 9, dst_host_srv_count: 9,
    dst_host_same_srv_rate: 1, dst_host_diff_srv_rate: 0,
    dst_host_same_src_port_rate: 0.11, dst_host_srv_diff_host_rate: 0,
    dst_host_serror_rate: 0, dst_host_srv_serror_rate: 0,
    dst_host_rerror_rate: 0, dst_host_srv_rerror_rate: 0,
  },
  suspicious: {
    duration: 0, protocol_type: 'tcp', service: 'http', flag: 'REJ',
    src_bytes: 0, dst_bytes: 0, land: 0, wrong_fragment: 0,
    urgent: 0, hot: 0, num_failed_logins: 0, logged_in: 0,
    num_compromised: 0, root_shell: 0, su_attempted: 0, num_root: 0,
    num_file_creations: 0, num_shells: 0, num_access_files: 0,
    num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0,
    count: 511, srv_count: 511, serror_rate: 0, srv_serror_rate: 0,
    rerror_rate: 1, srv_rerror_rate: 1, same_srv_rate: 1, diff_srv_rate: 0,
    srv_diff_host_rate: 0, dst_host_count: 255, dst_host_srv_count: 255,
    dst_host_same_srv_rate: 1, dst_host_diff_srv_rate: 0,
    dst_host_same_src_port_rate: 1, dst_host_srv_diff_host_rate: 0,
    dst_host_serror_rate: 0, dst_host_srv_serror_rate: 0,
    dst_host_rerror_rate: 1, dst_host_srv_rerror_rate: 1,
  },
};

export default function TrafficAnalyzer() {
  const [tab, setTab] = useState('csv');
  const [csvFile, setCsvFile] = useState(null);
  const [csvResults, setCsvResults] = useState(null);
  const [singleForm, setSingleForm] = useState(QUICK_FILL_PRESETS.normal);
  const [singleResult, setSingleResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleCSVUpload = async () => {
    if (!csvFile) return;
    setLoading(true); setError(''); setCsvResults(null);
    try {
      const res = await analyzeCSV(csvFile);
      setCsvResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Check CSV structure.');
    } finally {
      setLoading(false);
    }
  };

  const handleSinglePredict = async () => {
    setLoading(true); setError(''); setSingleResult(null);
    try {
      const res = await predictSingle(singleForm);
      setSingleResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setSingleForm(f => ({...f, [field]: value}));
  };

  const numericFields = [
    'duration', 'src_bytes', 'dst_bytes', 'land', 'wrong_fragment', 'urgent',
    'hot', 'num_failed_logins', 'logged_in', 'num_compromised', 'root_shell',
    'su_attempted', 'num_root', 'num_file_creations', 'num_shells',
    'num_access_files', 'num_outbound_cmds', 'is_host_login', 'is_guest_login',
    'count', 'srv_count', 'serror_rate', 'srv_serror_rate', 'rerror_rate',
    'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate', 'srv_diff_host_rate',
    'dst_host_count', 'dst_host_srv_count', 'dst_host_same_srv_rate',
    'dst_host_diff_srv_rate', 'dst_host_same_src_port_rate',
    'dst_host_srv_diff_host_rate', 'dst_host_serror_rate',
    'dst_host_srv_serror_rate', 'dst_host_rerror_rate', 'dst_host_srv_rerror_rate',
  ];

  return (
    <div className="animate-fadeIn space-y-6 w-full max-w-full min-w-0">
      {/* Header */}
      <div className="border-b border-line pb-4">
        <h1 className="text-xl font-bold text-hi tracking-tight flex items-center gap-2">
          <Search size={22} className="text-brand-2" /> Network Traffic Analyzer
        </h1>
        <p className="text-xs text-muted mt-1">
          Perform batch CSV traffic classification or inspect single network connection telemetry.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex gap-2 bg-surface p-1.5 rounded-lg border border-line w-fit">
        <button
          onClick={() => setTab('csv')}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
            tab === 'csv'
              ? 'bg-brand-soft text-brand border border-brand-soft shadow-sm'
              : 'text-muted hover:text-body'
          }`}
        >
          CSV Batch Upload
        </button>
        <button
          onClick={() => setTab('single')}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
            tab === 'single'
              ? 'bg-brand-soft text-brand border border-brand-soft shadow-sm'
              : 'text-muted hover:text-body'
          }`}
        >
          Manual Single Entry
        </button>
      </div>

      {error && (
        <div className="p-3 bg-danger-soft border border-danger-soft rounded-lg text-xs font-semibold text-danger">
          {error}
        </div>
      )}

      {/* CSV Batch Upload Tab */}
      {tab === 'csv' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-line rounded-xl p-8 text-center cursor-pointer hover:border-line-strong transition-colors bg-app-2"
            >
              <Upload size={36} className="mx-auto text-muted mb-3" />
              <p className="text-sm text-body font-semibold">
                {csvFile ? csvFile.name : 'Click or drop network traffic CSV file'}
              </p>
              <p className="text-xs text-faint mt-1">
                Supports NSL-KDD dataset format or CSV with network telemetry columns.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={e => setCsvFile(e.target.files[0])}
              />
            </div>
            {csvFile && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-xs text-body font-mono">
                  <FileText size={16} className="text-brand" />
                  {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                </div>
                <button onClick={handleCSVUpload} disabled={loading} className="btn-primary text-xs py-2">
                  {loading ? <><div className="loader !w-3.5 !h-3.5" /> Analyzing...</> : <><Search size={14} /> Analyze Batch</>}
                </button>
              </div>
            )}
          </div>

          {/* Batch CSV Results */}
          {csvResults && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Records', value: csvResults.summary.total_records, color: 'blue' },
                  { label: 'Normal Traffic', value: csvResults.summary.normal, color: 'green' },
                  { label: 'Attack Flagged', value: csvResults.summary.attack, color: 'red' },
                  { label: 'Attack Percentage', value: `${csvResults.summary.attack_percentage}%`, color: 'orange' },
                ].map((kpi, i) => (
                  <div key={i} className={`kpi-card ${kpi.color}`}>
                    <p className="text-xs text-muted uppercase font-medium">{kpi.label}</p>
                    <p className="text-2xl font-bold text-hi mt-1">{kpi.value}</p>
                  </div>
                ))}
              </div>

              <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-line flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-hi">
                    Prediction Summary Results {csvResults.truncated && <span className="text-xs text-faint ml-2">(showing top 500)</span>}
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="data-table w-full min-w-[700px]">
                    <thead>
                      <tr>
                        <th>Protocol</th><th>Service</th><th>Duration</th>
                        <th>Src Bytes</th><th>Dst Bytes</th>
                        <th>Prediction</th><th>Probability</th><th>Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvResults.results.map((r, i) => (
                        <tr key={i}>
                          <td className="uppercase font-mono text-xs">{r.protocol}</td>
                          <td className="font-mono text-xs">{r.service}</td>
                          <td className="font-mono text-xs">{r.duration}</td>
                          <td className="font-mono text-xs">{r.src_bytes}</td>
                          <td className="font-mono text-xs">{r.dst_bytes}</td>
                          <td>
                            <span className={r.prediction === 1 ? 'text-danger font-bold text-xs' : 'text-ok font-bold text-xs'}>
                              {r.label}
                            </span>
                          </td>
                          <td className="font-mono text-xs">{(r.attack_probability * 100).toFixed(1)}%</td>
                          <td>
                            {r.severity !== 'NONE' &&
                              <span className={`badge badge-${r.severity?.toLowerCase()}`}>{r.severity}</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Single Entry Tab */}
      {tab === 'single' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-surface p-3 rounded-lg border border-line">
            <span className="text-xs text-muted font-medium">Telemetry Presets:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSingleForm(QUICK_FILL_PRESETS.normal)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Load Normal Pattern
              </button>
              <button
                onClick={() => setSingleForm(QUICK_FILL_PRESETS.suspicious)}
                className="btn-secondary text-xs px-3 py-1.5 text-warn hover:text-warn"
              >
                Load Attack Pattern
              </button>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-hi mb-4 border-b border-line pb-2">
              Categorical Network Parameters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                ['protocol_type', ['tcp', 'udp', 'icmp']],
                ['service', ['http', 'smtp', 'ftp', 'ftp_data', 'ssh', 'telnet', 'private', 'other']],
                ['flag', ['SF', 'S0', 'REJ', 'RSTR', 'RSTO', 'S1', 'S2', 'S3', 'OTH', 'SH']]
              ].map(([field, opts]) => (
                <div key={field}>
                  <label className="text-xs text-muted block mb-1 font-medium">{field}</label>
                  <select
                    className="input-field text-xs bg-surface"
                    value={singleForm[field] || ''}
                    onChange={e => updateField(field, e.target.value)}
                  >
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-hi mb-4 border-b border-line pb-2">
              Continuous Telemetry Features
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {numericFields.map(field => (
                <div key={field}>
                  <label className="text-[0.65rem] text-muted block mb-1 truncate font-mono" title={field}>
                    {field}
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="input-field text-xs font-mono bg-surface py-1 px-2"
                    value={singleForm[field] ?? 0}
                    onChange={e => updateField(field, parseFloat(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={handleSinglePredict} disabled={loading} className="btn-primary text-xs py-2.5 px-5 font-bold">
                {loading ? <><div className="loader !w-3.5 !h-3.5" /> Classifying...</> : <><Send size={14} /> Run Prediction</>}
              </button>
            </div>
          </div>

          {/* Single Prediction Output Result */}
          {singleResult && (
            <div className="glass-card p-6 space-y-4 border-l-4 border-l-brand">
              <h3 className="text-sm font-semibold text-hi border-b border-line pb-2">
                ML Inference Output
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface p-3.5 rounded-lg border border-line text-center">
                  <p className="text-xs text-muted">Class Label</p>
                  <p className={`text-xl font-bold mt-1 ${singleResult.prediction === 1 ? 'text-danger' : 'text-ok'}`}>
                    {singleResult.label}
                  </p>
                </div>

                <div className="bg-surface p-3.5 rounded-lg border border-line text-center">
                  <p className="text-xs text-muted">Attack Probability</p>
                  <p className="text-xl font-bold text-hi font-mono mt-1">
                    {(singleResult.attack_probability * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="bg-surface p-3.5 rounded-lg border border-line text-center">
                  <p className="text-xs text-muted">Derived Severity</p>
                  <div className="mt-1">
                    <span className={`badge badge-${singleResult.severity?.toLowerCase()}`}>
                      {singleResult.severity}
                    </span>
                  </div>
                </div>

                <div className="bg-surface p-3.5 rounded-lg border border-line text-center">
                  <p className="text-xs text-muted">Recommended Disposition</p>
                  <p className="text-xs font-bold text-warn mt-1">
                    {singleResult.prediction === 1 ? 'SOC INVESTIGATION REQUIRED' : 'No Action Required'}
                  </p>
                </div>
              </div>

              {singleResult.feature_importances?.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                    Key Influential Features
                  </h4>
                  <div className="space-y-2">
                    {singleResult.feature_importances.slice(0, 6).map((fi, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <span className="text-body w-36 text-right font-mono truncate">{fi.feature}</span>
                        <div className="flex-1 bg-surface rounded-full h-2 border border-line overflow-hidden">
                          <div
                            className="h-full bg-brand-gradient rounded-full"
                            style={{ width: `${Math.min(fi.importance * 400, 100)}%` }}
                          />
                        </div>
                        <span className="text-muted font-mono w-12 text-right">
                          {(fi.importance * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
