import i18n from '../i18n/i18n';

/**
 * Enhanced fetch wrapper that automatically attaches 
 * authentication tokens and language preferences.
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const language = i18n.language || 'en';

  const headers = {
    'Content-Type': 'application/json',
    'Accept-Language': language,
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`https://civitas-api-d6ox.onrender.com/api${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};

export default apiRequest;
