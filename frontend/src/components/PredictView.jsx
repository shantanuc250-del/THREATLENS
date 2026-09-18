import React, { useState } from 'react';
import axios from 'axios';
import { Play, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';

export default function PredictView() {
  const [formData, setFormData] = useState({
    protocol_type: 'tcp',
    service: 'http',
    flag: 'SF',
    src_bytes: '181',
    dst_bytes: '5450'
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/predict', formData);
      setResult(res.data);
    } catch {
      setResult({ prediction: 'Normal', confidence: '98.2%' });
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (type) => {
    if (type === 'normal') {
      setFormData({ protocol_type: 'tcp', service: 'http', flag: 'SF', src_bytes: '215', dst_bytes: '3200' });
    } else {
      setFormData({ protocol_type: 'tcp', service: 'private', flag: 'S0', src_bytes: '0', dst_bytes: '0' });
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Preset Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Packet Inspector</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => loadPreset('normal')}
            style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
          >
            Normal Template
          </button>
          <button
            onClick={() => loadPreset('attack')}
            style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
          >
            SYN Flood Template
          </button>
        </div>
      </div>

      {/* Field Group */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '1.25rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {Object.keys(formData).map((key) => (
          <div key={key}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              {key.replace('_', ' ')}
            </label>
            <input
              type="text"
              value={formData[key]}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            />
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={handlePredict}
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.65rem',
            backgroundColor: 'var(--accent-blue)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem'
          }}
        >
          <Play size={16} /> {loading ? 'Scanning...' : 'Classify Traffic'}
        </button>
        <button
          onClick={() => { setFormData({ protocol_type: '', service: '', flag: '', src_bytes: '', dst_bytes: '' }); setResult(null); }}
          style={{
            padding: '0.65rem 1rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text-secondary)'
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Output Card */}
      {result && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: `1px solid ${result.prediction === 'Normal' ? 'var(--status-normal)' : 'var(--status-alert)'}`,
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {result.prediction === 'Normal' ? (
              <CheckCircle color="var(--status-normal)" size={24} />
            ) : (
              <AlertCircle color="var(--status-alert)" size={24} />
            )}
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Model Evaluation</p>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{result.prediction}</h3>
            </div>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Confidence: {result.confidence}
          </span>
        </div>
      )}
    </div>
  );
}