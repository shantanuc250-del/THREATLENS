import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, Zap, Upload, Flame, Shield, Activity,
  Terminal, BarChart3, Search, Radio, Lock, Bug, Network, Cpu
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Threat Library data - Verified & Reliable High-Res Images          */
/* ------------------------------------------------------------------ */
const THREAT_VECTORS = [
  {
    id: 1,
    title: 'SYN Flood Vector',
    tag: 'DoS',
    category: 'dos',
    desc: 'High-frequency TCP SYN packet flood targeting port 80/443 to exhaust server socket buffer pools and degrade upstream availability.',
    img: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    color: '#ef4444'
  },
  {
    id: 2,
    title: 'Port Sweep Probe',
    tag: 'Probe',
    category: 'probe',
    desc: 'Sequential SYN-ACK reconnaissance scanning across 1-65535 port ranges to identify accessible service listeners and open endpoints.',
    img: 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=800&q=80',
    color: '#f59e0b'
  },
  {
    id: 3,
    title: 'Privilege Escalation',
    tag: 'U2R',
    category: 'u2r',
    desc: 'Local root compromise signature exploiting buffer overflow in userland processes to gain elevated kernel-level access.',
    img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    color: '#8b5cf6'
  },
  {
    id: 4,
    title: 'SSH Brute Force',
    tag: 'R2L',
    category: 'r2l',
    desc: 'Credential stuffing attack iterating dictionary and rainbow table payloads against SSH port 22 to gain unauthorized remote shell access.',
    img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    color: '#06b6d4'
  },
  {
    id: 5,
    title: 'DNS Amplification',
    tag: 'DoS',
    category: 'dos',
    desc: 'Reflection-based volumetric attack leveraging open DNS resolvers to amplify traffic volume by 50-70x against victim infrastructure.',
    img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    color: '#ef4444'
  },
  {
    id: 6,
    title: 'Network Topology Sweep',
    tag: 'Probe',
    category: 'probe',
    desc: 'TCP packets with FIN, URG, and PSH flags set simultaneously to fingerprint OS and firewall rule configurations on target hosts.',
    img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    color: '#f59e0b'
  }
];

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'dos', label: 'DoS Flood' },
  { id: 'probe', label: 'Probe & Sweep' },
  { id: 'r2l', label: 'R2L Vectors' },
  { id: 'u2r', label: 'U2R Escalation' }
];

/* ------------------------------------------------------------------ */
/* Capabilities 2-Column Showcase Data                                 */
/* ------------------------------------------------------------------ */
const CAPABILITIES = [
  {
    badge: 'INGRESS FLOW INSPECTION',
    title: 'Live Packet Flow Inspection',
    desc: 'Deep packet inspection parses every ingress flow header in real time — protocol types, TCP control flags, payload byte counts, and connection rate anomalies. Automated multi-class ML classification triggers edge mitigation rules before malicious streams breach the perimeter.',
    action: 'Inspect Traffic',
    target: 'traffic',
    img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80',
    color: '#2563eb',
    icon: Network,
    metric: '1.14ms Latency'
  },
  {
    badge: 'ADVERSARIAL ATTACK SIMULATOR',
    title: 'Adversarial Attack Simulator',
    desc: 'Stress test perimeter firewall triggers and IDS detection rules with multi-vector synthetic assault pipelines. Generate high-frequency SYN floods, sequential port sweep probes, and remote-to-local privilege escalations while streaming live terminal logs to the SOC.',
    action: 'Launch Simulator',
    target: 'simulate',
    img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1000&q=80',
    color: '#06b6d4',
    icon: Terminal,
    metric: '3 Attack Vectors'
  },
  {
    badge: 'REAL-TIME TELEMETRY & ML DRIFT',
    title: 'Model Drift & Health Telemetry',
    desc: 'Continuously track model inference confidence, precision, recall, and prediction latency against the NSL-KDD defense corpus. Automated Kolmogorov-Smirnov distribution tests detect feature drift and statistical variance before classification degradation occurs in production.',
    action: 'Check Health',
    target: 'health',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80',
    color: '#10b981',
    icon: Cpu,
    metric: '99.28% Accuracy'
  }
];

/* ------------------------------------------------------------------ */
/* Intersection Observer hook for scroll-triggered animations          */
/* ------------------------------------------------------------------ */
function useInView(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1, ...options }
    );
    const current = ref.current;
    if (current) observer.observe(current);
    return () => { if (current) observer.unobserve(current); };
  }, []);

  return [ref, isVisible];
}

