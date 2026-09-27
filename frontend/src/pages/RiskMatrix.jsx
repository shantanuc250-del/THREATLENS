import React from 'react';
import { ShieldAlert } from 'lucide-react';

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
    color: '#38bdf8'
  }
];

export default function RiskMatrix() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Potential Risk & Threat Assessment</h2>
        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Evaluated vulnerabilities and automated mitigation posture.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {RISK_ITEMS.map((item, idx) => (
          <div key={idx} style={{
            backgroundColor: '#0d1525',
            border: `1px solid ${item.color}40`,
            borderRadius: '8px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                backgroundColor: `${item.color}20`,
                color: item.color,
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {item.level}
              </span>
              <ShieldAlert size={16} color={item.color} />
            </div>
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>{item.type}</h4>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              <p style={{ margin: '0 0 0.35rem 0' }}><strong style={{ color: '#cbd5e1' }}>Potential Impact:</strong> {item.impact}</p>
              <p style={{ margin: 0 }}><strong style={{ color: '#cbd5e1' }}>Automated Defense:</strong> {item.mitigation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
