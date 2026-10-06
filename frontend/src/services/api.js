import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return `${envUrl.replace(/\/$/, '')}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Health & Telemetry
export const getHealth = () => api.get('/health');

// Dashboard Overview & Timeline
export const getDashboard = () => api.get('/dashboard');
export const getTimeline = (range = '24h') => api.get(`/dashboard/timeline?range=${range}`);

// Single & Batch Prediction
export const predictSingle = (data) => api.post('/predict', data);
export const analyzeCSV = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/analyze-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
};

// Incident Alerts
export const getAlerts = (params = {}) => api.get('/alerts', { params });
export const getAlert = (id) => api.get(`/alerts/${id}`);
export const updateAlert = (id, data) => api.patch(`/alerts/${id}`, data);

// Model Metrics, Info & Drift
export const getModelMetrics = () => api.get('/model/metrics');
export const getModelInfo = () => api.get('/model/info');
export const getModelDrift = () => api.get('/model/drift');

// IP Intelligence & VPN Detection
export const getIPIntelligence = (ip) => api.get(`/ip-intelligence/${encodeURIComponent(ip)}`);

// Live Simulator Telemetry
export const startSimulation = (rate = 50) => api.post('/simulation/start', { rate });
export const stopSimulation = () => api.post('/simulation/stop');
export const getSimulationStatus = () => api.get('/simulation/status');

export default api;
