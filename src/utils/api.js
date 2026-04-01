// src/utils/api.js - Axios instance with base config
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Response interceptor - unwrap data
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

export default api;

// ── Farmers ──────────────────────────────────────────────────
export const farmersAPI = {
  getAll:  (params) => api.get('/farmers', { params }),
  getById: (id)     => api.get(`/farmers/${id}`),
  create:  (data)   => api.post('/farmers', data),
  update:  (id, d)  => api.put(`/farmers/${id}`, d),
  delete:  (id)     => api.delete(`/farmers/${id}`),
};

// ── Land Usage ───────────────────────────────────────────────
export const landAPI = {
  getAll:  (params) => api.get('/land', { params }),
  create:  (data)   => api.post('/land', data),
  update:  (id, d)  => api.put(`/land/${id}`, d),
  delete:  (id)     => api.delete(`/land/${id}`),
};

// ── Payments ─────────────────────────────────────────────────
export const paymentsAPI = {
  getAll:  (params) => api.get('/payments', { params }),
  create:  (data)   => api.post('/payments', data),
  delete:  (id)     => api.delete(`/payments/${id}`),
};

// ── Rates ────────────────────────────────────────────────────
export const ratesAPI = {
  getAll:  (params) => api.get('/rates', { params }),
  getYears: ()      => api.get('/rates/years'),
  set:     (data)   => api.post('/rates', data),
};

// ── Dashboard ────────────────────────────────────────────────
export const dashboardAPI = {
  getSummary:       (params) => api.get('/dashboard/summary', { params }),
  getDefaulters:    (params) => api.get('/dashboard/defaulters', { params }),
  getFarmerBilling: (id, params) => api.get(`/dashboard/farmer/${id}`, { params }),
  getExport:        (params) => api.get('/dashboard/export', { params }),
};
