import i18n from '../i18n/i18n';

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const language = i18n.language || 'en';

  const headers = {
    'Content-Type': 'application/json',
    'Accept-Language': language,
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  // ✅ DYNAMIC BASE_URL: Switches between localhost and Render
  const isLocal = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' || 
                   window.location.hostname.startsWith('192.168.') || 
                   window.location.hostname.startsWith('10.') ||
                   window.location.hostname.endsWith('.local');

  const BASE_URL = isLocal
    ? 'http://localhost:3000/api'
    : 'https://civitas-api-d6ox.onrender.com/api';

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};

export default apiRequest;
