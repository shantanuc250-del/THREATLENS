import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TrafficAnalyzer from './pages/TrafficAnalyzer';
import Alerts from './pages/Alerts';
import ModelHealth from './pages/ModelHealth';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    try {
      localStorage.setItem('threatlens_theme', 'dark');
    } catch {}
  }, []);

  const navigateTo = (pageId) => {
    setCurrentPage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard navigateTo={navigateTo} />;
      case 'traffic':
        return <TrafficAnalyzer navigateTo={navigateTo} />;
      case 'alerts':
        return <Alerts navigateTo={navigateTo} />;
      case 'health':
        return <ModelHealth navigateTo={navigateTo} />;
      default:
        return <Dashboard navigateTo={navigateTo} />;
    }
  };

  return (
    <div
      className="dark"
      style={{
        minHeight: '100vh',
        backgroundColor: '#070b14',
        color: '#f8fafc',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top SOC Navbar */}
      <Navbar currentPage={currentPage} navigateTo={navigateTo} />

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        maxWidth: '1140px',
        width: '100%',
        margin: '0 auto',
        padding: '1.5rem 1.25rem 2.5rem 1.25rem',
        boxSizing: 'border-box'
      }}>
        {renderPage()}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #141f33',
        padding: '0.85rem 1.5rem',
        backgroundColor: '#05080f',
        fontSize: '0.72rem',
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, color: '#94a3b8' }}>THREATLENS</span>
          <span>•</span>
          <span>AI-Powered Network Threat Detection System</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Dataset: NSL-KDD</span>
          <span>Model: Random Forest (v1.0)</span>
          <span style={{ color: '#10b981', fontWeight: 600 }}>● Operational</span>
        </div>
      </footer>
    </div>
  );
}