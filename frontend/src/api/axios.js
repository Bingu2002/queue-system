// src/api/axios.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Matches your Node.js port
});

// Automatically inject Bearer Token into protected routes
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;