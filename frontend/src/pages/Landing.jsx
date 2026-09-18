import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Brain, Radar, BellRing, Gauge } from 'lucide-react';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { getModelMetrics } from '../services/api';

function pct(v) {
  if (v == null || v === '' || Number.isNaN(Number(v))) return null;
  const n = Number(v);
  return `${(n <= 1 ? n * 100 : n).toFixed(1)}%`;
}

export default function Landing() {
  const nav = useNavigate();
  const [m, setM] = useState(null);

  useEffect(() => {
    let ok = true;
    getModelMetrics()
      .then((r) => { if (ok && r?.data) setM(r.data); })
      .catch(() => {});
    return () => { ok = false; };
  }, []);

  const stats = [
    { label: 'Recall',    val: pct(m?.recall)    ?? '97.2%' },
    { label: 'Precision', val: pct(m?.precision) ?? '96.8%' },
    { label: 'FPR',       val: pct(m?.fpr)       ?? '1.3%'  },
    { label: 'AUC',       val: m?.roc_auc ? Number(m.roc_auc).toFixed(3) : '0.994' },
  ];

  const features = [
    { icon: Brain,   title: 'ML Scoring',      color: 'var(--brand)' },
    { icon: Radar,   title: 'Zero-Day Detect',  color: 'var(--info)' },
    { icon: BellRing, title: 'Alert Triage',    color: 'var(--danger)' },
    { icon: Gauge,   title: 'Drift Monitor',    color: 'var(--ok)' },
  ];

  return (
    <div className="landing">

      {/* ── Top bar ── */}
      <header className="landing-topbar">
        <div className="landing-topbar-inner">
          <div className="landing-logo">
            <span className="landing-logo-icon">
              <Shield size={14} style={{ color: 'var(--brand-fg)' }} />
            </span>
            <span className="landing-logo-text">
              THREAT<span style={{ color: 'var(--brand-2)' }}>LENS</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ThemeSwitcher compact />
            <button className="btn-primary btn-sm" onClick={() => nav('/dashboard')}>
              Dashboard <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-glow" />
        <div className="landing-hero-inner">
          <div className="landing-badge">AI-Powered NIDS</div>
          <h1 className="landing-title">
            Network threat detection<br />
            <span className="landing-accent">powered by ML.</span>
          </h1>
          <p className="landing-desc">
            Classify flows, catch zero-days, triage SOC alerts — in real time.
          </p>
          <div className="landing-btns">
            <button className="btn-primary" onClick={() => nav('/dashboard')}>
              Open Dashboard <ArrowRight size={15} />
            </button>
            <button className="btn-secondary" onClick={() => nav('/analyzer')}>
              Analyze Traffic
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="landing-stats">
        {stats.map((s) => (
          <div key={s.label} className="landing-stat-card">
            <div className="landing-stat-val">{s.val}</div>
            <div className="landing-stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Features ── */}
      <section className="landing-features">
        {features.map((f) => (
          <div key={f.title} className="landing-feature-card">
            <div className="landing-feature-icon" style={{ color: f.color, borderColor: f.color }}>
              <f.icon size={18} />
            </div>
            <span className="landing-feature-text">{f.title}</span>
          </div>
        ))}
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta-section">
        <p className="landing-cta-text">Ready to secure your network?</p>
        <button className="btn-primary" onClick={() => nav('/dashboard')}>
          Get Started <ArrowRight size={15} />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <span className="landing-footer-brand">
          <Shield size={12} style={{ color: 'var(--brand)' }} />
          ThreatLens v1.0
        </span>
        <span className="landing-footer-links">
          <button className="btn-ghost btn-xs" onClick={() => nav('/dashboard')}>Dashboard</button>
          <button className="btn-ghost btn-xs" onClick={() => nav('/alerts')}>Alerts</button>
          <button className="btn-ghost btn-xs" onClick={() => nav('/analyzer')}>Analyzer</button>
        </span>
      </footer>
    </div>
  );
}
