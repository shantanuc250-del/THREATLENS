import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import TrafficAnalyzer from './pages/TrafficAnalyzer';
import Alerts from './pages/Alerts';
import AlertDetail from './pages/AlertDetail';
import ModelPerformance from './pages/ModelPerformance';
import ModelHealth from './pages/ModelHealth';
import SettingsPage from './pages/SettingsPage';
import { getModelInfo, getSimulationStatus } from './services/api';

function App() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [modelInfo, setModelInfo] = useState(null);
  const [simulation, setSimulation] = useState({ is_running: false });

  useEffect(() => {
    const fetchGlobals = async () => {
      try {
        const [infoRes, simRes] = await Promise.all([
          getModelInfo().catch(() => ({ data: null })),
          getSimulationStatus().catch(() => ({ data: { is_running: false } })),
        ]);
        setModelInfo(infoRes.data);
        setSimulation(simRes.data);
      } catch (err) {
        console.error('Global fetch error:', err);
      }
    };
    fetchGlobals();
    const interval = setInterval(fetchGlobals, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a0e1a] text-slate-200 antialiased selection:bg-blue-500/30">
        {/* Grid Application Shell — Collapsed 68px, Expanded 250px */}
        <div
          className={`grid min-h-screen w-full transition-[grid-template-columns] duration-200 ease-in-out ${
            isCollapsed ? 'grid-cols-[68px_minmax(0,1fr)]' : 'grid-cols-[250px_minmax(0,1fr)]'
          }`}
        >
          {/* Sidebar Navigation Column */}
          <Sidebar
            isCollapsed={isCollapsed}
            onToggle={() => setIsCollapsed(!isCollapsed)}
            modelInfo={modelInfo}
            simulation={simulation}
          />

          {/* Main Dashboard Content Column */}
          <div className="flex flex-col min-w-0 w-full min-h-screen">
            <Header simulation={simulation} modelInfo={modelInfo} />

            {/* Main Content Viewport */}
            <main className="flex-1 p-6 lg:p-8 w-full max-w-full box-border min-w-0">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/analyzer" element={<TrafficAnalyzer />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/alerts/:id" element={<AlertDetail />} />
                <Route path="/model" element={<ModelPerformance />} />
                <Route path="/health" element={<ModelHealth />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
