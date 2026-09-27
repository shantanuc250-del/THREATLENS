import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Layout components
import Navbar from './components/Navbar';
import SidebarDrawer from './components/SidebarDrawer';

// Page components
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import TrafficAnalyzer from './pages/TrafficAnalyzer';
import Simulator from './pages/Simulator';
import RiskMatrix from './pages/RiskMatrix';
import ModelHealth from './pages/ModelHealth';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // SOC Stats (shared with Dashboard)
  const [stats, setStats] = useState({
    totalTraffic: '142,920',
    threatsBlocked: '389',
    networkHealth: '99.4%',
    activeSims: '1',
    dosCount: '226',
    probeCount: '101',
    r2lCount: '62'
  });

  // Alerts (shared with Dashboard + Alerts page)
  const [alerts] = useState([
    {
      id: 'AL-902',
      time: '14:22:01',
      type: 'DDoS SYN Flood',
      source: '192.168.1.105',
      destination: '10.0.0.1:80',
      protocol: 'TCP',
      risk: 'Critical',
      status: 'Blocked',
      mitre: 'T1498.001',
      description: 'Massive volume of incomplete TCP handshakes starving socket buffer pools.'
    },
    {
      id: 'AL-901',
      time: '14:18:40',
      type: 'Port Sweep / Probe',
      source: '10.0.0.18',
      destination: '10.0.0.1:20-443',
      protocol: 'TCP',
      risk: 'Medium',
      status: 'Flagged',
      mitre: 'T1046',
      description: 'Sequential rapid SYN requests scanning for accessible service listeners.'
    },
    {
      id: 'AL-900',
      time: '13:55:12',
      type: 'SSH Brute Force',
      source: '172.16.4.22',
      destination: '10.0.0.5:22',
      protocol: 'TCP',
      risk: 'High',
      status: 'Blocked',
      mitre: 'T1110',
      description: 'Exceeded threshold of 45 invalid credentials submissions per minute.'
    },
    {
      id: 'AL-899',
      time: '13:30:05',
      type: 'Buffer Overflow Attempt',
      source: '10.0.0.99',
      destination: '10.0.0.2:8080',
      protocol: 'UDP',
      risk: 'Critical',
      status: 'Blocked',
      mitre: 'T1203',
      description: 'Large malformed string injected into HTTP application header buffer.'
    }
  ]);

  useEffect(() => {
    const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    axios.get(`${apiBase}/api/dashboard`)
      .then((res) => {
        if (res.data) {
          setStats((prev) => ({
            ...prev,
            totalTraffic: res.data.total_traffic || prev.totalTraffic,
            threatsBlocked: res.data.threats_blocked || prev.threatsBlocked,
            networkHealth: res.data.health || prev.networkHealth,
            activeSims: res.data.active_sims || prev.activeSims
          }));
        }
      })
      .catch(() => {});
  }, []);

  const navigateTo = (pageId) => {
    setCurrentPage(pageId);
    setIsDrawerOpen(false);
  };

  // Page map — always renders exactly one component, no conditional hooks
  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <Landing navigateTo={navigateTo} />;
      case 'dashboard':
        return <Dashboard stats={stats} setStats={setStats} alerts={alerts} navigateTo={navigateTo} />;
      case 'alerts':
        return <Alerts alerts={alerts} />;
      case 'traffic':
        return <TrafficAnalyzer />;
      case 'simulate':
        return <Simulator />;
      case 'risk':
        return <RiskMatrix />;
      case 'health':
        return <ModelHealth />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard stats={stats} setStats={setStats} alerts={alerts} navigateTo={navigateTo} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b13', color: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar currentPage={currentPage} navigateTo={navigateTo} onOpenDrawer={() => setIsDrawerOpen(true)} />
      <SidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} currentPage={currentPage} navigateTo={navigateTo} />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.75rem 1.25rem' }}>
        {renderPage()}
      </main>
    </div>
  );
}