/* ------------------------------------------------------------------ */
/* Landing Component                                                   */
/* ------------------------------------------------------------------ */
export default function Landing({ navigateTo = () => {}, theme = 'dark' }) {
  const isDark = theme === 'dark';
  const [activeFilter, setActiveFilter] = useState('all');

  const [heroRef, heroVisible] = useInView();
  const [capRef, capVisible] = useInView();
  const [threatRef, threatVisible] = useInView();

  const filteredThreats = activeFilter === 'all'
    ? THREAT_VECTORS
    : THREAT_VECTORS.filter((t) => t.category === activeFilter);

  const scrollToThreats = () => {
    const el = document.getElementById('threat-library');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  /* ---- Locked Dark Cyber-Defense SOC Palette ---- */
  const cardBg = '#0d1628';
  const cardBorder = '#1a263e';
  const textPrimary = '#f8fafc';
  const textSecondary = '#94a3b8';
  const textMuted = '#64748b';
  const sectionBg = '#070b14';

  return (
    <div style={{ width: '100%', backgroundColor: sectionBg, color: textPrimary }}>
      {/* ============================================================
          HERO SECTION (Luminous Global Satellite Earth at Night)
          ============================================================ */}
      <section
        ref={heroRef}
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6.5rem 1.5rem 5.5rem',
          textAlign: 'center'
        }}
      >
        {/* High-Resolution Glowing Orbital Earth-at-Night Photography */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          <img
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=80"
            alt="Global Network Earth at Night"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              opacity: 0.88,
              filter: 'contrast(130%) brightness(120%)'
            }}
          />
        </div>

        {/* Dual-Gradient Scrim ONLY at top and bottom to leave radiant center Earth visible */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background: 'linear-gradient(180deg, rgba(7, 11, 20, 0.45) 0%, rgba(7, 11, 20, 0.12) 30%, rgba(7, 11, 20, 0.35) 70%, #070b14 100%)'
          }}
        />

        {/* Electric Blue Radial Glow Behind Content */}
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40rem',
          height: '24rem',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.24), transparent 70%)',
          filter: 'blur(75px)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '52rem', margin: '0 auto' }}>
          {/* Badge */}
          <div
            className={heroVisible ? 'animate-slide-up' : ''}
            style={{ opacity: heroVisible ? undefined : 0 }}
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#3fc1f9',
              padding: '0.35rem 0.95rem',
              borderRadius: '9999px',
              border: '1px solid rgba(56,189,248,0.4)',
              background: 'rgba(7,11,20,0.85)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              marginBottom: '1.35rem'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#06b6d4', display: 'inline-block' }} />
              NETWORK PERIMETER DEFENSE · REAL-TIME IDS
            </span>
          </div>

          {/* Headline with Heavy Text Shadow for Perfect Readability over Earth Lights */}
          <h1
            className={heroVisible ? 'animate-slide-up-d1' : ''}
            style={{
              opacity: heroVisible ? undefined : 0,
              fontSize: 'clamp(2rem, 5vw, 3.4rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: textPrimary,
              margin: '0 0 1.25rem 0',
              textShadow: '0 2px 10px rgba(8, 91, 175, 0.45), 0 2px 2000000px rgba(8, 91, 175, 0.45)'
            }}
          >
            Securing the perimeter,{' '}
            <span style={{
              background: 'linear-gradient(100deg, #00aeff 0%, #00aeff 0%, #00aeff 0%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              filter: 'drop-shadow(0 2px 14px rgba(6,182,212,0.4))'
            }}>
              one packet at a time
            </span>
          </h1>

          {/* Sub-headline */}
          <p
            className={heroVisible ? 'animate-slide-up-d2' : ''}
            style={{
              opacity: heroVisible ? undefined : 0,
              fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)',
              color: '#e2e8f0',
              margin: '0 auto 2.25rem auto',
              maxWidth: '38rem',
              lineHeight: 1.6,
              fontWeight: 500,
              textShadow: '0 2px 14px rgba(0,0,0,0.95)'
            }}
          >
            AI-driven network intrusion triage, live packet capture inspection,
            and adversarial simulation suite built on NSL-KDD benchmark telemetry.
          </p>

          {/* CTA Buttons */}
          <div
            className={heroVisible ? 'animate-slide-up-d3' : ''}
            style={{
              opacity: heroVisible ? undefined : 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.85rem',
              flexWrap: 'wrap'
            }}
          >
            <button
              onClick={() => navigateTo('dashboard')}
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                padding: '0.8rem 1.8rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                cursor: 'pointer',
                boxShadow: '0 6px 24px -4px rgba(37,99,235,0.5)',
                transition: 'transform 0.2s ease, filter 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'none'; }}
            >
              Launch SOC Console <ArrowRight size={17} />
            </button>
            <button
              onClick={scrollToThreats}
              style={{
                background: 'rgba(13, 22, 40, 0.85)',
                border: '1px solid rgba(56,189,248,0.3)',
                borderRadius: '12px',
                color: textPrimary,
                padding: '0.8rem 1.8rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#2563eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'; }}
            >
              Explore Attack Library
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          STATS STRIP
          ============================================================ */}
      <div style={{
        borderTop: `1px solid ${cardBorder}`,
        borderBottom: `1px solid ${cardBorder}`,
        backgroundColor: '#0a0f1d',
        padding: '1.5rem'
      }}>
        <div style={{
          maxWidth: '64rem',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem'
        }}>
          {[
            { val: '142,920', label: 'Packets Scanned', icon: Activity, color: '#06b6d4' },
            { val: '389', label: 'Threats Blocked', icon: Shield, color: '#ef4444' },
            { val: '1.14ms', label: 'Inference Latency', icon: Zap, color: '#38bdf8' },
            { val: '99.28%', label: 'Classification Accuracy', icon: BarChart3, color: '#10b981' }
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="landing-hover-card" style={{
                textAlign: 'center',
                padding: '1.1rem 0.75rem',
                backgroundColor: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
              }}>
                <Icon size={18} color={s.color} style={{ marginBottom: '0.4rem' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: textPrimary, fontVariantNumeric: 'tabular-nums' }}>{s.val}</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: textMuted, marginTop: '0.2rem' }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================
          OUR CAPABILITIES (Alternating 2-Column Cards with Images)
          ============================================================ */}
      <section
        ref={capRef}
        style={{ padding: '5.5rem 1.5rem', maxWidth: '68rem', margin: '0 auto' }}
      >
        <div
          className={capVisible ? 'animate-slide-up' : ''}
          style={{ opacity: capVisible ? undefined : 0, textAlign: 'center', marginBottom: '3.5rem' }}
        >
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.15)',
            padding: '0.3rem 0.85rem',
            borderRadius: '9999px',
            border: '1px solid rgba(37,99,235,0.35)',
            display: 'inline-block',
            marginBottom: '0.65rem'
          }}>
            DEFENSIVE INTELLIGENCE
          </span>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)', fontWeight: 900, color: textPrimary, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            Our Defensive Capabilities
          </h2>
          <p style={{ fontSize: '0.95rem', color: textSecondary, margin: 0, maxWidth: '32rem', marginLeft: 'auto', marginRight: 'auto' }}>
            Multi-layered inspection, automated scenario emulation, and model health monitoring.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {CAPABILITIES.map((cap, idx) => {
            const isReversed = idx % 2 === 1;

            return (
              <div
                key={idx}
                className={capVisible ? `animate-slide-up-d${idx + 1}` : ''}
                style={{
                  opacity: capVisible ? undefined : 0,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '2rem',
                  alignItems: 'center'
                }}
              >
                {/* Visual Image Card (Reversible Order) */}
                <div
                  className="landing-hover-card"
                  style={{
                    order: isReversed ? 2 : 1,
                    position: 'relative',
                    height: '320px',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: `1px solid ${cardBorder}`,
                    boxShadow: '0 12px 36px rgba(0,0,0,0.5)'
                  }}
                >
                  <img
                    src={cap.img}
                    alt={cap.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'contrast(115%) brightness(95%)'
                    }}
                  />
                  {/* Subtle Gradient Over Image */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, transparent 40%, rgba(13,22,40,0.92) 100%)'
                  }} />

                  {/* Top-Right Badge on Image */}
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: 'rgba(7,11,20,0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(56,189,248,0.3)',
                    borderRadius: '9999px',
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#38bdf8'
                  }}>
                    {cap.metric}
                  </div>
                </div>

                {/* Text Content Card (Reversible Order) */}
                <div
                  style={{
                    order: isReversed ? 1 : 2,
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '24px',
                    padding: '2.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                  }}
                >
                  <span style={{
                    alignSelf: 'flex-start',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: cap.color,
                    marginBottom: '0.75rem'
                  }}>
                    {cap.badge}
                  </span>

                  <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: textPrimary, margin: '0 0 0.85rem 0', letterSpacing: '-0.02em' }}>
                    {cap.title}
                  </h3>

                  <p style={{ fontSize: '0.88rem', color: textSecondary, lineHeight: 1.65, margin: '0 0 1.5rem 0' }}>
                    {cap.desc}
                  </p>

                  <button
                    onClick={() => navigateTo(cap.target)}
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: '#2563eb',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '10px',
                      padding: '0.65rem 1.35rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 14px -3px rgba(37,99,235,0.4)',
                      transition: 'transform 0.2s ease, filter 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'none'; }}
                  >
                    {cap.action} <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          THREAT LIBRARY SECTION (3-Column Grid with Working Images)
          ============================================================ */}
      <section
        id="threat-library"
        ref={threatRef}
        style={{
          padding: '5.5rem 1.5rem',
          backgroundColor: '#0a0f1d',
          borderTop: `1px solid ${cardBorder}`,
          borderBottom: `1px solid ${cardBorder}`
        }}
      >
        <div style={{ maxWidth: '68rem', margin: '0 auto' }}>
          <div
            className={threatVisible ? 'animate-slide-up' : ''}
            style={{ opacity: threatVisible ? undefined : 0, textAlign: 'center', marginBottom: '2.5rem' }}
          >
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#06b6d4',
              backgroundColor: 'rgba(6,182,212,0.15)',
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              border: '1px solid rgba(6,182,212,0.25)',
              display: 'inline-block',
              marginBottom: '0.65rem'
            }}>
              MITRE ATT&CK SIGNATURES
            </span>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)', fontWeight: 900, color: textPrimary, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
              Threat Vectors & Projects
            </h2>
            <p style={{ fontSize: '0.95rem', color: textSecondary, margin: 0 }}>
              Cataloged adversarial attack signatures and automated defense blueprints.
            </p>
          </div>

          {/* Filter Pills */}
          <div
            className={threatVisible ? 'animate-slide-up-d1' : ''}
            style={{
              opacity: threatVisible ? undefined : 0,
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginBottom: '2.5rem'
            }}
          >
            {FILTER_TABS.map((tab) => {
              const active = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  style={{
                    padding: '0.45rem 1.15rem',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: active ? '1px solid #2563eb' : `1px solid ${cardBorder}`,
                    backgroundColor: active ? '#2563eb' : cardBg,
                    color: active ? '#fff' : textSecondary,
                    boxShadow: active ? '0 4px 14px -3px rgba(37,99,235,0.4)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.color = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor = cardBorder;
                      e.currentTarget.style.color = textSecondary;
                    }
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 3-Column Card Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredThreats.map((threat, idx) => (
              <div
                key={threat.id}
                className={`landing-hover-card ${threatVisible ? `animate-slide-up-d${Math.min(idx + 1, 5)}` : ''}`}
                style={{
                  opacity: threatVisible ? undefined : 0,
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '20px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.35)'
                }}
              >
                {/* Image Banner */}
                <div style={{ overflow: 'hidden', height: '175px', position: 'relative' }}>
                  <img
                    src={threat.img}
                    alt={threat.title}
                    className="threat-card-img"
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '0.85rem',
                    left: '0.85rem',
                    backgroundColor: 'rgba(7,11,20,0.85)',
                    backdropFilter: 'blur(6px)',
                    border: `1px solid ${threat.color}50`,
                    color: threat.color,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em'
                  }}>
                    {threat.tag}
                  </div>
                </div>

                <div style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: textPrimary,
                    margin: '0 0 0.5rem 0',
                    letterSpacing: '-0.01em'
                  }}>
                    {threat.title}
                  </h3>
                  <p style={{
                    fontSize: '0.82rem',
                    color: textSecondary,
                    lineHeight: 1.6,
                    margin: '0 0 1.25rem 0',
                    flex: 1
                  }}>
                    {threat.desc}
                  </p>

                  <button
                    onClick={() => navigateTo('traffic')}
                    style={{
                      alignSelf: 'flex-start',
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: 0
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#0891b2'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#2563eb'}
                  >
                    Analyze Vector <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          BOTTOM CTA
          ============================================================ */}
      <section style={{
        padding: '5rem 1.5rem',
        textAlign: 'center',
        backgroundColor: sectionBg
      }}>
        <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
          <h3 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 900, color: textPrimary, margin: '0 0 0.65rem 0', letterSpacing: '-0.02em' }}>
            Ready to deploy AI-powered perimeter defense?
          </h3>
          <p style={{ fontSize: '0.92rem', color: textSecondary, margin: '0 0 1.75rem 0', lineHeight: 1.6 }}>
            Launch the SOC Console to monitor ingress network flows, simulate adversarial attacks, and analyze feature drift.
          </p>
          <button
            onClick={() => navigateTo('dashboard')}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              padding: '0.85rem 2.2rem',
              fontSize: '0.92rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              cursor: 'pointer',
              boxShadow: '0 6px 24px -4px rgba(37,99,235,0.45)',
              transition: 'transform 0.2s ease, filter 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'none'; }}
          >
            Launch SOC Console <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer style={{
        borderTop: `1px solid ${cardBorder}`,
        padding: '1.25rem 1.5rem',
        backgroundColor: '#070b14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '68rem',
        margin: '0 auto',
        width: '100%',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', fontWeight: 700, color: textMuted }}>
          <Shield size={16} color="#2563eb" />
          ThreatLens v1.0 · AI-Powered IDS Defense Suite
        </div>
        <div style={{ fontSize: '0.72rem', color: textMuted, fontWeight: 500 }}>
          NSL-KDD Ingress Evaluation Corpus · Zero-Day Anomaly Detection
        </div>
      </footer>
    </div>
  );
}
