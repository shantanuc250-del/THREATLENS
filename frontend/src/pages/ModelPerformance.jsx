import { useState, useEffect } from 'react';
import { BarChart3, Info } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  AreaChart, Area, PieChart, Pie
} from 'recharts';
import { getModelMetrics } from '../services/api';
import { useThemeTokens } from '../theme/ThemeContext';

const METRIC_EXPLANATIONS = {
  precision: 'Of the traffic predicted as attacks, how much was actually attack traffic? Higher precision = fewer false alarms.',
  recall: 'Of all actual attacks, how many were detected? Higher recall = fewer missed attacks.',
  f1_score: 'Harmonic mean of precision and recall. Balances both concerns.',
  fpr: 'How much normal traffic was incorrectly flagged? Lower FPR = fewer false alarms for analysts.',
  roc_auc: 'Overall model discrimination ability. 1.0 = perfect, 0.5 = random guessing.',
  accuracy: 'Overall correct predictions. Can be misleading with imbalanced classes.',
};

export default function ModelPerformance() {
  const t = useThemeTokens(['brand', 'brand-2', 'line', 'card', 'muted', 'faint', 'hi']);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredMetric, setHoveredMetric] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await getModelMetrics();
        setMetrics(res.data);
      } catch (err) {
        console.error('Metrics error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="loader" /></div>;

  if (!metrics || metrics.error) {
    return (
      <div className="text-center py-16">
        <BarChart3 size={48} className="mx-auto text-faint mb-4" />
        <h2 className="text-xl text-hi mb-2">Model Not Trained</h2>
        <p className="text-muted">Run the training pipeline to generate metrics.</p>
        <pre className="mt-4 bg-surface p-4 rounded-lg text-sm text-body inline-block">
          cd ml && python train.py
        </pre>
      </div>
    );
  }

  const kpis = [
    { label: 'Precision', value: metrics.precision, color: 'cyan', key: 'precision' },
    { label: 'Recall', value: metrics.recall, color: 'green', key: 'recall' },
    { label: 'F1 Score', value: metrics.f1_score, color: 'blue', key: 'f1_score' },
    { label: 'False Positive Rate', value: metrics.fpr, color: 'orange', key: 'fpr', invert: true },
    { label: 'ROC-AUC', value: metrics.roc_auc, color: 'purple', key: 'roc_auc' },
  ];

  const cm = metrics.confusion_matrix;
  const cmData = [
    { name: 'True Negative', value: cm.tn, label: `Normal → Normal\n${cm.tn}` },
    { name: 'False Positive', value: cm.fp, label: `Normal → Attack\n${cm.fp}` },
    { name: 'False Negative', value: cm.fn, label: `Attack → Normal\n${cm.fn}` },
    { name: 'True Positive', value: cm.tp, label: `Attack → Attack\n${cm.tp}` },
  ];

  const classData = metrics.predictions ? [
    { name: 'Normal', actual: metrics.predictions.actual_normal, predicted: metrics.predictions.predicted_normal },
    { name: 'Attack', actual: metrics.predictions.actual_attack, predicted: metrics.predictions.predicted_attack },
  ] : [];

  const featureData = (metrics.feature_importances || []).slice(0, 15);

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hi flex items-center gap-2">
          <BarChart3 size={24} /> Model Performance
        </h1>
        <p className="text-sm text-muted mt-1">
          {metrics.model_version || 'v1.0'} — Evaluated on NSL-KDD test set ({metrics.test_samples?.toLocaleString()} samples)
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className={`kpi-card ${kpi.color} cursor-help`}
            onMouseEnter={() => setHoveredMetric(kpi.key)}
            onMouseLeave={() => setHoveredMetric(null)}
          >
            <p className="text-xs text-muted uppercase tracking-wider">{kpi.label}</p>
            <p className="text-2xl font-bold text-hi mt-1">
              {kpi.invert
                ? `${(kpi.value * 100).toFixed(2)}%`
                : `${(kpi.value * 100).toFixed(1)}%`
              }
            </p>
            {hoveredMetric === kpi.key && (
              <p className="text-[0.65rem] text-faint mt-1 leading-tight">
                {METRIC_EXPLANATIONS[kpi.key]}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-hi mb-4">Confusion Matrix</h3>
          <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
            <div className="text-center text-xs text-faint col-span-2 mb-2">
              <span className="text-muted">Predicted →</span>
            </div>
            {[
              { label: 'True Neg', value: cm.tn, color: 'bg-ok-soft border-ok-soft text-ok' },
              { label: 'False Pos', value: cm.fp, color: 'bg-warn-soft border-warn-soft text-warn' },
              { label: 'False Neg', value: cm.fn, color: 'bg-danger-soft border-danger-soft text-danger' },
              { label: 'True Pos', value: cm.tp, color: 'bg-brand-soft border-brand-soft text-brand' },
            ].map((cell, i) => (
              <div key={i} className={`${cell.color} border rounded-lg p-4 text-center`}>
                <p className="text-xs opacity-70">{cell.label}</p>
                <p className="text-xl font-bold mt-1">{cell.value.toLocaleString()}</p>
              </div>
            ))}
            <div className="col-span-2 flex justify-between text-[0.65rem] text-faint mt-1 px-1">
              <span>Actual Normal ↑</span><span>Actual Attack ↓</span>
            </div>
          </div>
        </div>

        {/* ROC Curve */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-hi mb-4">
            ROC Curve <span className="text-xs text-faint ml-2">AUC = {metrics.roc_auc}</span>
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={metrics.roc_curve || []}>
              <defs>
                <linearGradient id="gradROC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={t.brand} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={t.brand} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.line} />
              <XAxis dataKey="fpr" tick={{fontSize: 10, fill: t.faint}} label={{value: 'False Positive Rate', position: 'bottom', style: {fontSize: 10, fill: t.muted}}} />
              <YAxis tick={{fontSize: 10, fill: t.faint}} label={{value: 'True Positive Rate', angle: -90, position: 'left', style: {fontSize: 10, fill: t.muted}}} />
              <Tooltip contentStyle={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: '10px', fontSize: '11px', color: t.hi }} />
              <Area type="monotone" dataKey="tpr" stroke={t.brand} fill="url(#gradROC)" strokeWidth={2} dot={false} name="TPR" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Class Distribution */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-hi mb-4">Class Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={classData}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.line} />
              <XAxis dataKey="name" tick={{fontSize: 11, fill: t.muted}} />
              <YAxis tick={{fontSize: 10, fill: t.faint}} />
              <Tooltip contentStyle={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: '10px', fontSize: '12px', color: t.hi }} />
              <Bar dataKey="actual" name="Actual" fill={t.brand} radius={[4, 4, 0, 0]} />
              <Bar dataKey="predicted" name="Predicted" fill={t["brand-2"]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Importance */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-hi mb-4">Top Feature Importances</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {featureData.map((fi, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-muted w-44 text-right font-mono truncate" title={fi.feature}>
                  {fi.feature}
                </span>
                <div className="flex-1 bg-surface rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full transition-all bg-brand-gradient"
                    style={{width: `${Math.min(fi.importance * 500, 100)}%`}} />
                </div>
                <span className="text-xs text-faint font-mono w-14 text-right">
                  {(fi.importance * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-[0.65rem] text-faint mt-3 italic">
            Feature importance indicates model-level contribution and does not prove causation.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-brand-soft border border-brand-soft rounded-lg p-4 flex items-start gap-3">
        <Info size={18} className="text-brand shrink-0 mt-0.5" />
        <div className="text-xs text-muted space-y-1">
          <p><strong className="text-body">About these metrics:</strong> All values are calculated from the actual trained model evaluated on the NSL-KDD test set. These are not fabricated values.</p>
          <p>NSL-KDD is a benchmark dataset and may not fully represent modern enterprise network traffic. Real-world performance may differ.</p>
        </div>
      </div>
    </div>
  );
}
