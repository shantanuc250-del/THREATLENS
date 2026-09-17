import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Health
export const getHealth = () => api.get('/health');

// Dashboard
export const getDashboard = () => api.get('/dashboard');
export const getTimeline = (range = '24h') => api.get(`/dashboard/timeline?range=${range}`);

// Predictions
export const predictSingle = (data) => api.post('/predict', data);
export const analyzeCSV = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/analyze-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
};

// Alerts
export const getAlerts = (params = {}) => api.get('/alerts', { params });
export const getAlert = (id) => api.get(`/alerts/${id}`);
export const updateAlert = (id, data) => api.patch(`/alerts/${id}`, data);

// Model
export const getModelMetrics = () => api.get('/model/metrics');
export const getModelInfo = () => api.get('/model/info');
export const getModelDrift = () => api.get('/model/drift');

// Simulation
export const startSimulation = (rate = 50) => api.post('/simulation/start', { rate });
export const stopSimulation = () => api.post('/simulation/stop');
export const getSimulationStatus = () => api.get('/simulation/status');

export default api;
