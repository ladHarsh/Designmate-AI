import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // No redirect or forced navigation here; just reject the error
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me', { headers: { 'Cache-Control': 'no-cache' } }),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (currentPassword, newPassword) => 
    api.put('/auth/password', { currentPassword, newPassword }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => 
    api.put(`/auth/reset-password/${token}`, { password }),
  logout: () => api.post('/auth/logout'),
  getUsage: () => api.get('/auth/usage'),
};

// Layout API
export const layoutAPI = {
  generate: (data) => api.post('/layout/generate', data),
  getMyLayouts: (params) => api.get('/layout/my-layouts', { params }),
  getLayout: (id) => api.get(`/layout/${id}`),
  updateLayout: (id, data) => api.put(`/layout/${id}`, data),
  deleteLayout: (id) => api.delete(`/layout/${id}`),
  likeLayout: (id) => api.post(`/layout/${id}/like`),
  getPopular: (params) => api.get('/layout/explore/popular', { params }),
  getTrending: (params) => api.get('/layout/explore/trending', { params }),
  searchLayouts: (params) => api.get('/layout/explore/search', { params }),
  getTemplates: (params) => api.get('/layout/templates', { params }),
  downloadLayout: (id) => api.post(`/layout/${id}/download`),
};

// Color API
export const colorAPI = {
  generate: (data) => api.post('/colors/generate', data),
  getMyPalettes: (params) => api.get('/colors/my-palettes', { params }),
  getPalette: (id) => api.get(`/colors/${id}`),
  updatePalette: (id, data) => api.put(`/colors/${id}`, data),
  deletePalette: (id) => api.delete(`/colors/${id}`),
  likePalette: (id) => api.post(`/colors/${id}/like`),
  getPopular: (params) => api.get('/colors/explore/popular', { params }),
  getTrending: (params) => api.get('/colors/explore/trending', { params }),
  getByMood: (mood, params) => api.get(`/colors/explore/mood/${mood}`, { params }),
  searchPalettes: (params) => api.get('/colors/explore/search', { params }),
  getTrends: () => api.get('/colors/trends'),
  downloadPalette: (id) => api.post(`/colors/${id}/download`),
};

// Font API
export const fontAPI = {
  suggest: (data) => api.post('/fonts/suggest', data),
  getPairings: (params) => api.get('/fonts/pairings', { params }),
  getTrends: () => api.get('/fonts/trends'),
};

// UX Audit API
export const auditAPI = {
  analyze: (formData) => api.post('/audit/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getReports: () => api.get('/audit/reports'),
};

// Trends API
export const trendsAPI = {
  getCurrent: () => api.get('/trends/current'),
  getPlatforms: (params) => api.get('/trends/platforms', { params }),
  getByIndustry: (industry) => api.get(`/trends/industry/${industry}`),
  getAnalysis: () => api.get('/trends/analysis'),
  getForecast: () => api.get('/trends/forecast'),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getUsage: () => api.get('/users/usage'),
  getDashboard: () => api.get('/users/dashboard'),
  getSettings: () => api.get('/users/settings'),
  updateSettings: (data) => api.put('/users/settings', data),
  // Admin routes
  getAllUsers: (params) => api.get('/users/admin/all', { params }),
  updateUserRole: (id, role) => api.put(`/users/admin/${id}/role`, { role }),
  updateUserStatus: (id, isActive) => api.put(`/users/admin/${id}/status`, { isActive }),
};

// Utility functions
export const apiUtils = {
  // Handle API errors
  handleError: (error) => {
    if (error.response) {
      return error.response.data.message || 'An error occurred';
    } else if (error.request) {
      return 'Network error. Please check your connection.';
    } else {
      return error.message || 'An unexpected error occurred';
    }
  },

  // Create query params
  createParams: (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    return searchParams.toString();
  },

  // Upload file with progress
  uploadWithProgress: (url, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      },
    });
  },
};

export default api; 