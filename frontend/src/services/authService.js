import api from './api';
import { API_URL } from '../config';

const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response;
  },

  submitDriverApplication: async (formData) => {
    const response = await api.post('/api/driver-applications', formData);
    return response;
  },

  getLicensePhoto: (filename) => {
    return `${API_URL}/driver-applications/license-photo/${filename}`;
  }
};

export default authService; 