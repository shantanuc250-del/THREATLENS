import React from 'react';
import { ShieldAlert } from 'lucide-react';
import themeColors from '../utils/themeColors';

const RISK_ITEMS = [
  {
    level: 'CRITICAL',
    type: 'SYN Flood / Distributed Denial',
    impact: 'Full web service outages and connection drops across API gateways.',
    mitigation: 'Enable SYN Cookies at OS kernel level; drop unverified three-way handshakes.',
    color: '#ef4444'
  },
  {
    level: 'HIGH',
    type: 'Host & Port Probe Reconnaissance',
    impact: 'Attacker maps internal topology, service versions, and exposed DB ports.',
    mitigation: 'Automated IP rate limiting via iptables; rate-throttle sequential ICMP / TCP FIN scans.',
    color: '#f59e0b'
  },
  {
    level: 'ELEVATED',
    type: 'Root Privilege Escalation Probe',
    impact: 'Unauthorized access to root namespaces and sensitive configuration files.',
    mitigation: 'Rotate SSH credentials; isolate bastion host into zero-trust subnets.',
    color: '#0284c7'
  }
];

export default function RiskMatrix({ theme = 'dark' }) {
  const c = themeColors(theme);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: c.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>Potential Risk & Threat Assessment</h2>
        <p style={{ fontSize: '0.78rem', color: c.textSecondary, margin: '0.2rem 0 0 0' }}>Evaluated vulnerabilities and automated mitigation posture.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {RISK_ITEMS.map((item, idx) => (
          <div
            key={idx}
            className="landing-hover-card"
            style={{
              backgroundColor: c.cardBg,
              border: `1px solid ${item.color}40`,
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              boxShadow: c.shadowSm,
              transition: c.transition
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                backgroundColor: `${item.color}18`,
                color: item.color,
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '9999px',
                border: `1px solid ${item.color}35`,
                letterSpacing: '0.04em'
              }}>
                {item.level}
              </span>
              <ShieldAlert size={18} color={item.color} />
            </div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: c.textPrimary }}>{item.type}</h4>
            <div style={{ fontSize: '0.78rem', color: c.textSecondary, display: 'flex', flexDirection: 'column', gap: '0.4rem', lineHeight: 1.5 }}>
              <p style={{ margin: 0 }}><strong style={{ color: c.strongText }}>Potential Impact:</strong> {item.impact}</p>
              <p style={{ margin: 0 }}><strong style={{ color: c.strongText }}>Automated Defense:</strong> {item.mitigation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
