import React from 'react';
import { ArrowRight, Zap, Upload, Flame } from 'lucide-react';

export default function Landing({ navigateTo }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{
        background: 'linear-gradient(145deg, #0f1c33 0%, #0d1525 100%)',
        border: '1px solid #1f3152',
        borderRadius: '10px',
        padding: '2.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <span style={{
          alignSelf: 'flex-start',
          backgroundColor: 'rgba(6, 182, 212, 0.15)',
          color: '#38bdf8',
          padding: '3px 10px',
          borderRadius: '20px',
          fontSize: '0.72rem',
          fontWeight: 700
        }}>
          NETWORK PERIMETER DEFENSE
        </span>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
          ThreatLens AI Threat Classification Suite
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0, maxWidth: '680px', lineHeight: 1.5 }}>
          Real-time ML packet evaluation, custom CSV batch scanning, live traffic graphs, and adversarial simulation in one dashboard.
        </p>

        <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigateTo('dashboard')}
            style={{
              backgroundColor: '#0284c7',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              padding: '0.6rem 1.2rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            Live Dashboard <ArrowRight size={15} />
          </button>
          <button
            onClick={() => navigateTo('traffic')}
            style={{
              backgroundColor: '#16233b',
              border: '1px solid #283e66',
              borderRadius: '6px',
              color: '#cbd5e1',
              padding: '0.6rem 1.2rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Traffic Analyzer & CSV
          </button>
          <button
            onClick={() => navigateTo('simulate')}
            style={{
              backgroundColor: '#16233b',
              border: '1px solid #283e66',
              borderRadius: '6px',
              color: '#cbd5e1',
              padding: '0.6rem 1.2rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Adversarial Simulator
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {[
          { title: 'Sub-Millisecond Inference', desc: 'Predictive tree and neural ensembles evaluate packets in 1.1ms.', icon: Zap, color: '#38bdf8' },
          { title: 'CSV Bulk Ingestion', desc: 'Drag-and-drop batch network logs to classify whole traffic capture files.', icon: Upload, color: '#10b981' },
          { title: 'Risk & Impact Mapping', desc: 'Automated vulnerability scoring with MITRE ATT&CK mitigation mappings.', icon: Flame, color: '#ef4444' }
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} style={{ backgroundColor: '#0d1525', border: '1px solid #1a263e', borderRadius: '8px', padding: '1.25rem' }}>
              <Icon size={22} color={c.color} style={{ marginBottom: '0.5rem' }} />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 0.3rem 0' }}>{c.title}</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>{c.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
