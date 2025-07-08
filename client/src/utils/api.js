import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

export const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };

  const config = {
    method,
    headers,
    ...(data && { data })
  };

  try {
    const response = await api.request({
      url: endpoint,
      ...config
    });
    
    return response.data;
  } catch (error) {
    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }

      if (status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      throw new Error(data.error || `HTTP ${status}: ${data.message || ''}`);
    }

    // Handle network or other errors
    throw new Error(`API Error: ${error.message}`);
  }
};